import asyncio
import json
import uuid
from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO, emit
from threading import Thread
import logging
import os
import json

from replit_finder.main import find_production_repl_apps
from replit_finder.github_search import search_github_repos
from replit_finder.database import get_all_repositories, init_db, get_repositories_paginated, get_dashboard_stats
from replit_finder.config import SERPAPI_API_KEY, GITHUB_TOKEN

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key')

# Dynamic CORS origins
_default_origins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
    "https://*.netlify.app",
]
try:
    _origins_env = os.getenv('CORS_ORIGINS')
    allowed_origins = json.loads(_origins_env) if _origins_env else _default_origins
except Exception:
    allowed_origins = _default_origins

CORS(app, origins=allowed_origins)
socketio = SocketIO(app, cors_allowed_origins=allowed_origins, async_mode='threading', logger=False, engineio_logger=False)

# Store active searches
active_searches = {}

class SearchProgress:
    def __init__(self, search_id):
        self.search_id = search_id
        self.status = "pending"
        self.progress = 0
        self.current_step = "Initializing..."
        self.total_steps = 5
        self.completed_steps = 0
        self.processed_count = 0
        self.total_count = 0
        self.results = []
        self.error = None
        self.start_time = datetime.now()

    def update(self, **kwargs):
        for key, value in kwargs.items():
            setattr(self, key, value)
        
        # Emit progress update via WebSocket
        socketio.emit('progress_update', {
            'search_id': self.search_id,
            'status': self.status,
            'progress': self.progress,
            'current_step': self.current_step,
            'completed_steps': self.completed_steps,
            'total_steps': self.total_steps,
            'processed_count': self.processed_count,
            'total_count': self.total_count
        })

    def to_dict(self):
        return {
            'search_id': self.search_id,
            'status': self.status,
            'progress': self.progress,
            'current_step': self.current_step,
            'total_steps': self.total_steps,
            'completed_steps': self.completed_steps,
            'processed_count': self.processed_count,
            'total_count': self.total_count,
            'results': self.results,
            'error': self.error
        }

@app.route('/api/health', methods=['GET'])
@app.route('/api/healthz', methods=['GET'])
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
        'serpapi_configured': bool(SERPAPI_API_KEY),
        'github_configured': bool(GITHUB_TOKEN),
        'database_initialized': True
    })

@app.route('/api/repositories', methods=['GET'])
def get_repositories():
    """Get paginated list of repositories"""
    try:
        page = int(request.args.get('page', 1))
        per_page = min(int(request.args.get('per_page', 20)), 100)
        sort = request.args.get('sort', '-score')
        query = request.args.get('query', '')
        
        # Get repositories from database
        repos, total = get_repositories_paginated(page, per_page, sort, query)
        
        return jsonify({
            'items': repos,
            'total': total,
            'page': page,
            'per_page': per_page,
            'pages': (total + per_page - 1) // per_page
        })
    except Exception as e:
        logger.error(f"Error fetching repositories: {str(e)}")
        return jsonify({'error': 'Failed to fetch repositories'}), 500

@app.route('/api/dashboard-stats', methods=['GET'])
def dashboard_stats():
    """Get statistics for the dashboard"""
    try:
        stats = get_dashboard_stats()
        return jsonify(stats)
    except Exception as e:
        logger.error(f"Error fetching dashboard stats: {str(e)}")
        return jsonify({'error': 'Failed to fetch dashboard stats'}), 500

@app.route('/api/search', methods=['POST'])
def start_search():
    """Start a new search"""
    try:
        data = request.get_json()
        
        # Validate request
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        search_type = data.get('searchType', 'replit-find')
        query = data.get('query', '')
        filters = data.get('filters', {})
        
        # Generate search ID
        search_id = str(uuid.uuid4())
        
        # Create progress tracker
        progress = SearchProgress(search_id)
        active_searches[search_id] = progress
        
        # Start search in background thread
        search_thread = Thread(
            target=run_search_async,
            args=(search_id, search_type, query, filters)
        )
        search_thread.daemon = True
        search_thread.start()
        
        return jsonify({
            'search_id': search_id,
            'status': 'pending',
            'message': 'Search started successfully'
        })
        
    except Exception as e:
        logger.error(f"Error starting search: {str(e)}")
        return jsonify({'error': 'Failed to start search'}), 500

@app.route('/api/search/<search_id>/status', methods=['GET'])
def get_search_status(search_id):
    """Get search status and results"""
    try:
        if search_id not in active_searches:
            return jsonify({'error': 'Search not found'}), 404
        
        progress = active_searches[search_id]
        return jsonify(progress.to_dict())
        
    except Exception as e:
        logger.error(f"Error getting search status: {str(e)}")
        return jsonify({'error': 'Failed to get search status'}), 500

@app.route('/api/search/<search_id>/cancel', methods=['POST'])
def cancel_search(search_id):
    """Cancel an active search"""
    try:
        if search_id not in active_searches:
            return jsonify({'error': 'Search not found'}), 404
        
        progress = active_searches[search_id]
        progress.update(status='cancelled', current_step='Search cancelled by user')
        
        return jsonify({'message': 'Search cancelled successfully'})
        
    except Exception as e:
        logger.error(f"Error cancelling search: {str(e)}")
        return jsonify({'error': 'Failed to cancel search'}), 500

def run_search_async(search_id, search_type, query, filters):
    """Run search asynchronously"""
    try:
        progress = active_searches[search_id]
        progress.update(status='in_progress', current_step='Starting search...', completed_steps=1)
        
        if search_type == 'replit-find':
            # Run Replit finder
            progress.update(current_step='Searching Replit repositories...', completed_steps=2)
            
            queries = [query] if query else []
            min_score = filters.get('minScore', 10)
            max_results = filters.get('maxResults', 30)
            
            # Run the search
            asyncio.run(find_production_repl_apps(
                queries=queries,
                min_score=min_score,
                max_results=max_results,
                progress_callback=lambda step, count, total: progress.update(
                    current_step=step,
                    processed_count=count,
                    total_count=total,
                    progress=min(90, int((count / total) * 80) + 10) if total > 0 else 10
                )
            ))
            
        elif search_type == 'github-search':
            # Run GitHub search
            progress.update(current_step='Searching GitHub repositories...', completed_steps=2)
            
            min_stars = filters.get('minStars', 100)
            min_score = filters.get('minScore', 10)
            
            asyncio.run(search_github_repos(
                query=query,
                min_stars=min_stars,
                min_score=min_score,
                clone=False,
                out_csv="",
                progress_callback=lambda step, count, total: progress.update(
                    current_step=step,
                    processed_count=count,
                    total_count=total,
                    progress=min(90, int((count / total) * 80) + 10) if total > 0 else 10
                )
            ))
        
        # Get updated results from database
        progress.update(current_step='Fetching results...', completed_steps=4)
        repos = get_all_repositories()
        progress.results = repos[:50]  # Limit to 50 results for performance
        
        # Complete search
        progress.update(
            status='completed',
            current_step='Search completed successfully',
            completed_steps=5,
            progress=100
        )
        
        # Emit completion event
        socketio.emit('search_complete', {
            'search_id': search_id,
            'result_count': len(progress.results)
        })
        
    except Exception as e:
        logger.error(f"Search error: {str(e)}")
        progress = active_searches.get(search_id)
        if progress:
            progress.update(
                status='failed',
                current_step=f'Search failed: {str(e)}',
                error=str(e)
            )

@socketio.on('connect')
def handle_connect():
    """Handle WebSocket connection"""
    logger.info('Client connected')
    emit('connected', {'message': 'Connected to search service'})

@socketio.on('disconnect')
def handle_disconnect():
    """Handle WebSocket disconnection"""
    logger.info('Client disconnected')

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    # Initialize database
    init_db()

    # Port from env with default 5000 (aligns with Vite proxy)
    port = int(os.getenv('PORT', '5000'))

    # Run the app
    socketio.run(app, debug=True, host='0.0.0.0', port=port, allow_unsafe_werkzeug=True)
