#!/bin/bash

echo "🔧 Fixing Node.js frontend issues..."

# Remove problematic files
echo "📦 Cleaning up node_modules and package-lock.json..."
rm -rf node_modules
rm -f package-lock.json

# Clear npm cache
echo "🧹 Clearing npm cache..."
npm cache clean --force

# Reinstall dependencies
echo "📥 Reinstalling dependencies..."
npm install

# Try to start the development server
echo "🚀 Starting development server..."
npm run dev