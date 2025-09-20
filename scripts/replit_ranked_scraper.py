# replit_ranked_scraper.py
# Discover Replit apps, mirror them, and rank by codebase complexity.

import os
import csv
import subprocess
from googlesearch import search

# -------------------
# Step 1: Google Dork Search
# -------------------
def google_dork(query, num_results=30):
    urls = []
    for url in search(query, num=num_results, stop=num_results, pause=2):
        if "repl.co" in url:
            urls.append(url)
    return urls

# -------------------
# Step 2: Mirror Replit Apps with wget
# -------------------
def mirror_site(url, mirror_dir="mirrored_apps"):
    app_name = url.replace("https://", "").replace("http://", "").replace("/", "_")
    app_folder = os.path.join(mirror_dir, app_name)
    os.makedirs(app_folder, exist_ok=True)

    print(f"[+] Mirroring {url} into {app_folder} ...")
    try:
        subprocess.run([
            "wget",
            "-r", "-np", "-k", "-E",
            "-P", app_folder,
            url
        ], check=True)
    except Exception as e:
        print(f"[!] Failed to mirror {url}: {e}")
    return app_folder

# -------------------
# Step 3: Analyze Codebase Complexity
# -------------------
def analyze_project(folder):
    total_files = 0
    total_lines = 0
    keywords = ["login", "register", "database", "api", "score", "dashboard"]
    keyword_hits = 0
    has_package_json = False
    has_requirements = False

    for root, _, files in os.walk(folder):
        for file in files:
            fpath = os.path.join(root, file)
            if file.endswith((".js", ".py", ".html", ".css")):
                total_files += 1
                try:
                    with open(fpath, "r", encoding="utf-8", errors="ignore") as f:
                        lines = f.readlines()
                        total_lines += len(lines)
                        content = " ".join(lines).lower()
                        for kw in keywords:
                            if kw in content:
                                keyword_hits += 1
                except:
                    pass

            if file == "package.json":
                has_package_json = True
            if file == "requirements.txt":
                has_requirements = True

    # Scoring logic
    score = 0
    if total_files > 5: score += 1
    if total_lines > 500: score += 2
    if total_lines > 2000: score += 3
    if has_package_json or has_requirements: score += 3
    if keyword_hits > 3: score += 2

    category = "toy"
    if score >= 8:
        category = "serious"
    elif score >= 5:
        category = "medium"

    return {
        "files": total_files,
        "lines": total_lines,
        "keywords": keyword_hits,
        "deps": has_package_json or has_requirements,
        "score": score,
        "category": category
    }

# -------------------
# Step 4: Orchestrate Everything
# -------------------
def run_replit_ranked_osint(query="site:repl.co", num_results=20):
    urls = google_dork(query, num_results=num_results)
    results = []

    for url in urls:
        folder = mirror_site(url)
        analysis = analyze_project(folder)
        results.append({
            "url": url,
            **analysis
        })

    # Save ranked results
    with open("replit_ranked_projects.csv", "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["URL", "Files", "Lines", "Keywords", "Has Deps", "Score", "Category"])
        for r in sorted(results, key=lambda x: x["score"], reverse=True):
            writer.writerow([r["url"], r["files"], r["lines"], r["keywords"], r["deps"], r["score"], r["category"]])

    print("[+] Ranking completed! Check replit_ranked_projects.csv")

if __name__ == "__main__":
    run_replit_ranked_osint("site:repl.co", num_results=20)
    # Example refinements:
    # run_replit_ranked_osint('site:repl.co "login"', num_results=20)
    # run_replit_ranked_osint('site:repl.co "chatbot"', num_results=20)