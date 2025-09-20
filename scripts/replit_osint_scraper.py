# replit_osint_scraper.py
# Search Google for public Replit apps and save them into a CSV

import csv
from googlesearch import search

def find_replit_apps(query="site:repl.co", num_results=100, output_file="replit_apps.csv"):
    results = []

    print(f"[+] Searching Google for: {query}")
    for url in search(query, num=num_results, stop=num_results, pause=2):
        if "repl.co" in url:
            results.append(url)

    print(f"[+] Found {len(results)} results. Saving to {output_file}...")

    with open(output_file, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["Replit URL"])
        for url in results:
            writer.writerow([url])

    print("[+] Done! Check replit_apps.csv")

if __name__ == "__main__":
    # Example: broad search
    find_replit_apps("site:repl.co", num_results=100)

    # You can also search for specific keywords, e.g.:
    # find_replit_apps('site:repl.co "chatbot"', num_results=50)
    # find_replit_apps('site:repl.co "login"', num_results=50)