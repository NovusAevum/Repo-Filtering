# replit_finder/cloner.py
import os
import subprocess

def git_clone(repo_url: str, target_dir: str, depth: int = 1) -> bool:
    """
    Clones a Git repository.

    Args:
        repo_url: The URL of the repository to clone.
        target_dir: The directory to clone the repository into.
        depth: The depth of the clone.

    Returns:
        True if the clone was successful, False otherwise.
    """
    os.makedirs(target_dir, exist_ok=True)
    command = ["git", "clone", "--depth", str(depth), repo_url, target_dir]
    try:
        subprocess.run(command, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        return True
    except (subprocess.CalledProcessError, FileNotFoundError) as e:
        print(f"[!] git clone failed for {repo_url}: {e}")
        return False
