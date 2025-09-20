import os

# Load secrets from environment variables
SERPAPI_API_KEY = os.getenv("SERPAPI_API_KEY")
SCRAPERAPI_KEY = os.getenv("SCRAPERAPI_KEY")
GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")

# General configuration
OUTPUT_DIR = "data"
MIN_STARS = 1000  # production-level filter for replit_scrapper.py
USER_AGENT = "Mozilla/5.0 (X11; Linux x86_64) ReplitProductionFinder/1.0"

# Production score threshold for replit_production_finder.py
PRODUCTION_SCORE_THRESHOLD = 10
DEFAULT_MAX_RESULTS = 30
