#!/bin/bash

# Production Deployment Script for Replit Production Finder

echo "🚀 Deploying Replit Production Finder to Production..."

# Check if required environment variables are set
if [ -z "$SERPAPI_API_KEY" ] || [ -z "$GITHUB_TOKEN" ]; then
    echo "❌ Error: Required environment variables not set"
    echo "Please set SERPAPI_API_KEY and GITHUB_TOKEN"
    exit 1
fi

# Build frontend
echo "🔨 Building frontend for production..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Frontend build failed"
    exit 1
fi

# Deploy to Netlify (if netlify-cli is installed)
if command -v netlify &> /dev/null; then
    echo "🌐 Deploying to Netlify..."
    netlify deploy --prod --dir=dist
    
    if [ $? -eq 0 ]; then
        echo "✅ Frontend deployed successfully to Netlify!"
    else
        echo "❌ Netlify deployment failed"
    fi
else
    echo "📦 Netlify CLI not found. Please install it with: npm install -g netlify-cli"
    echo "📁 Built files are in the 'dist' directory - you can manually upload to Netlify"
fi

# Instructions for backend deployment
echo ""
echo "🖥️  Backend Deployment Instructions:"
echo "1. Deploy the backend to Heroku, Railway, or similar platform"
echo "2. Set environment variables on your hosting platform:"
echo "   - SERPAPI_API_KEY=$SERPAPI_API_KEY"
echo "   - GITHUB_TOKEN=[HIDDEN]"
echo "   - SCRAPERAPI_KEY=$SCRAPERAPI_KEY (optional)"
echo "3. Update netlify.toml with your backend URL"
echo "4. Redeploy frontend with updated backend URL"
echo ""
echo "📚 See README.md for detailed deployment instructions"