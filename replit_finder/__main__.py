# replit_finder/__main__.py
import argparse
import os
import sys
import asyncio

from .main import find_production_repl_apps
from .github_search import search_github_repos # New import
from .config import DEFAULT_MAX_RESULTS, PRODUCTION_SCORE_THRESHOLD

def load_dorks_from_file(path: str) -> list[str]:
    """
    Loads dork queries from a file.
    """
    queries = []
    with open(path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#"):
                queries.append(line)
    return queries

def main():
    """
    Main function for the command-line interface.
    """
    parser = argparse.ArgumentParser(description="Find production-grade apps on Replit or GitHub.")
    subparsers = parser.add_subparsers(dest="command", required=True)

    # Sub-parser for replit-find
    parser_replit = subparsers.add_parser("replit-find", help="Find production-grade Replit apps.")
    parser_replit.add_argument("--query", help="Single dork query (overrides --dorks-file)", type=str)
    parser_replit.add_argument("--dorks-file", help="File containing dork queries", default="dorks.txt")
    parser_replit.add_argument("--max-results", help="Max results per query", type=int, default=DEFAULT_MAX_RESULTS)
    parser_replit.add_argument("--min-score", help="Minimum production score", type=int, default=PRODUCTION_SCORE_THRESHOLD)
    parser_replit.add_argument("--clone", help="Clone repositories that pass the threshold", action="store_true")
    parser_replit.add_argument("--out", help="CSV output filename", default="production_replit_projects.csv")

    # Sub-parser for github-search
    parser_github = subparsers.add_parser("github-search", help="Search for production-grade GitHub repos.")
    parser_github.add_argument("--query", help="GitHub search query", type=str, required=True)
    parser_github.add_argument("--min-stars", help="Minimum stars for a repo to be considered", type=int, default=100)
    parser_github.add_argument("--min-score", help="Minimum production score", type=int, default=PRODUCTION_SCORE_THRESHOLD)
    parser_github.add_argument("--clone", help="Clone repositories that pass the threshold", action="store_true")
    parser_github.add_argument("--out", help="CSV output filename", default="production_github_projects.csv")


    args = parser.parse_args()

    if args.command == "replit-find":
        if args.query:
            queries = [args.query]
        else:
            if not os.path.exists(args.dorks_file):
                print(f"[!] Dorks file not found: {args.dorks_file}", file=sys.stderr)
                sys.exit(1)
            queries = load_dorks_from_file(args.dorks_file)

        asyncio.run(find_production_repl_apps(
            queries=queries,
            max_results=args.max_results,
            clone=args.clone,
            min_score=args.min_score,
            out_csv=args.out,
        ))
    elif args.command == "github-search":
        asyncio.run(search_github_repos(
            query=args.query,
            min_stars=args.min_stars,
            clone=args.clone,
            min_score=args.min_score,
            out_csv=args.out,
        ))


if __name__ == "__main__":
    main()