# replit_finder/database.py
import os
import sqlite3
from typing import Any, Dict, List
from datetime import datetime, timedelta

DB_PATH = os.getenv("DB_PATH", "replit_finder.db")

def init_db():
    """Initializes the database and creates the tables."""
    with sqlite3.connect(DB_PATH) as conn:
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS repositories (
                repo_url TEXT PRIMARY KEY,
                owner TEXT,
                repo TEXT,
                stars INTEGER,
                forks INTEGER,
                commits INTEGER,
                contributors INTEGER,
                has_ci BOOLEAN,
                has_dockerfile BOOLEAN,
                has_procfile BOOLEAN,
                has_package_json BOOLEAN,
                has_requirements BOOLEAN,
                readme_len INTEGER,
                license TEXT,
                score INTEGER,
                category TEXT,
                total_files INTEGER,
                total_lines INTEGER,
                trufflehog_findings INTEGER,
                bandit_findings INTEGER,
                pages_linking TEXT,
                last_processed TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                language TEXT
            )
        """)
        # Add language column if it doesn't exist (for backward compatibility)
        cursor.execute("PRAGMA table_info(repositories)")
        columns = [column[1] for column in cursor.fetchall()]
        if 'language' not in columns:
            cursor.execute("ALTER TABLE repositories ADD COLUMN language TEXT")

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS pages (
                page_url TEXT PRIMARY KEY,
                repo_url TEXT,
                FOREIGN KEY (repo_url) REFERENCES repositories (repo_url)
            )
        """)
        conn.commit()

def is_repo_processed(repo_url: str) -> bool:
    """Checks if a repository has already been processed."""
    with sqlite3.connect(DB_PATH) as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT 1 FROM repositories WHERE repo_url = ?", (repo_url,))
        return cursor.fetchone() is not None

def insert_repository(repo_data: Dict[str, Any]):
    """Inserts a repository's data into the database."""
    with sqlite3.connect(DB_PATH) as conn:
        cursor = conn.cursor()
        
        # Ensure all columns are present in repo_data, with defaults if missing
        all_columns = [
            'repo_url', 'owner', 'repo', 'stars', 'forks', 'commits', 
            'contributors', 'has_ci', 'has_dockerfile', 'has_procfile', 
            'has_package_json', 'has_requirements', 'readme_len', 'license', 
            'score', 'category', 'total_files', 'total_lines', 
            'trufflehog_findings', 'bandit_findings', 'pages_linking', 
            'last_processed', 'language'
        ]
        
        # Set default for last_processed if not provided
        if 'last_processed' not in repo_data:
            repo_data['last_processed'] = datetime.now()

        # Filter out any keys in repo_data that are not in the table columns
        filtered_repo_data = {key: repo_data.get(key) for key in all_columns if key in repo_data}

        placeholders = ", ".join(["?"] * len(filtered_repo_data))
        columns = ", ".join(filtered_repo_data.keys())
        
        sql = f"INSERT OR REPLACE INTO repositories ({columns}) VALUES ({placeholders})"
        cursor.execute(sql, tuple(filtered_repo_data.values()))
        conn.commit()

def get_all_repositories() -> List[Dict[str, Any]]:
    """Retrieves all repositories from the database."""
    with sqlite3.connect(DB_PATH) as conn:
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM repositories ORDER BY score DESC")
        rows = cursor.fetchall()
        return [dict(row) for row in rows]

def get_repositories_paginated(page: int = 1, per_page: int = 20, sort: str = '-score', query: str = '') -> tuple[List[Dict[str, Any]], int]:
    """Retrieves paginated repositories from the database with optional search and sorting."""
    with sqlite3.connect(DB_PATH) as conn:
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        # Build WHERE clause for search
        where_clause = ""
        params = []
        if query:
            where_clause = "WHERE (repo LIKE ? OR owner LIKE ? OR license LIKE ? OR language LIKE ?)"
            search_term = f"%{query}%"
            params = [search_term, search_term, search_term, search_term]
        
        # Build ORDER BY clause
        order_by = "ORDER BY score DESC"  # default
        if sort.startswith('-'):
            field = sort[1:]
            order_by = f"ORDER BY {field} DESC"
        elif sort:
            order_by = f"ORDER BY {sort} ASC"
        
        # Get total count
        count_sql = f"SELECT COUNT(*) FROM repositories {where_clause}"
        cursor.execute(count_sql, params)
        total = cursor.fetchone()[0]
        
        # Get paginated results
        offset = (page - 1) * per_page
        sql = f"SELECT * FROM repositories {where_clause} {order_by} LIMIT ? OFFSET ?"
        cursor.execute(sql, params + [per_page, offset])
        rows = cursor.fetchall()
        
        return [dict(row) for row in rows], total

def get_dashboard_stats() -> Dict[str, Any]:
    """Calculates and returns statistics for the dashboard."""
    try:
        with sqlite3.connect(DB_PATH) as conn:
            cursor = conn.cursor()

            # Total repositories
            cursor.execute("SELECT COUNT(*) FROM repositories")
            total_repos = cursor.fetchone()[0]

            # Production-ready repos
            cursor.execute("SELECT COUNT(*) FROM repositories WHERE category = 'production'")
            production_repos = cursor.fetchone()[0]

            # Repos with security findings
            cursor.execute("SELECT COUNT(*) FROM repositories WHERE trufflehog_findings > 0 OR bandit_findings > 0")
            security_issues = cursor.fetchone()[0]

            # Language breakdown
            cursor.execute("SELECT language, COUNT(*) FROM repositories WHERE language IS NOT NULL GROUP BY language ORDER BY COUNT(*) DESC LIMIT 10")
            language_breakdown = [{"name": row[0], "value": row[1]} for row in cursor.fetchall()]

            # Repositories analyzed over time (last 30 days)
            daily_counts = []
            today = datetime.now().date()
            for i in range(30):
                day = today - timedelta(days=i)
                next_day = day + timedelta(days=1)
                cursor.execute("SELECT COUNT(*) FROM repositories WHERE last_processed >= ? AND last_processed < ?", (day, next_day))
                count = cursor.fetchone()[0]
                daily_counts.append({"date": day.strftime("%Y-%m-%d"), "count": count})
            
            analysis_timeline = list(reversed(daily_counts))

            return {
                "totalRepositories": total_repos,
                "productionReady": production_repos,
                "securityIssues": security_issues,
                "nonProduction": total_repos - production_repos,
                "languageBreakdown": language_breakdown,
                "analysisTimeline": analysis_timeline
            }
    except sqlite3.Error as e:
        print(f"Database error in get_dashboard_stats: {e}")
        # In case of error, return a default structure to avoid breaking the frontend
        return {
            "totalRepositories": 0,
            "productionReady": 0,
            "securityIssues": 0,
            "nonProduction": 0,
            "languageBreakdown": [],
            "analysisTimeline": []
        }
