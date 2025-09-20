# replit_finder/search.py
import os
import aiohttp
from .config import SERPAPI_API_KEY

try:
    from googlesearch import search as google_search
except ImportError:
    google_search = None

async def serpapi_search(session: aiohttp.ClientSession, query: str, num: int = 20) -> list[str]:
    """
    Performs a Google search using the SerpAPI asynchronously.
    """
    if not SERPAPI_API_KEY:
        raise RuntimeError("SERPAPI_API_KEY not set in environment variables")
    url = "https://serpapi.com/search.json"
    params = {"engine": "google", "q": query, "num": num, "api_key": SERPAPI_API_KEY}
    async with session.get(url, params=params, timeout=20) as response:
        response.raise_for_status()
        data = await response.json()
        return [result.get("link") or result.get("url") for result in data.get("organic_results", []) if result.get("link") or result.get("url")]

def google_search_fallback(query: str, num: int = 20) -> list[str]:
    """
    Performs a Google search using the googlesearch-python library.
    This remains synchronous as the library does not support asyncio.
    """
    if google_search is None:
        raise RuntimeError("googlesearch not installed and no SerpAPI key provided. Please run 'pip install googlesearch-python'")
    # The googlesearch library is synchronous, so we run it in a thread pool
    # to avoid blocking the event loop. However, for simplicity here, we'll call it directly.
    # For a truly non-blocking app, you'd use loop.run_in_executor.
    return list(google_search(query, num=num, stop=num, pause=2.0))

async def search_query(session: aiohttp.ClientSession, query: str, num: int = 20) -> list[str]:
    """
    Tries to search using SerpAPI first, then falls back to googlesearch-python.
    """
    if SERPAPI_API_KEY:
        try:
            return await serpapi_search(session, query, num=num)
        except Exception as e:
            print(f"[!] SerpAPI search failed: {e}. Falling back to googlesearch.")
    # Note: google_search_fallback is synchronous.
    # In a real async application, you would run this in an executor.
    # For this tool, since it's a fallback, we accept the blocking call.
    return google_search_fallback(query, num=num)