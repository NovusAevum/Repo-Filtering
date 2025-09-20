import os, json, csv, sqlite3, requests, argparse
from config import SERPAPI_API_KEY, SCRAPERAPI_KEY, GITHUB_TOKEN, OUTPUT_DIR, MIN_STARS

# ensure /data exists
os.makedirs(OUTPUT_DIR, exist_ok=True)

def fetch_github_repos(query, per_page=30):
    """Search GitHub repos via API"""
    url = "https://api.github.com/search/repositories"
    headers = {"Authorization": f"token {GITHUB_TOKEN}"}
    params = {"q": query, "sort": "stars", "order": "desc", "per_page": per_page}
    r = requests.get(url, headers=headers, params=params)
    r.raise_for_status()
    return r.json()["items"]

def filter_production_repos(repos):
    """Filter repos by stars & activity"""
    filtered = []
    for repo in repos:
        if repo["stargazers_count"] >= MIN_STARS and not repo["fork"]:
            filtered.append({
                "repo_name": repo["full_name"],
                "url": repo["html_url"],
                "stars": repo["stargazers_count"],
                "forks": repo["forks_count"],
                "language": repo["language"],
                "description": repo["description"],
                "last_updated": repo["updated_at"],
                "topics": repo.get("topics", [])
            })
    return filtered

def save_json(data, filename):
    with open(os.path.join(OUTPUT_DIR, filename), "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)

def save_csv(data, filename):
    if not data: return
    keys = data[0].keys()
    with open(os.path.join(OUTPUT_DIR, filename), "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=keys)
        writer.writeheader()
        writer.writerows(data)

def save_sqlite(data, filename):
    conn = sqlite3.connect(os.path.join(OUTPUT_DIR, filename))
    c = conn.cursor()
    c.execute("""CREATE TABLE IF NOT EXISTS repos (
        repo_name TEXT, url TEXT, stars INT, forks INT, language TEXT,
        description TEXT, last_updated TEXT, topics TEXT
    )""")
    for d in data:
        c.execute("INSERT INTO repos VALUES (?,?,?,?,?,?,?,?)", (
            d["repo_name"], d["url"], d["stars"], d["forks"],
            d["language"], d["description"], d["last_updated"],
            ",".join(d["topics"])
        ))
    conn.commit()
    conn.close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Replit OSINT Scraper")
    parser.add_argument("--query", type=str, default="replit production", help="Search query")
    parser.add_argument("--json", action="store_true", help="Save results as JSON")
    parser.add_argument("--csv", action="store_true", help="Save results as CSV")
    parser.add_argument("--db", action="store_true", help="Save results in SQLite")
    parser.add_argument("--all", action="store_true", help="Save in all formats")
    args = parser.parse_args()

    print(f"🔍 Searching GitHub for: {args.query}")
    repos = fetch_github_repos(args.query)
    filtered = filter_production_repos(repos)

    if args.json or args.all:
        save_json(filtered, "replit_scrape_filtered.json")
        print("📂 Saved JSON")
    if args.csv or args.all:
        save_csv(filtered, "replit_scrape_results.csv")
        print("📂 Saved CSV")
    if args.db or args.all:
        save_sqlite(filtered, "replit_scrape_results.db")
        print("📂 Saved SQLite")

    print(f"✅ Done. Found {len(filtered)} production-level repos.")