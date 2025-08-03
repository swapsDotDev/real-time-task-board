# Deployment Checklist ✅

## Pre-Deployment Requirements

### 1. Accounts Setup
- [ ] GitHub account created
- [ ] MongoDB Atlas account created
- [ ] Render account created  
- [ ] Vercel account created

### 2. MongoDB Atlas Setup
- [ ] Create new cluster (free tier available)
- [ ] Create database user with read/write permissions
- [ ] Configure network access (allow 0.0.0.0/0)
- [ ] Get connection string: `mongodb+srv://username:password@cluster.mongodb.net/taskboard`

### 3. GitHub Repository
- [ ] Create new repository: `real-time-task-board`
- [ ] Initialize local git repository
- [ ] Add remote origin
- [ ] Push code to GitHub

## Deployment Steps

### 4. Backend Deployment (Render)
- [ ] Go to Render.com dashboard
- [ ] Create new Web Service
- [ ] Connect GitHub repository
- [ ] Configure settings:
  ```
  Name: real-time-task-board-backend
  Branch: main
  Root Directory: backend
  Runtime: Node.js  
  Build Command: npm install
  Start Command: npm start
  ```
- [ ] Set environment variables:
  ```
  NODE_ENV=production
  MONGODB_URI=<mongodb-atlas-connection-string>
  JWT_SECRET=<64-character-secret>
  PORT=10000
  FRONTEND_URL=<will-update-after-vercel>
  ```
- [ ] Deploy service
- [ ] Note backend URL (e.g., `https://your-app.onrender.com`)

### 5. Frontend Deployment (Vercel)
- [ ] Go to Vercel.com dashboard
- [ ] Import GitHub repository
- [ ] Configure settings:
  ```
  Framework: Vite
  Root Directory: frontend
  Build Command: npm run build
  Output Directory: dist
  Install Command: npm install
  ```
- [ ] Set environment variables:
  ```
  VITE_API_URL=<render-backend-url>/api
  VITE_APP_NAME=TaskBoard
  ```
- [ ] Deploy application
- [ ] Note frontend URL (e.g., `https://your-project.vercel.app`)

### 6. Update CORS Settings
- [ ] Go back to Render backend service
- [ ] Update `FRONTEND_URL` environment variable with Vercel URL
- [ ] Redeploy backend service

### 7. Create Admin User
- [ ] In Render dashboard, open backend service shell
- [ ] Run: `node create-admin.js`
- [ ] Follow prompts to create admin user
- [ ] Save admin credentials securely

## Testing Deployment

### 8. Verify Application
- [ ] Test frontend URL loads correctly
- [ ] Test backend health check: `<backend-url>/api/health`
- [ ] Test login with admin credentials
- [ ] Test creating a task
- [ ] Test real-time updates (open in 2 browser tabs)
- [ ] Test drag and drop functionality
- [ ] Test user management (admin features)

## Live URLs Template

Fill in your actual URLs after deployment:

```
Frontend: https://your-project.vercel.app
Backend:  https://your-app.onrender.com
Health:   https://your-app.onrender.com/api/health
```

## Troubleshooting

### Common Issues:
1. **CORS errors**: Ensure FRONTEND_URL is set correctly in Render
2. **Database connection**: Verify MongoDB Atlas connection string
3. **Build failures**: Check environment variables are set
4. **WebSocket issues**: Render supports WebSocket connections by default
5. **GitHub Actions CI failures**: 
   - Ensure package-lock.json files are committed (not in .gitignore)
   - Check that all environment variables for testing are set
   - Verify Node.js version compatibility (18.x and 20.x supported)

### Support:
- Check deployment logs in Render/Vercel dashboards
- Verify environment variables are set correctly
- Test API endpoints individually
- Check network connectivity
- Monitor GitHub Actions workflow runs for CI/CD status

---

**🎉 Once complete, your Real-Time Task Board will be live and accessible worldwide!**
