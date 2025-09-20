# 🚀 Replit Production Finder - Complete Setup Guide

## 📋 Prerequisites

- **Python 3.8+** with pip
- **Node.js 16+** with npm
- **Git** for version control

## 🔧 Quick Setup (Recommended)

### 1. Clone and Setup
```bash
git clone <your-repo-url>
cd Repo-Filtering
chmod +x start.sh deploy.sh
```

### 2. Get API Keys

#### SerpAPI Key (Required for Google Search)
1. Visit [serpapi.com](https://serpapi.com)
2. Sign up for a free account (100 searches/month)
3. Copy your API key from the dashboard

#### GitHub Token (Required for Repository Analysis)
1. Go to [github.com/settings/tokens](https://github.com/settings/tokens)
2. Click "Generate new token (classic)"
3. Select scopes: `public_repo`, `read:user`
4. Copy the generated token

#### ScraperAPI Key (Optional, for Enhanced Scraping)
1. Visit [scraperapi.com](https://scraperapi.com)
2. Sign up for a free account
3. Copy your API key

### 3. Configure Environment
```bash
cp .env.example .env
# Edit .env file with your API keys
nano .env  # or use your preferred editor
```

Add your keys to `.env`:
```env
SERPAPI_API_KEY=your_serpapi_key_here
GITHUB_TOKEN=your_github_token_here
SCRAPERAPI_KEY=your_scraperapi_key_here
```

### 4. Start the Application
```bash
./start.sh
```

This will:
- Create a virtual environment
- Install all dependencies
- Start both backend and frontend
- Open the app at http://localhost:3000

## 🧪 Testing the Setup

Run the integration test to verify everything works:
```bash
python test_integration.py
```

## 🌐 Manual Setup (Alternative)

### Backend Setup
```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start backend
python app.py
```

### Frontend Setup
```bash
# In a new terminal
npm install
npm run dev
```

## 🎯 Using the Application

### Web Interface
1. Open http://localhost:3000
2. Choose search type:
   - **Replit Find**: Search Replit projects with GitHub repos
   - **GitHub Search**: Direct GitHub repository search
3. Enter search query or leave blank for default dorks
4. Configure filters (stars, language, score range)
5. Click "Search" and monitor progress
6. View results in the repository list

### Command Line (Legacy)
```bash
# Search with default dorks
python -m replit_finder

# Search with custom query
python -m replit_finder --query "python flask api" --min-score 15

# Search and clone repositories
python -m replit_finder --query "react typescript" --clone --max-results 20
```

## 🚀 Production Deployment

### Frontend (Netlify)
1. Build the project:
   ```bash
   npm run build
   ```

2. Deploy to Netlify:
   - Connect your GitHub repo to Netlify
   - Set build command: `npm run build`
   - Set publish directory: `dist`
   - Add environment variables in Netlify dashboard

### Backend Options

#### Option 1: Heroku
```bash
# Install Heroku CLI
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

#### Option 3: DigitalOcean App Platform
1. Connect your GitHub repository
2. Set environment variables
3. Deploy with automatic builds

### Update Frontend for Production
Update `.env` with your production backend URL:
```env
VITE_API_BASE_URL=https://your-backend.herokuapp.com/api
VITE_WS_BASE_URL=https://your-backend.herokuapp.com
```

## 🔍 Troubleshooting

### Common Issues

#### Backend Won't Start
- Check if port 5000 is available
- Verify Python dependencies are installed
- Check API keys in `.env` file

#### Frontend Can't Connect to Backend
- Ensure backend is running on port 5000
- Check CORS configuration in `app.py`
- Verify proxy settings in `vite.config.ts`

#### Search Returns No Results
- Verify SerpAPI key is valid and has remaining quota
- Check GitHub token permissions
- Try different search queries

#### Database Issues
- Delete `replit_finder.db` to reset database
- Check file permissions in the project directory

### Debug Mode
Start backend in debug mode:
```bash
export FLASK_DEBUG=1
python app.py
```

### Logs
Check application logs for detailed error information:
- Backend: Console output from `python app.py`
- Frontend: Browser developer console

## 📊 Performance Tips

### For Large Searches
- Increase `max_results` gradually
- Use specific search queries to reduce noise
- Monitor API rate limits

### Database Optimization
- Regularly clean old search results
- Index frequently queried fields
- Consider PostgreSQL for production

## 🔐 Security Best Practices

1. **Never commit API keys** to version control
2. **Use environment variables** for all secrets
3. **Rotate API keys** regularly
4. **Monitor API usage** to detect abuse
5. **Use HTTPS** in production

## 📚 Additional Resources

- [SerpAPI Documentation](https://serpapi.com/search-api)
- [GitHub API Documentation](https://docs.github.com/en/rest)
- [Flask Documentation](https://flask.palletsprojects.com/)
- [React Documentation](https://react.dev/)
- [Material-UI Documentation](https://mui.com/)

## 🆘 Getting Help

If you encounter issues:
1. Check this setup guide
2. Review the troubleshooting section
3. Check the GitHub issues
4. Run the integration test for diagnostics

## 🎉 Success!

Once everything is working, you should see:
- ✅ Backend API responding at http://localhost:5000
- ✅ Frontend app running at http://localhost:3000
- ✅ Real-time search progress updates
- ✅ Repository data displaying correctly
- ✅ All integration tests passing

Happy repository hunting! 🔍