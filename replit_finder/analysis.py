# replit_finder/analysis.py
import os
import json
import subprocess

def run_trufflehog(path: str) -> int:
    """
    Runs trufflehog on a given directory to find secrets.
    """
    if not os.path.isdir(path):
        return 0
    try:
        # trufflehog filesystem /path/to/repo --json
        result = subprocess.run(
            ["trufflehog", "filesystem", path, "--json"],
            capture_output=True,
            text=True,
            check=True,
        )
        findings = [json.loads(line) for line in result.stdout.strip().split('\n') if line]
        return len(findings)
    except (subprocess.CalledProcessError, FileNotFoundError, json.JSONDecodeError) as e:
        print(f"[!] Trufflehog scan failed for {path}: {e}")
        return -1 # Indicate an error

def run_bandit(path: str) -> int:
    """
    Runs bandit on a given directory to find security issues.
    """
    if not os.path.isdir(path):
        return 0
    try:
        # bandit -r /path/to/repo -f json
        result = subprocess.run(
            ["bandit", "-r", path, "-f", "json"],
            capture_output=True,
            text=True,
            check=False,  # Bandit exits with 1 if issues are found
        )
        data = json.loads(result.stdout)
        return len(data.get("results", []))
    except (subprocess.CalledProcessError, FileNotFoundError, json.JSONDecodeError) as e:
        print(f"[!] Bandit scan failed for {path}: {e}")
        return -1 # Indicate an error

def score_repo(meta: dict) -> int:
    """
    Scores a repository based on a set of heuristics to determine if it is "production-grade".
    """
    score = 0
    stars = meta.get("stargazers_count", 0)
    forks = meta.get("forks_count", 0)
    commits = meta.get("commit_count", 0)
    contributors = meta.get("contributor_count", 0)
    readme_len = meta.get("readme_len", 0)
    has_ci = meta.get("has_ci", False)
    has_docker = meta.get("has_dockerfile", False)
    has_proc = meta.get("has_procfile", False)
    has_deps = meta.get("has_package_json", False) or meta.get("has_requirements", False)
    license_present = bool(meta.get("license"))
    trufflehog_findings = meta.get("trufflehog_findings", 0)
    bandit_findings = meta.get("bandit_findings", 0)

    # Positive scoring
    if stars >= 100: score += 5
    elif stars >= 30: score += 3
    if forks >= 50: score += 3
    elif forks >= 10: score += 2
    if commits >= 500: score += 5
    elif commits >= 100: score += 3
    if contributors >= 10: score += 4
    elif contributors >= 3: score += 2
    if has_ci: score += 3
    if has_docker: score += 2
    if has_proc: score += 2
    if has_deps: score += 2
    if readme_len >= 2000: score += 2
    elif readme_len >= 500: score += 1
    if license_present: score += 1

    # Negative scoring (penalties)
    if trufflehog_findings > 0:
        score -= 10 * trufflehog_findings # Heavy penalty for secrets
    if bandit_findings > 0:
        score -= bandit_findings // 5 # Penalize for every 5 issues

    return score

def analyze_local_repo(path: str) -> dict[str, int]:
    """
    Analyzes a local repository to get file counts, line counts, and security findings.
    """
    stats = {"total_files": 0, "total_lines": 0}
    for root, _, files in os.walk(path):
        for f in files:
            if f.endswith((".py", ".js", ".ts", ".jsx", ".tsx", ".html", ".css")):
                stats["total_files"] += 1
                try:
                    with open(os.path.join(root, f), "r", encoding="utf-8", errors="ignore") as fh:
                        stats["total_lines"] += sum(1 for _ in fh)
                except OSError:
                    pass
    
    # Add security scan results
    stats["trufflehog_findings"] = run_trufflehog(path)
    stats["bandit_findings"] = run_bandit(path)
    
    return stats