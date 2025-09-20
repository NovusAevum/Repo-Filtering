# Replit Production Finder

This tool helps discover "production-grade" Replit applications by searching for public projects that have associated GitHub/GitLab repositories. It then scores them based on various "production-readiness" metrics.

## Project Structure

- `replit_finder/`: The main Python package.
  - `__main__.py`: The command-line interface.
  - `main.py`: The main orchestration logic.
  - `config.py`: Configuration variables.
  - `search.py`: Search-related functions (SerpAPI, googlesearch-python).
  - `scraper.py`: HTML fetching and repository link extraction.
  - `github_api.py`: GitHub API interaction.
  - `analysis.py`: Repository scoring and analysis.
  - `cloner.py`: Repository cloning.
- `scripts/`: Legacy scripts for reference.
- `data/`: Output files.
- `dorks.txt`: A list of Google dork queries.
- `requirements.txt`: Python dependencies.
- `.gitignore`: Git ignore file.

## Installation

### Backend Setup
1. Clone the repository
2. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
3. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env file with your API keys
   ```

### Frontend Setup
1. Install Node.js dependencies:
   ```bash
   npm install
   ```

## Configuration

Create a `.env` file in the root directory with the following variables:

```env
# Required API Keys
SERPAPI_API_KEY=your_serpapi_key_here
GITHUB_TOKEN=your_github_token_here
SCRAPERAPI_KEY=your_scraperapi_key_here  # Optional

# Frontend Configuration
VITE_API_BASE_URL=http://localhost:5000/api
VITE_WS_BASE_URL=http://localhost:5000
```

### Getting API Keys

1. **SerpAPI Key**: Sign up at [serpapi.com](https://serpapi.com) for Google search functionality
2. **GitHub Token**: Create a personal access token at [github.com/settings/tokens](https://github.com/settings/tokens)
3. **ScraperAPI Key**: Optional, sign up at [scraperapi.com](https://scraperapi.com) for enhanced scraping

## Development

### Running the Application

1. Start the backend server:
   ```bash
   python app.py
   ```

2. In a new terminal, start the frontend:
   ```bash
   npm run dev
   ```

3. Open your browser to `http://localhost:3000`

### Command Line Usage (Legacy)

You can still run the tool using the command line:

```bash
python -m replit_finder [OPTIONS]
```

#### Options

- `--query`: Single dork query (overrides `--dorks-file`)
- `--dorks-file`: File containing dork queries (one per line). Default: `dorks.txt`
- `--max-results`: Max results per query. Default: 30
- `--min-score`: Minimum production score to keep. Default: 10
- `--clone`: Clone repositories that pass the threshold
- `--out`: CSV output filename. Default: `production_replit_projects.csv`

## Deployment

### Netlify Deployment (Frontend)

1. Build the frontend:
   ```bash
   npm run build
   ```

2. Deploy to Netlify:
   - Connect your GitHub repository to Netlify
   - Set build command: `npm run build`
   - Set publish directory: `dist`
   - Add environment variables in Netlify dashboard

### Backend Deployment Options

#### Option 1: Heroku
```bash
# Install Heroku CLI and login
heroku create your-app-name
heroku config:set SERPAPI_API_KEY=your_key
heroku config:set GITHUB_TOKEN=your_token
git push heroku main
```

#### Option 2: Railway
```bash
# Install Railway CLI
railway login
railway new
railway add
railway deploy
```

### Environment Variables for Production

Update your `.env` or deployment platform with production URLs:

```env
VITE_API_BASE_URL=https://your-backend-api.herokuapp.com/api
VITE_WS_BASE_URL=https://your-backend-api.herokuapp.com
```