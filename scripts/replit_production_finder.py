#!/usr/bin/env python3
"""
replit_production_finder.py
Discover Replit apps, keep only those that expose their codebase (GitHub/GitLab),
enrich via GitHub API, score for 'production' quality, and optionally clone them.

Usage examples:
  # Basic run (uses SerpAPI if SERPAPI_API_KEY set, otherwise googlesearch)
  python replit_production_finder.py --dorks-file dorks.txt --max-results 50 --min-score 10 --clone

  # Single query
  python replit_production_finder.py --query 'site:repl.co \"github.com\" \"dashboard\"' --max-results 30
"""

import os
import re
import sys
import time
import json
import csv
import argparse
import subprocess
from urllib.parse import urlparse
from collections import defaultdict

import requests
from bs4 import BeautifulSoup

# Optional fallback (install with pip install googlesearch-python)
try:
    from googlesearch import search as google_search
except Exception:
    google_search = None

# ---------------------------
# Configurable thresholds
# ---------------------------
PRODUCTION_SCORE_THRESHOLD = 10  # tuneable
DEFAULT_MAX_RESULTS = 30
USER_AGENT = "Mozilla/5.0 (X11; Linux x86_64) ReplitProductionFinder/1.0"

# ---------------------------
# Utilities
# ---------------------------
def log(msg):
    print(f"[+] {msg}")

def err(msg):
    print(f"[!] {msg}", file=sys.stderr)

# ---------------------------
# 1) Search (SerpAPI preferred, fallback to googlesearch)
# ---------------------------
def serpapi_search(query, num=20):
    key = os.getenv("SERPAPI_API_KEY")
    if not key:
        raise RuntimeError("SERPAPI_API_KEY not set")
    url = "https://serpapi.com/search.json"
    params = {"engine": "google", "q": query, "num": num, "api_key": key}
    r = requests.get(url, params=params, timeout=20)
    r.raise_for_status()
    j = r.json()
    results = []
    for o in j.get("organic_results", []):
        link = o.get("link") or o.get("url")
        if link:
            results.append(link)
    return results

def google_search_fallback(query, num=20):
    if google_search is None:
        raise RuntimeError("googlesearch not installed and no SerpAPI key provided")
    results = []
    # google_search yields urls iteratively
    for url in google_search(query, num=num, stop=num, pause=2.0):
        results.append(url)
    return results

def search_query(query, num=20):
    """Try SerpAPI first, otherwise fallback."""
    key = os.getenv("SERPAPI_API_KEY")
    try:
        if key:
            return serpapi_search(query, num=num)
    except Exception as e:
        err(f"SerpAPI failed: {e}")
    # fallback
    return google_search_fallback(query, num=num)

# ---------------------------
# 2) Fetch page and extract repo links
# ---------------------------
GITHUB_REPO_REGEX = re.compile(r"https?://github\.com/([A-Za-z0-9_.-]+)/([A-Za-z0-9_.-]+)(?:/|$)")
GITLAB_REPO_REGEX = re.compile(r"https?://gitlab\.com/([A-Za-z0-9_.-]+)/([A-Za-z0-9_.-]+)(?:/|$)")

def fetch_html(url, timeout=12):
    headers = {"User-Agent": USER_AGENT}
    try:
        r = requests.get(url, headers=headers, timeout=timeout)
        r.raise_for_status()
        return r.text
    except Exception as e:
        err(f"Failed to fetch {url}: {e}")
        return ""

def extract_repo_links(html):
    """Return set of repo URLs (github/gitlab) parsed from html"""
    found = set()
    for m in GITHUB_REPO_REGEX.finditer(html):
        owner, repo = m.group(1), m.group(2)
        found.add(f"https://github.com/{owner}/{repo}")
    for m in GITLAB_REPO_REGEX.finditer(html):
        owner, repo = m.group(1), m.group(2)
        found.add(f"https://gitlab.com/{owner}/{repo}")
    # Also inspect anchor tags for full links (some repos may include '/owner/repo' relative)
    soup = BeautifulSoup(html, "html.parser")
    for a in soup.find_all("a", href=True):
        href = a["href"]
        if href.startswith("https://github.com/"):
            m = GITHUB_REPO_REGEX.match(href)
            if m:
                found.add(m.group(0))
    return found

# ---------------------------
# 3) GitHub API helpers
# ---------------------------
GITHUB_API = "https://api.github.com"

def gh_headers():
    token = os.getenv("GITHUB_TOKEN")
    headers = {"Accept": "application/vnd.github+json", "User-Agent": USER_AGENT}
    if token:
        headers["Authorization"] = f"token {token}"
    return headers

def get_github_repo_api(owner, repo):
    url = f"{GITHUB_API}/repos/{owner}/{repo}"
    r = requests.get(url, headers=gh_headers(), timeout=12)
    if r.status_code == 404:
        return None
    r.raise_for_status()
    return r.json()

def check_github_path_exists(owner, repo, path):
    url = f"{GITHUB_API}/repos/{owner}/{repo}/contents/{path}"
    r = requests.get(url, headers=gh_headers(), timeout=10)
    return r.status_code == 200

def get_commit_count(owner, repo):
    # Use the commits endpoint with per_page=1 and use Link header to derive count
    url = f"{GITHUB_API}/repos/{owner}/{repo}/commits"
    r = requests.get(url, headers=gh_headers(), params={"per_page": 1}, timeout=12)
    if r.status_code == 404:
        return 0
    r.raise_for_status()
    link = r.headers.get("Link", "")
    if 'rel="last"' in link:
        # parse last page num
        m = re.search(r'&page=(\d+)>; rel="last"', link)
        if m:
            try:
                return int(m.group(1))
            except:
                pass
    # fallback: length of returned list
    try:
        return len(r.json())
    except:
        return 0

def get_contributor_count(owner, repo):
    # /contributors?per_page=1 + Link header trick
    url = f"{GITHUB_API}/repos/{owner}/{repo}/contributors"
    r = requests.get(url, headers=gh_headers(), params={"per_page": 1}, timeout=12)
    if r.status_code == 404:
        return 0
    # Some repos block this or return 202 for large ones
    try:
        r.raise_for_status()
    except:
        return 0
    link = r.headers.get("Link", "")
    if 'rel="last"' in link:
        m = re.search(r'&page=(\d+)>; rel="last"', link)
        if m:
            return int(m.group(1))
    # fallback
    try:
        return len(r.json())
    except:
        return 0

# ---------------------------
# 4) Scoring function (production-grade heuristic)
# ---------------------------
def score_repo(meta):
    """
    meta: dict with keys: stargazers_count, forks_count, has_ci, has_dockerfile,
          has_procfile, has_package_json, has_requirements, commit_count,
          contributor_count, readme_len, license
    Returns score (int)
    """
    s = 0
    stars = meta.get("stargazers_count", 0)
    forks = meta.get("forks_count", 0)
    commits = meta.get("commit_count", 0)
    contributors = meta.get("contributor_count", 0)
    readme_len = meta.get("readme_len", 0)
    has_ci = meta.get("has_ci", False)
    has_docker = meta.get("has_dockerfile", False)
    has_proc = meta.get("has_procfile", False)
    has_deps = meta.get("has_package_json", False) or meta.get("has_requirements", False)
    license_present = bool(meta.get("license"))

    # Stars & forks
    if stars >= 100:
        s += 5
    elif stars >= 30:
        s += 3
    elif stars >= 10:
        s += 2

    if forks >= 50:
        s += 3
    elif forks >= 10:
        s += 2

    # Activity
    if commits >= 500:
        s += 5
    elif commits >= 100:
        s += 3
    elif commits >= 30:
        s += 2

    # Contributors
    if contributors >= 10:
        s += 4
    elif contributors >= 3:
        s += 2

    # Dev ops signals
    if has_ci:
        s += 3
    if has_docker:
        s += 2
    if has_proc:
        s += 2
    if has_deps:
        s += 2

    # README & license
    if readme_len >= 2000:
        s += 2
    elif readme_len >= 500:
        s += 1
    if license_present:
        s += 1

    return s

# ---------------------------
# 5) Clone & analyze local repo (optional)
# ---------------------------
def git_clone(repo_url, target_dir, depth=1):
    os.makedirs(target_dir, exist_ok=True)
    cmd = ["git", "clone", "--depth", str(depth), repo_url, target_dir]
    try:
        subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        return True
    except Exception as e:
        err(f"git clone failed for {repo_url}: {e}")
        return False

def analyze_local_repo(path):
    total_files = 0
    total_lines = 0
    for root, _, files in os.walk(path):
        for f in files:
            if f.endswith((".py", ".js", ".ts", ".jsx", ".tsx", ".html", ".css")):
                total_files += 1
                try:
                    with open(os.path.join(root, f), "r", encoding="utf-8", errors="ignore") as fh:
                        total_lines += sum(1 for _ in fh)
                except:
                    pass
    return {"total_files": total_files, "total_lines": total_lines}

# ---------------------------
# Main orchestration
# ---------------------------
def find_production_repl_apps(queries, max_results=DEFAULT_MAX_RESULTS, clone=False, min_score=PRODUCTION_SCORE_THRESHOLD, out_csv="production_replit_projects.csv"):
    log("Starting run")
    candidates = set()

    # Run through queries and collect URLs
    for q in queries:
        log(f"Searching: {q}")
        try:
            results = search_query(q, num=max_results)
        except Exception as e:
            err(f"Search failed for query: {q} -> {e}")
            results = []
        for u in results:
            # Normalize and only keep repl.co / replit.com links
            parsed = urlparse(u)
            if parsed.netloc.endswith("repl.co") or parsed.netloc.endswith("replit.com"):
                candidates.add(u.split("#")[0].split("?")[0])

    log(f"Collected {len(candidates)} Replit candidate URLs")

    repo_set = set()
    mapping_pages_to_repos = defaultdict(set)

    # For each candidate page, fetch and extract repo links
    for url in list(candidates):
        html = fetch_html(url)
        repo_links = extract_repo_links(html)
        if repo_links:
            for r in repo_links:
                repo_set.add(r)
                mapping_pages_to_repos[url].add(r)
        else:
            # If no repo link found, look for obvious strings that indicate code exposure (rare)
            if "github.com" in html or "gitlab.com" in html:
                # try a simple find of substring (less reliable)
                for match in GITHUB_REPO_REGEX.finditer(html):
                    repo_set.add(f"https://github.com/{match.group(1)}/{match.group(2)}")

    log(f"Found {len(repo_set)} unique repos referenced from candidate pages")

    # Enrich & score repos
    final_rows = []
    for repo_url in repo_set:
        log(f"Processing repo {repo_url}")
        mo = re.match(r"https?://github\.com/([^/]+)/([^/]+)", repo_url)
        if not mo:
            log(f"Skipping non-github or unparseable repo: {repo_url}")
            continue
        owner, repo = mo.group(1), mo.group(2)

        meta = get_github_repo_api(owner, repo)
        if not meta:
            err(f"Repo metadata could not be retrieved: {owner}/{repo}")
            continue

        # quick checks
        if meta.get("archived", False):
            log(f"Repo is archived; skipping: {owner}/{repo}")
            continue

        # collect features
        commit_count = get_commit_count(owner, repo)
        contributor_count = get_contributor_count(owner, repo)
        has_ci = check_github_path_exists(owner, repo, ".github/workflows")
        has_dockerfile = check_github_path_exists(owner, repo, "Dockerfile")
        has_procfile = check_github_path_exists(owner, repo, "Procfile")
        has_package_json = check_github_path_exists(owner, repo, "package.json")
        has_requirements = check_github_path_exists(owner, repo, "requirements.txt")
        readme_len = 0
        try:
            rr = requests.get(f"{GITHUB_API}/repos/{owner}/{repo}/readme", headers=gh_headers(), timeout=10)
            if rr.status_code == 200:
                rd = rr.json()
                import base64
                content = base64.b64decode(rd.get("content", "")).decode("utf-8", errors="ignore")
                readme_len = len(content)
        except Exception:
            pass

        enriched = {
            "repo_url": repo_url,
            "owner": owner,
            "repo": repo,
            "stargazers_count": meta.get("stargazers_count", 0),
            "forks_count": meta.get("forks_count", 0),
            "size_kb": meta.get("size", 0),
            "commit_count": commit_count,
            "contributor_count": contributor_count,
            "has_ci": has_ci,
            "has_dockerfile": has_dockerfile,
            "has_procfile": has_procfile,
            "has_package_json": has_package_json,
            "has_requirements": has_requirements,
            "readme_len": readme_len,
            "license": meta.get("license", {}).get("name") if meta.get("license") else None
        }

        enriched["score"] = score_repo(enriched)
        enriched["pages_linking"] = ";".join(mapping_pages_to_repos.get(next(iter(mapping_pages_to_repos), ""), []))

        # Filter by score threshold
        if enriched["score"] >= min_score:
            enriched["category"] = "production"
            log(f"--> Marked production (score {enriched['score']}): {repo_url}")
            # Optionally clone
            if clone:
                target_name = f"cloned_repos/{owner}_{repo}"
                ok = git_clone(repo_url, target_name, depth=1)
                if ok:
                    local_stats = analyze_local_repo(target_name)
                    enriched.update(local_stats)
        else:
            enriched["category"] = "non-production"
            log(f"--> Skipped (score {enriched['score']}): {repo_url}")

        final_rows.append(enriched)

    # Write CSV (production only)
    with open(out_csv, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        header = ["repo_url", "owner", "repo", "stars", "forks", "commits", "contributors",
                  "has_ci", "has_dockerfile", "has_procfile", "has_package_json", "has_requirements",
                  "readme_len", "license", "score", "category", "total_files", "total_lines"]
        writer.writerow(header)
        for r in sorted(final_rows, key=lambda x: x["score"], reverse=True):
            writer.writerow([
                r.get("repo_url"),
                r.get("owner"),
                r.get("repo"),
                r.get("stargazers_count"),
                r.get("forks_count"),
                r.get("commit_count"),
                r.get("contributor_count"),
                r.get("has_ci"),
                r.get("has_dockerfile"),
                r.get("has_procfile"),
                r.get("has_package_json"),
                r.get("has_requirements"),
                r.get("readme_len"),
                r.get("license"),
                r.get("score"),
                r.get("category"),
                r.get("total_files", ""),
                r.get("total_lines", "")
            ])

    log(f"Finished. Results written to {out_csv}")
    return final_rows

# ---------------------------
# Command line interface
# ---------------------------
def load_dorks_from_file(path):
    q = []
    with open(path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#"):
                q.append(line)
    return q

def main():
    p = argparse.ArgumentParser(description="Find production-grade Replit apps exposing code.")
    p.add_argument("--query", help="Single dork query (overrides --dorks-file)", type=str)
    p.add_argument("--dorks-file", help="File containing dork queries (one per line)", default="dorks.txt")
    p.add_argument("--max-results", help="Max results per query", type=int, default=DEFAULT_MAX_RESULTS)
    p.add_argument("--min-score", help="Minimum production score to keep", type=int, default=PRODUCTION_SCORE_THRESHOLD)
    p.add_argument("--clone", help="Clone repositories that pass the threshold", action="store_true")
    p.add_argument("--out", help="CSV output filename", default="production_replit_projects.csv")
    args = p.parse_args()

    if args.query:
        queries = [args.query]
    else:
        if not os.path.exists(args.dorks_file):
            err(f"Dorks file not found: {args.dorks_file}")
            sys.exit(1)
        queries = load_dorks_from_file(args.dorks_file)

    find_production_repl_apps(queries, max_results=args.max_results, clone=args.clone, min_score=args.min_score, out_csv=args.out)

if __name__ == "__main__":
    main()