# Render Deployment Configuration

## Backend Deployment Settings

### Build Command
```bash
cd backend && npm install
```

### Start Command
```bash
cd backend && npm start
```

### Environment Variables (to be set in Render Dashboard)
```
NODE_ENV=production
MONGODB_URI=<your-mongodb-atlas-connection-string>
JWT_SECRET=<your-secure-jwt-secret>
PORT=10000
FRONTEND_URL=<your-vercel-app-url>
```

### Auto-Deploy
- Connected to GitHub repository
- Auto-deploy on push to main branch
- Health check endpoint: `/api/health`

## Frontend Deployment (Vercel)

### Build Command
```bash
cd frontend && npm run build
```

### Output Directory
```
frontend/dist
```

### Environment Variables (to be set in Vercel Dashboard)
```
VITE_API_URL=<your-render-backend-url>/api
VITE_APP_NAME=TaskBoard
```

## MongoDB Atlas Setup

1. Create a MongoDB Atlas cluster
2. Set up database user and password
3. Configure network access (allow all IPs: 0.0.0.0/0 for simplicity)
4. Get the connection string
5. Update MONGODB_URI in Render environment variables

## Post-Deployment Steps

1. Create admin user using the create-admin script
2. Test the application functionality
3. Monitor logs for any issues
