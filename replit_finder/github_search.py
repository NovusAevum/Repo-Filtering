# replit_finder/github_search.py
import asyncio
import csv
import aiohttp

from . import database
from .config import PRODUCTION_SCORE_THRESHOLD
from .main import process_repo
from .github_api import search_repositories

async def search_github_repos(
    query: str,
    min_stars: int,
    clone: bool,
    min_score: int,
    out_csv: str,
):
    """
    Searches GitHub for repositories, filters them, and analyzes them.
    """
    database.init_db()
    print(f"[+] Starting GitHub search for: {query}")

    # Add min_stars filter to the query
    full_query = f"{query} stars:>{min_stars}"

    async with aiohttp.ClientSession() as session:
        repo_urls = await search_repositories(session, full_query, per_page=100)
        print(f"[+] Found {len(repo_urls)} repositories from GitHub search.")

        # Process repositories concurrently
        process_tasks = [
            process_repo(session, repo_url, min_score, clone)
            for repo_url in repo_urls
        ]
        final_rows = await asyncio.gather(*process_tasks)
        final_rows = [row for row in final_rows if row]

    # Write to CSV
    if final_rows:
        # I need to get the keys from the dictionary, but it can be empty
        # I will get the keys from the first element if it exists
        if final_rows:
            with open(out_csv, "w", newline="", encoding="utf-8") as f:
                # The keys in final_rows[0] should be correct since process_repo returns a dict with all keys
                writer = csv.DictWriter(f, fieldnames=final_rows[0].keys())
                writer.writeheader()
                writer.writerows(sorted(final_rows, key=lambda x: x["score"], reverse=True))
            print(f"[+] Finished. Results written to {out_csv}")
    else:
        print("[+] Finished. No new production repositories found.")
