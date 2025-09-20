#!/usr/bin/env python3
"""
Integration test script for Replit Production Finder
Tests the connection between frontend and backend
"""

import requests
import json
import time
import sys
from replit_finder.config import SERPAPI_API_KEY, GITHUB_TOKEN

def test_backend_health():
    """Test if backend is running and healthy"""
    try:
        response = requests.get('http://localhost:5000/api/health', timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Backend health check passed: {data['status']}")
            return True
        else:
            print(f"❌ Backend health check failed: {response.status_code}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"❌ Backend connection failed: {e}")
        return False

def test_configuration():
    """Test API configuration"""
    try:
        response = requests.get('http://localhost:5000/api/config', timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Configuration check:")
            print(f"   - SerpAPI: {'✅' if data['serpapi_configured'] else '❌'}")
            print(f"   - GitHub: {'✅' if data['github_configured'] else '❌'}")
            print(f"   - Database: {'✅' if data['database_initialized'] else '❌'}")
            
            if not data['serpapi_configured']:
                print("⚠️  Warning: SerpAPI not configured - search functionality will be limited")
            if not data['github_configured']:
                print("⚠️  Warning: GitHub API not configured - repository analysis will fail")
                
            return True
        else:
            print(f"❌ Configuration check failed: {response.status_code}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"❌ Configuration check failed: {e}")
        return False

def test_repositories_endpoint():
    """Test repositories endpoint"""
    try:
        response = requests.get('http://localhost:5000/api/repositories', timeout=10)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Repositories endpoint working - found {data['total']} repositories")
            return True
        else:
            print(f"❌ Repositories endpoint failed: {response.status_code}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"❌ Repositories endpoint failed: {e}")
        return False

def test_search_endpoint():
    """Test search endpoint with a simple query"""
    try:
        search_data = {
            "searchType": "github-search",
            "query": "test",
            "filters": {
                "minStars": 1,
                "minScore": 1
            }
        }
        
        response = requests.post(
            'http://localhost:5000/api/search',
            json=search_data,
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            search_id = data['search_id']
            print(f"✅ Search endpoint working - started search {search_id}")
            
            # Check search status
            time.sleep(2)
            status_response = requests.get(f'http://localhost:5000/api/search/{search_id}/status')
            if status_response.status_code == 200:
                status_data = status_response.json()
                print(f"✅ Search status endpoint working - status: {status_data['status']}")
                return True
            else:
                print(f"❌ Search status check failed: {status_response.status_code}")
                return False
        else:
            print(f"❌ Search endpoint failed: {response.status_code}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"❌ Search endpoint failed: {e}")
        return False

def main():
    """Run all integration tests"""
    print("🧪 Running Replit Production Finder Integration Tests...\n")
    
    tests = [
        ("Backend Health", test_backend_health),
        ("Configuration", test_configuration),
        ("Repositories Endpoint", test_repositories_endpoint),
        ("Search Endpoint", test_search_endpoint),
    ]
    
    passed = 0
    total = len(tests)
    
    for test_name, test_func in tests:
        print(f"\n🔍 Testing {test_name}...")
        if test_func():
            passed += 1
        print("-" * 50)
    
    print(f"\n📊 Test Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! The application is ready for use.")
        return 0
    else:
        print("❌ Some tests failed. Please check the configuration and try again.")
        return 1

if __name__ == "__main__":
    sys.exit(main())