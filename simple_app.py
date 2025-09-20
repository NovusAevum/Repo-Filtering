#!/usr/bin/env python3
"""
Simple Flask app to test basic functionality
"""
import json
from datetime import datetime
from flask import Flask, jsonify
from flask_cors import CORS
from replit_finder.database import init_db, get_repositories_paginated, get_dashboard_stats

app = Flask(__name__)
CORS(app, origins=["http://localhost:3000", "http://localhost:3001", "https://*.netlify.app"])

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'version': '1.0.0'
    })

@app.route('/api/config', methods=['GET'])
def get_config():
    """Get configuration status"""
    return jsonify({
        'serpapi_configured': True,
        'github_configured': True,
        'database_initialized': True
    })

@app.route('/api/repositories', methods=['GET'])
def get_repositories():
    """Get paginated list of repositories"""
    try:
        repos, total = get_repositories_paginated(1, 20, '-score', '')
        
        return jsonify({
            'items': repos,
            'total': total,
            'page': 1,
            'per_page': 20,
            'pages': (total + 20 - 1) // 20
        })
    except Exception as e:
        print(f"Error: {e}")
        return jsonify({'error': 'Failed to fetch repositories'}), 500

@app.route('/api/dashboard-stats', methods=['GET'])
def dashboard_stats():
    """Get statistics for the dashboard"""
    try:
        stats = get_dashboard_stats()
        return jsonify(stats)
    except Exception as e:
        print(f"Error: {e}")
        return jsonify({'error': 'Failed to fetch dashboard stats'}), 500

if __name__ == '__main__':
    init_db()
    print("🚀 Starting simple Flask server on http://localhost:7001")
    app.run(debug=True, host='0.0.0.0', port=7001)
