# replit_finder/scraper.py
import re
import aiohttp
from bs4 import BeautifulSoup
from .config import USER_AGENT

GITHUB_REPO_REGEX = re.compile(r"https?://github\.com/([A-Za-z0-9_.-]+)/([A-Za-z0-9_.-]+)(?:/|$)")
GITLAB_REPO_REGEX = re.compile(r"https?://gitlab\.com/([A-Za-z0-9_.-]+)/([A-Za-z0-9_.-]+)(?:/|$)")

async def fetch_html(session: aiohttp.ClientSession, url: str, timeout: int = 12) -> str:
    """
    Fetches the HTML content of a given URL asynchronously.
    """
    headers = {"User-Agent": USER_AGENT}
    try:
        async with session.get(url, headers=headers, timeout=timeout) as response:
            response.raise_for_status()
            return await response.text()
    except aiohttp.ClientError as e:
        print(f"[!] Failed to fetch {url}: {e}")
        return ""

def extract_repo_links(html: str) -> set[str]:
    """
    Extracts GitHub and GitLab repository links from HTML content.
    (This function is CPU-bound and does not need to be async)
    """
    found = set()
    for match in GITHUB_REPO_REGEX.finditer(html):
        owner, repo = match.group(1), match.group(2)
        found.add(f"https://github.com/{owner}/{repo}")
    for match in GITLAB_REPO_REGEX.finditer(html):
        owner, repo = match.group(1), match.group(2)
        found.add(f"https://gitlab.com/{owner}/{repo}")

    # Also inspect anchor tags for full links
    soup = BeautifulSoup(html, "html.parser")
    for a in soup.find_all("a", href=True):
        href = a["href"]
        if href.startswith("https://github.com/"):
            match = GITHUB_REPO_REGEX.match(href)
            if match:
                found.add(match.group(0))
    return found