# Quick Fix Guide for Common Issues 🔧

## GitHub Actions / CI Issues

### Issue: "Dependencies lock file is not found"
**Problem**: GitHub Actions can't find package-lock.json files
**Solution**: 
```bash
# Make sure package-lock.json files are committed
git add backend/package-lock.json frontend/package-lock.json package-lock.json
git commit -m "Add package-lock.json files for CI/CD"
git push
```

### Issue: GitHub Actions workflow fails
**Problem**: Workflow uses `npm ci` but lock files are missing
**Solution**: Workflow updated to use `npm install` instead

## Render Deployment Issues

### Issue: Build fails with "Module not found"
**Solution**: Check these in Render dashboard:
1. **Root Directory**: Should be `backend`
2. **Build Command**: Should be `npm install`
3. **Start Command**: Should be `npm start`

### Issue: "Cannot connect to database"
**Solution**: Check MongoDB Atlas connection:
1. Verify MONGODB_URI environment variable
2. Ensure database user has read/write permissions
3. Check network access allows 0.0.0.0/0

### Issue: CORS errors in browser
**Solution**: Update FRONTEND_URL in Render:
1. Go to Render dashboard → Your service → Environment
2. Set FRONTEND_URL to your Vercel URL
3. Redeploy service

## Vercel Deployment Issues

### Issue: Build fails with "Command not found"
**Solution**: Check Vercel project settings:
1. **Framework Preset**: Vite
2. **Root Directory**: `frontend`
3. **Build Command**: `npm run build`
4. **Output Directory**: `dist`

### Issue: "API calls failing"
**Solution**: Check environment variables in Vercel:
1. VITE_API_URL should point to your Render backend
2. Format: `https://your-app.onrender.com/api`

## Application Runtime Issues

### Issue: WebSocket connection fails
**Solution**: 
1. Ensure backend is deployed and running
2. Check JWT token is being passed correctly
3. Verify WebSocket endpoint is accessible

### Issue: Admin user can't be created
**Solution**: Use Render shell:
```bash
# In Render dashboard → Shell tab
node create-admin.js
```

### Issue: Tasks not updating in real-time
**Solution**: 
1. Check WebSocket connection in browser dev tools
2. Verify both users are logged in
3. Check network connectivity

## Quick Test Commands

### Test Backend Health
```bash
curl https://your-app.onrender.com/api/health
```

### Test Frontend Build Locally
```bash
cd frontend && npm run build
```

### Test Backend Locally
```bash
cd backend && npm start
```

## Environment Variable Templates

### Render (Backend)
```
NODE_ENV=production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/taskboard
JWT_SECRET=your_64_character_secret_here
PORT=10000
FRONTEND_URL=https://your-project.vercel.app
```

### Vercel (Frontend)
```
VITE_API_URL=https://your-app.onrender.com/api
VITE_APP_NAME=TaskBoard
```

## Still Having Issues?

1. **Check logs**: Both Render and Vercel provide detailed deployment logs
2. **Test locally**: Make sure the app works on your local machine first
3. **Environment variables**: Double-check all env vars are set correctly
4. **Database**: Verify MongoDB Atlas connectivity
5. **GitHub**: Ensure all code is pushed and workflows are running

---

**💡 Tip**: Always test one component at a time - backend first, then frontend, then real-time features.
