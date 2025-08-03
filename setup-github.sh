#!/bin/bash

echo "🚀 Real-Time Task Board - GitHub & Deployment Setup"
echo "=================================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo -e "${RED}❌ Git is not installed. Please install Git first.${NC}"
    exit 1
fi

echo -e "${BLUE}📋 Pre-deployment Checklist:${NC}"
echo "□ MongoDB Atlas cluster created"
echo "□ GitHub repository created" 
echo "□ Render account ready"
echo "□ Vercel account ready"
echo ""

read -p "Have you completed the checklist above? (y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}⚠️ Please complete the checklist first${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Starting deployment setup...${NC}"
echo ""

# Initialize git if not already initialized
if [ ! -d ".git" ]; then
    echo -e "${BLUE}📦 Initializing Git repository...${NC}"
    git init
    git add .
    git commit -m "Initial commit: Real-time Task Board application"
    echo -e "${GREEN}✅ Git repository initialized${NC}"
else
    echo -e "${YELLOW}⚠️ Git repository already exists${NC}"
fi

# Check if remote origin exists
if git remote | grep -q origin; then
    echo -e "${YELLOW}⚠️ Remote origin already exists${NC}"
else
    echo ""  
    read -p "Enter your GitHub repository URL (https://github.com/username/repo.git): " GITHUB_URL
    if [ ! -z "$GITHUB_URL" ]; then
        git remote add origin "$GITHUB_URL"
        echo -e "${GREEN}✅ Remote origin added${NC}"
    fi
fi

echo ""
echo -e "${BLUE}🔧 Environment Configuration:${NC}"
echo ""

# Backend environment
echo -e "${YELLOW}Backend Environment Variables needed for Render:${NC}"
echo "NODE_ENV=production"
echo "MONGODB_URI=<your-mongodb-atlas-connection-string>"
echo "JWT_SECRET=<your-64-character-secret>"
echo "PORT=10000"
echo "FRONTEND_URL=<your-vercel-url>"
echo ""

# Frontend environment  
echo -e "${YELLOW}Frontend Environment Variables needed for Vercel:${NC}"
echo "VITE_API_URL=<your-render-backend-url>/api"
echo "VITE_APP_NAME=TaskBoard"
echo ""

# Generate JWT secret
echo -e "${BLUE}🔐 Generating JWT Secret:${NC}"
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
echo "Your JWT Secret: $JWT_SECRET"
echo -e "${RED}⚠️ Save this secret securely for Render deployment${NC}"
echo ""

# Push to GitHub
read -p "Push to GitHub now? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    git branch -M main
    git push -u origin main
    echo -e "${GREEN}✅ Code pushed to GitHub${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Setup Complete!${NC}"
echo ""
echo -e "${BLUE}Next Steps:${NC}"
echo "1. 🗄️  Set up MongoDB Atlas database"
echo "2. 🖥️  Deploy backend to Render using your GitHub repo"  
echo "3. 🌐 Deploy frontend to Vercel using your GitHub repo"
echo "4. 🔗 Update CORS settings with your Vercel URL"
echo "5. 👤 Create admin user using Render shell"
echo ""
echo -e "${YELLOW}📖 See DEPLOYMENT_GUIDE.md for detailed instructions${NC}"
