# replit_finder/main.py
import asyncio
import csv
import re
from collections import defaultdict
from urllib.parse import urlparse
import aiohttp

from . import analysis, cloner, github_api, scraper, search, database
from .config import DEFAULT_MAX_RESULTS, PRODUCTION_SCORE_THRESHOLD


async def process_repo(session: aiohttp.ClientSession, repo_url: str, min_score: int, clone: bool, mapping_pages_to_repos: dict | None = None) -> dict | None:
    """Processes a single repository: fetches data, scores it, and optionally clones it."""
    if database.is_repo_processed(repo_url):
        print(f"[-] Skipping already processed repo: {repo_url}")
        return None

    print(f"[+] Processing repo {repo_url}")
    mo = re.match(r"https?://github\.com/([^/]+)/([^/]+)", repo_url)
    if not mo:
        print(f"[-] Skipping non-github or unparseable repo: {repo_url}")
        return None
    owner, repo = mo.group(1), mo.group(2)

    meta = await github_api.get_github_repo_api(session, owner, repo)
    if not meta:
        print(f"[!] Repo metadata could not be retrieved: {owner}/{repo}")
        return None

    if meta.get("archived", False):
        print(f"[-] Repo is archived; skipping: {owner}/{repo}")
        return None

    # Gather all GitHub API calls concurrently
    tasks = {
        "commit_count": github_api.get_commit_count(session, owner, repo),
        "contributor_count": github_api.get_contributor_count(session, owner, repo),
        "has_ci": github_api.check_github_path_exists(session, owner, repo, ".github/workflows"),
        "has_dockerfile": github_api.check_github_path_exists(session, owner, repo, "Dockerfile"),
        "has_procfile": github_api.check_github_path_exists(session, owner, repo, "Procfile"),
        "has_package_json": github_api.check_github_path_exists(session, owner, repo, "package.json"),
        "has_requirements": github_api.check_github_path_exists(session, owner, repo, "requirements.txt"),
        "readme_len": github_api.get_readme_len(session, owner, repo),
    }
    results = await asyncio.gather(*tasks.values())
    enriched_features = dict(zip(tasks.keys(), results))

    enriched = {
        "repo_url": repo_url,
        "owner": owner,
        "repo": repo,
        "stars": meta.get("stargazers_count", 0),
        "forks": meta.get("forks_count", 0),
        "license": meta.get("license", {}).get("name") if meta.get("license") else None,
        "language": meta.get("language"),
        **enriched_features,
        "trufflehog_findings": 0, # Default values
        "bandit_findings": 0,
        "total_files": 0,
        "total_lines": 0,
        "pages_linking": "",
    }

    if clone:
        target_name = f"cloned_repos/{owner}_{repo}"
        ok = cloner.git_clone(repo_url, target_name, depth=1)
        if ok:
            # Run local analysis only if clone is successful
            local_stats = analysis.analyze_local_repo(target_name)
            enriched.update(local_stats)

    if mapping_pages_to_repos:
        pages = [page for page, repos in mapping_pages_to_repos.items() if repo_url in repos]
        enriched["pages_linking"] = ";".join(pages)

    enriched["score"] = analysis.score_repo(enriched)

    if enriched["score"] >= min_score:
        enriched["category"] = "production"
        print(f"--> Marked production (score {enriched['score']}): {repo_url}")
    else:
        enriched["category"] = "non-production"

    # Ensure all keys for the database are present
    final_data_for_db = {
        'repo_url': enriched.get('repo_url'),
        'owner': enriched.get('owner'),
        'repo': enriched.get('repo'),
        'stars': enriched.get('stars'),
        'forks': enriched.get('forks'),
        'commits': enriched.get('commit_count'),
        'contributors': enriched.get('contributor_count'),
        'has_ci': enriched.get('has_ci'),
        'has_dockerfile': enriched.get('has_dockerfile'),
        'has_procfile': enriched.get('has_procfile'),
        'has_package_json': enriched.get('has_package_json'),
        'has_requirements': enriched.get('has_requirements'),
        'readme_len': enriched.get('readme_len'),
        'license': enriched.get('license'),
        'score': enriched.get('score'),
        'category': enriched.get('category'),
        'total_files': enriched.get('total_files'),
        'total_lines': enriched.get('total_lines'),
        'trufflehog_findings': enriched.get('trufflehog_findings'),
        'bandit_findings': enriched.get('bandit_findings'),
        'pages_linking': enriched.get('pages_linking'),
        'language': enriched.get('language'),
    }

    database.insert_repository(final_data_for_db)
    return enriched


async def find_production_repl_apps(
    queries: list[str] = None,
    max_results: int = DEFAULT_MAX_RESULTS,
    clone: bool = False,
    min_score: int = PRODUCTION_SCORE_THRESHOLD,
    out_csv: str = "production_replit_projects.csv",
    progress_callback=None,
):
    """
    Main orchestration function to find production-grade Replit apps.
    """
    database.init_db()
    print("[+] Starting run")
    
    if progress_callback:
        progress_callback("Initializing search...", 0, 100)

    # Use default dorks if no queries provided
    if not queries:
        with open("dorks.txt", "r") as f:
            queries = [line.strip() for line in f if line.strip()]

    async with aiohttp.ClientSession() as session:
        # Search for candidates
        if progress_callback:
            progress_callback("Searching for candidate URLs...", 10, 100)
            
        search_tasks = [search.search_query(session, q, num=max_results) for q in queries]
        search_results = await asyncio.gather(*search_tasks)
        
        candidates = set()
        for result_list in search_results:
            for u in result_list:
                parsed = urlparse(u)
                if parsed.netloc.endswith("repl.co") or parsed.netloc.endswith("replit.com"):
                    candidates.add(u.split("#")[0].split("?")[0])
        
        print(f"[+] Collected {len(candidates)} unique Replit candidate URLs")
        
        if progress_callback:
            progress_callback("Fetching HTML content...", 30, 100)

        # Fetch HTML and extract repo links
        fetch_tasks = [scraper.fetch_html(session, url) for url in candidates]
        html_contents = await asyncio.gather(*fetch_tasks)
        
        repo_set = set()
        mapping_pages_to_repos = defaultdict(set)
        for i, url in enumerate(candidates):
            html = html_contents[i]
            if not html:
                continue
            repo_links = scraper.extract_repo_links(html)
            for r in repo_links:
                repo_set.add(r)
                mapping_pages_to_repos[url].add(r)

        print(f"[+] Found {len(repo_set)} unique repos referenced from candidate pages")
        
        if progress_callback:
            progress_callback("Processing repositories...", 50, len(repo_set))

        # Process repositories concurrently
        final_rows = []
        processed_count = 0
        
        for repo_url in repo_set:
            result = await process_repo(session, repo_url, min_score, clone, mapping_pages_to_repos)
            if result:
                final_rows.append(result)
            
            processed_count += 1
            if progress_callback:
                progress_callback(f"Processing repository {processed_count}/{len(repo_set)}", processed_count, len(repo_set))

    # Write to CSV if specified
    if out_csv and final_rows:
        if progress_callback:
            progress_callback("Writing results to CSV...", 90, 100)
            
        with open(out_csv, "w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=final_rows[0].keys())
            writer.writeheader()
            writer.writerows(sorted(final_rows, key=lambda x: x["score"], reverse=True))
        
        print(f"[+] Finished. Results written to {out_csv}")
    
    if progress_callback:
        progress_callback("Search completed successfully", 100, 100)
    
    print(f"[+] Found {len(final_rows)} repositories")
    return final_rows