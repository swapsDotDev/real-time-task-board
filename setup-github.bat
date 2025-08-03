@echo off
echo 🚀 Real-Time Task Board - GitHub ^& Deployment Setup
echo ==================================================
echo.

REM Check if git is installed
git --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Git is not installed. Please install Git first.
    pause
    exit /b 1
)

echo 📋 Pre-deployment Checklist:
echo □ MongoDB Atlas cluster created
echo □ GitHub repository created
echo □ Render account ready
echo □ Vercel account ready
echo.

set /p CHECKLIST="Have you completed the checklist above? (y/n): "
if /i not "%CHECKLIST%"=="y" (
    echo ⚠️ Please complete the checklist first
    pause
    exit /b 1
)

echo ✅ Starting deployment setup...
echo.

REM Initialize git if not already initialized
if not exist ".git" (
    echo 📦 Initializing Git repository...
    git init
    git add .
    git commit -m "Initial commit: Real-time Task Board application"
    echo ✅ Git repository initialized
) else (
    echo ⚠️ Git repository already exists
)

REM Check if remote origin exists
git remote | find "origin" >nul
if errorlevel 1 (
    echo.
    set /p GITHUB_URL="Enter your GitHub repository URL (https://github.com/username/repo.git): "
    if not "%GITHUB_URL%"=="" (
        git remote add origin "%GITHUB_URL%"
        echo ✅ Remote origin added
    )
) else (
    echo ⚠️ Remote origin already exists
)

echo.
echo 🔧 Environment Configuration:
echo.

echo Backend Environment Variables needed for Render:
echo NODE_ENV=production
echo MONGODB_URI=^<your-mongodb-atlas-connection-string^>
echo JWT_SECRET=^<your-64-character-secret^>
echo PORT=10000
echo FRONTEND_URL=^<your-vercel-url^>
echo.

echo Frontend Environment Variables needed for Vercel:
echo VITE_API_URL=^<your-render-backend-url^>/api
echo VITE_APP_NAME=TaskBoard
echo.

echo 🔐 Generating JWT Secret:
for /f %%i in ('node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"') do set JWT_SECRET=%%i
echo Your JWT Secret: %JWT_SECRET%
echo ⚠️ Save this secret securely for Render deployment
echo.

set /p PUSH="Push to GitHub now? (y/n): "
if /i "%PUSH%"=="y" (
    git branch -M main
    git push -u origin main
    echo ✅ Code pushed to GitHub
)

echo.
echo 🎉 Setup Complete!
echo.
echo Next Steps:
echo 1. 🗄️  Set up MongoDB Atlas database
echo 2. 🖥️  Deploy backend to Render using your GitHub repo
echo 3. 🌐 Deploy frontend to Vercel using your GitHub repo
echo 4. 🔗 Update CORS settings with your Vercel URL
echo 5. 👤 Create admin user using Render shell
echo.
echo 📖 See DEPLOYMENT_GUIDE.md for detailed instructions
pause
