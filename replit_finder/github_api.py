# replit_finder/github_api.py
import re
import base64
import aiohttp
from .config import GITHUB_TOKEN, USER_AGENT

GITHUB_API = "https://api.github.com"

def _gh_headers() -> dict[str, str]:
    """
    Returns the headers for GitHub API requests.
    """
    headers = {"Accept": "application/vnd.github+json", "User-Agent": USER_AGENT}
    if GITHUB_TOKEN:
        headers["Authorization"] = f"token {GITHUB_TOKEN}"
    return headers

async def get_github_repo_api(session: aiohttp.ClientSession, owner: str, repo: str) -> dict | None:
    """
    Gets the GitHub repository API data asynchronously.
    """
    url = f"{GITHUB_API}/repos/{owner}/{repo}"
    try:
        async with session.get(url, headers=_gh_headers(), timeout=12) as response:
            if response.status == 404:
                return None
            response.raise_for_status()
            return await response.json()
    except aiohttp.ClientError as e:
        print(f"[!] Failed to get repo metadata for {owner}/{repo}: {e}")
        return None

async def check_github_path_exists(session: aiohttp.ClientSession, owner: str, repo: str, path: str) -> bool:
    """
    Checks if a path exists in a GitHub repository asynchronously.
    """
    url = f"{GITHUB_API}/repos/{owner}/{repo}/contents/{path}"
    try:
        async with session.get(url, headers=_gh_headers(), timeout=10) as response:
            return response.status == 200
    except aiohttp.ClientError:
        return False

async def get_commit_count(session: aiohttp.ClientSession, owner: str, repo: str) -> int:
    """
    Gets the commit count for a GitHub repository asynchronously.
    """
    url = f"{GITHUB_API}/repos/{owner}/{repo}/commits"
    try:
        async with session.get(url, headers=_gh_headers(), params={"per_page": "1"}, timeout=12) as response:
            if response.status == 404:
                return 0
            response.raise_for_status()
            link_header = response.headers.get("Link", "")
            if 'rel="last"' in link_header:
                if match := re.search(r'&page=(\d+)>; rel="last"', link_header):
                    return int(match.group(1))
            return len(await response.json())
    except (aiohttp.ClientError, ValueError):
        return 0

async def get_contributor_count(session: aiohttp.ClientSession, owner: str, repo: str) -> int:
    """
    Gets the contributor count for a GitHub repository asynchronously.
    """
    url = f"{GITHUB_API}/repos/{owner}/{repo}/contributors"
    try:
        async with session.get(url, headers=_gh_headers(), params={"per_page": "1"}, timeout=12) as response:
            if response.status in [404, 202]:  # 202 for large repos
                return 0
            response.raise_for_status()
            link_header = response.headers.get("Link", "")
            if 'rel="last"' in link_header:
                if match := re.search(r'&page=(\d+)>; rel="last"', link_header):
                    return int(match.group(1))
            return len(await response.json())
    except (aiohttp.ClientError, ValueError):
        return 0

async def get_readme_len(session: aiohttp.ClientSession, owner: str, repo: str) -> int:
    """
    Gets the length of the README file for a GitHub repository asynchronously.
    """
    url = f"{GITHUB_API}/repos/{owner}/{repo}/readme"
    try:
        async with session.get(url, headers=_gh_headers(), timeout=10) as response:
            if response.status == 200:
                data = await response.json()
                content = base64.b64decode(data.get("content", "")).decode("utf-8", errors="ignore")
                return len(content)
    except (aiohttp.ClientError, ValueError):
        pass
    return 0

async def search_repositories(session: aiohttp.ClientSession, query: str, per_page: int = 30) -> list[str]:
    """
    Searches for repositories on GitHub.
    Returns a list of repository URLs.
    """
    url = f"{GITHUB_API}/search/repositories"
    headers = _gh_headers()
    params = {"q": query, "sort": "stars", "order": "desc", "per_page": per_page}
    repo_urls = []
    try:
        async with session.get(url, headers=headers, params=params) as response:
            response.raise_for_status()
            data = await response.json()
            for item in data.get("items", []):
                repo_urls.append(item["html_url"])
    except aiohttp.ClientError as e:
        print(f"[!] GitHub repository search failed: {e}")
    return repo_urls
