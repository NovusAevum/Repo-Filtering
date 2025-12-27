# replit_osint_mirror.py
# Search Google for public Replit apps, save them, and mirror automatically.

import csv
import os
import subprocess
from googlesearch import search

def find_replit_apps(query="site:repl.co", num_results=50, output_file="replit_apps.csv", mirror_dir="mirrored_apps"):
    results = []

    print(f"[+] Searching Google for: {query}")
    for url in search(query, num=num_results, stop=num_results, pause=2):
        if "repl.co" in url:
            results.append(url)

    print(f"[+] Found {len(results)} results. Saving to {output_file}...")

    # Save to CSV
    with open(output_file, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["Replit URL"])
        for url in results:
            writer.writerow([url])

    print(f"[+] CSV saved: {output_file}")

    # Create mirror directory
    if not os.path.exists(mirror_dir):
        os.makedirs(mirror_dir)

    # Mirror each app
    for url in results:
        app_name = url.replace("https://", "").replace("http://", "").replace("/", "_")
        app_folder = os.path.join(mirror_dir, app_name)

        print(f"[+] Mirroring {url} into {app_folder} ...")

        try:
            subprocess.run([
                "wget",
                "-r",           # recursive
                "-np",          # no parent
                "-k",           # convert links
                "-E",           # adjust extensions (.html etc.)
                "-P", app_folder,  # target directory
                url
            ], check=True)
        except Exception as e:
            print(f"[!] Failed to mirror {url}: {e}")

    print("[+] All done! Check the mirrored_apps/ folder.")

if __name__ == "__main__":
    # Example: broad search for all repl apps
    find_replit_apps("site:repl.co", num_results=20)

    # You can refine:
    # find_replit_apps('site:repl.co "chatbot"', num_results=20)
    # find_replit_apps('site:repl.co "game"', num_results=20)