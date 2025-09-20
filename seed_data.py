#!/usr/bin/env python3
"""
Seed the database with sample data for demonstration
"""
import json
from datetime import datetime, timedelta
from replit_finder.database import init_db, insert_repository

def seed_database():
    """Add sample repository data to the database"""
    init_db()
    
    sample_repos = [
        {
            'repo_url': 'https://github.com/microsoft/vscode',
            'owner': 'microsoft',
            'repo': 'vscode',
            'stars': 162000,
            'forks': 28500,
            'commits': 98234,
            'contributors': 1893,
            'has_ci': True,
            'has_dockerfile': True,
            'has_procfile': False,
            'has_package_json': True,
            'has_requirements': False,
            'readme_len': 4567,
            'license': 'MIT',
            'score': 45,
            'category': 'production',
            'total_files': 12453,
            'total_lines': 2456789,
            'trufflehog_findings': 0,
            'bandit_findings': 0,
            'pages_linking': 'https://replit.com/featured/vscode-clone',
            'language': 'TypeScript',
            'last_processed': datetime.now() - timedelta(days=1)
        },
        {
            'repo_url': 'https://github.com/facebook/react',
            'owner': 'facebook',
            'repo': 'react',
            'stars': 227000,
            'forks': 46300,
            'commits': 15634,
            'contributors': 1502,
            'has_ci': True,
            'has_dockerfile': False,
            'has_procfile': False,
            'has_package_json': True,
            'has_requirements': False,
            'readme_len': 3421,
            'license': 'MIT',
            'score': 48,
            'category': 'production',
            'total_files': 2563,
            'total_lines': 234567,
            'trufflehog_findings': 0,
            'bandit_findings': 0,
            'pages_linking': 'https://replit.com/featured/react-app',
            'language': 'JavaScript',
            'last_processed': datetime.now() - timedelta(days=2)
        },
        {
            'repo_url': 'https://github.com/python/cpython',
            'owner': 'python',
            'repo': 'cpython',
            'stars': 62000,
            'forks': 29800,
            'commits': 113456,
            'contributors': 2145,
            'has_ci': True,
            'has_dockerfile': True,
            'has_procfile': False,
            'has_package_json': False,
            'has_requirements': True,
            'readme_len': 2345,
            'license': 'Python Software Foundation License',
            'score': 44,
            'category': 'production',
            'total_files': 6789,
            'total_lines': 1234567,
            'trufflehog_findings': 1,
            'bandit_findings': 0,
            'pages_linking': 'https://replit.com/featured/python-interpreter',
            'language': 'Python',
            'last_processed': datetime.now() - timedelta(days=3)
        },
        {
            'repo_url': 'https://github.com/golang/go',
            'owner': 'golang',
            'repo': 'go',
            'stars': 123000,
            'forks': 17500,
            'commits': 56789,
            'contributors': 2876,
            'has_ci': True,
            'has_dockerfile': False,
            'has_procfile': False,
            'has_package_json': False,
            'has_requirements': False,
            'readme_len': 1876,
            'license': 'BSD 3-Clause',
            'score': 42,
            'category': 'production',
            'total_files': 4567,
            'total_lines': 987654,
            'trufflehog_findings': 0,
            'bandit_findings': 0,
            'pages_linking': 'https://replit.com/featured/go-playground',
            'language': 'Go',
            'last_processed': datetime.now() - timedelta(days=1)
        },
        {
            'repo_url': 'https://github.com/rust-lang/rust',
            'owner': 'rust-lang',
            'repo': 'rust',
            'stars': 97000,
            'forks': 12500,
            'commits': 176234,
            'contributors': 4321,
            'has_ci': True,
            'has_dockerfile': True,
            'has_procfile': False,
            'has_package_json': False,
            'has_requirements': False,
            'readme_len': 2987,
            'license': 'MIT',
            'score': 46,
            'category': 'production',
            'total_files': 8901,
            'total_lines': 1876543,
            'trufflehog_findings': 0,
            'bandit_findings': 0,
            'pages_linking': 'https://replit.com/featured/rust-playground',
            'language': 'Rust',
            'last_processed': datetime.now() - timedelta(days=2)
        },
        {
            'repo_url': 'https://github.com/nodejs/node',
            'owner': 'nodejs',
            'repo': 'node',
            'stars': 107000,
            'forks': 29200,
            'commits': 34567,
            'contributors': 3456,
            'has_ci': True,
            'has_dockerfile': True,
            'has_procfile': False,
            'has_package_json': True,
            'has_requirements': False,
            'readme_len': 3456,
            'license': 'MIT',
            'score': 43,
            'category': 'production',
            'total_files': 5678,
            'total_lines': 876543,
            'trufflehog_findings': 2,
            'bandit_findings': 0,
            'pages_linking': 'https://replit.com/featured/nodejs-server',
            'language': 'JavaScript',
            'last_processed': datetime.now() - timedelta(days=4)
        },
        {
            'repo_url': 'https://github.com/simple-todo/app',
            'owner': 'simple-todo',
            'repo': 'app',
            'stars': 245,
            'forks': 67,
            'commits': 89,
            'contributors': 3,
            'has_ci': False,
            'has_dockerfile': False,
            'has_procfile': True,
            'has_package_json': True,
            'has_requirements': False,
            'readme_len': 567,
            'license': 'MIT',
            'score': 18,
            'category': 'non-production',
            'total_files': 23,
            'total_lines': 1234,
            'trufflehog_findings': 0,
            'bandit_findings': 1,
            'pages_linking': 'https://replit.com/apps/todo-simple',
            'language': 'JavaScript',
            'last_processed': datetime.now() - timedelta(days=5)
        },
        {
            'repo_url': 'https://github.com/learning-python/basics',
            'owner': 'learning-python',
            'repo': 'basics',
            'stars': 89,
            'forks': 234,
            'commits': 45,
            'contributors': 12,
            'has_ci': False,
            'has_dockerfile': False,
            'has_procfile': False,
            'has_package_json': False,
            'has_requirements': True,
            'readme_len': 890,
            'license': 'Apache-2.0',
            'score': 12,
            'category': 'non-production',
            'total_files': 34,
            'total_lines': 2345,
            'trufflehog_findings': 1,
            'bandit_findings': 3,
            'pages_linking': 'https://replit.com/tutorials/python-basics',
            'language': 'Python',
            'last_processed': datetime.now() - timedelta(days=7)
        }
    ]
    
    print("🌱 Seeding database with sample repositories...")
    for repo in sample_repos:
        try:
            insert_repository(repo)
            print(f"   ✅ Added: {repo['owner']}/{repo['repo']}")
        except Exception as e:
            print(f"   ❌ Failed to add {repo['owner']}/{repo['repo']}: {e}")
    
    print(f"\n🎉 Successfully seeded {len(sample_repos)} repositories!")
    print("   💡 You can now see the data in your dashboard")

if __name__ == "__main__":
    seed_database()
