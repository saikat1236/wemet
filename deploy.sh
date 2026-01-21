#!/bin/bash

# VideoChat App - Quick Deployment Script
# This script helps you deploy your app to GitHub and Render

echo "🚀 VideoChat App - Deployment Helper"
echo "====================================="
echo ""

# Check if git is initialized
if [ ! -d .git ]; then
    echo "❌ Git repository not initialized!"
    echo "Run: git init"
    exit 1
fi

# Check if remote is set
if ! git remote | grep -q origin; then
    echo "📝 GitHub repository URL needed"
    echo ""
    read -p "Enter your GitHub repository URL (e.g., https://github.com/username/repo.git): " REPO_URL
    
    if [ -z "$REPO_URL" ]; then
        echo "❌ No URL provided. Exiting."
        exit 1
    fi
    
    echo "🔗 Adding remote origin..."
    git remote add origin "$REPO_URL"
fi

# Check for uncommitted changes
if ! git diff-index --quiet HEAD --; then
    echo "📦 Committing changes..."
    git add .
    git commit -m "Prepare for deployment"
fi

# Push to GitHub
echo "⬆️  Pushing to GitHub..."
git branch -M main
git push -u origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Successfully pushed to GitHub!"
    echo ""
    echo "🎯 Next Steps:"
    echo "1. Go to https://render.com"
    echo "2. Sign up or log in"
    echo "3. Click 'New +' → 'Web Service'"
    echo "4. Connect your GitHub repository"
    echo "5. Render will auto-detect the configuration"
    echo "6. Click 'Create Web Service'"
    echo ""
    echo "⏱️  Deployment takes about 3-5 minutes"
    echo "🌐 Your app will be live at: https://your-app-name.onrender.com"
    echo ""
    echo "📖 For detailed instructions, see DEPLOYMENT.md"
else
    echo ""
    echo "❌ Push failed. Please check your GitHub credentials and try again."
    echo "You may need to:"
    echo "1. Create the repository on GitHub first"
    echo "2. Set up SSH keys or use HTTPS authentication"
    echo ""
    echo "For help, see: https://docs.github.com/en/get-started/quickstart/create-a-repo"
fi
