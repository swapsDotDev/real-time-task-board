# Production Deployment Guide

This guide covers deploying the Real-Time Task Board application to a production environment without default test users.

## ⚠️ Important: No Default Users

This production setup includes **NO default test users**. All users must be created through:
1. The registration process in the application
2. The admin creation script: `npm run create-admin`

## 🚀 Quick Start

### Option 1: Docker Compose (Recommended)
```bash
# Clone the repository
git clone <your-repo-url>
cd real-time-task-board

# Run setup script
./setup.sh  # Linux/Mac
# or
setup.bat   # Windows

# Start all services
docker-compose up -d

# Check status
docker-compose ps
```

### Option 2: Manual Setup
```bash
# Start MongoDB
mongod

# Terminal 1 - Backend
cd backend
npm install
npm run dev

# Terminal 2 - Frontend
cd frontend
npm install --legacy-peer-deps
npm run dev
```

## 🌐 Production Deployment

### Heroku Deployment

#### Backend (API)
1. Create Heroku app:
```bash
heroku create taskboard-api
```

2. Set environment variables:
```bash
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your-super-secure-secret
heroku config:set MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/taskboard
heroku config:set CLIENT_URL=https://your-frontend-domain.com
```

3. Deploy:
```bash
git subtree push --prefix backend heroku main
```

#### Frontend (React App)
1. Create Heroku app:
```bash
heroku create taskboard-frontend
```

2. Add buildpack:
```bash
heroku buildpacks:set https://github.com/mars/create-react-app-buildpack.git
```

3. Set environment variables:
```bash
heroku config:set VITE_API_URL=https://your-api-domain.herokuapp.com
```

4. Deploy:
```bash
git subtree push --prefix frontend heroku main
```

### Vercel Deployment

#### Frontend
1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Deploy frontend:
```bash
cd frontend
vercel --prod
```

3. Set environment variables in Vercel dashboard:
- `VITE_API_URL`: Your backend API URL

#### Backend (Serverless)
1. Create `vercel.json` in backend folder:
```json
{
  "version": 2,
  "builds": [
    {
      "src": "src/server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/src/server.js"
    }
  ]
}
```

2. Deploy:
```bash
cd backend
vercel --prod
```

### AWS Deployment

#### Using AWS EC2
1. Launch EC2 instance (Ubuntu 20.04+)
2. Install dependencies:
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org

# Install PM2
sudo npm install -g pm2

# Install Nginx
sudo apt install nginx -y
```

3. Setup application:
```bash
# Clone repository
git clone <your-repo>
cd real-time-task-board

# Setup backend
cd backend
npm install --production
pm2 start src/server.js --name taskboard-api

# Setup frontend
cd ../frontend
npm install
npm run build

# Copy build to nginx
sudo cp -r dist/* /var/www/html/
```

4. Configure Nginx:
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        root /var/www/html;
        try_files $uri $uri/ /index.html;
    }
    
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
    
    location /socket.io {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Digital Ocean Deployment

#### Using App Platform
1. Create new app in Digital Ocean
2. Connect GitHub repository
3. Configure components:

**Backend Service:**
- Source: `/backend`
- Build Command: `npm install`
- Run Command: `npm start`
- Environment Variables:
  - `NODE_ENV=production`
  - `MONGODB_URI=your-mongodb-connection`
  - `JWT_SECRET=your-secret`

**Frontend Static Site:**
- Source: `/frontend`
- Build Command: `npm install && npm run build`
- Output Directory: `dist`

#### Using Droplet
Similar to AWS EC2 setup above.

### Railway Deployment

1. Connect GitHub repository to Railway
2. Deploy backend and frontend as separate services
3. Set environment variables in Railway dashboard
4. Railway will auto-deploy on git push

## 🗄️ Database Setup

### MongoDB Atlas (Recommended)
1. Create cluster at [MongoDB Atlas](https://cloud.mongodb.com)
2. Create database user
3. Whitelist IP addresses (0.0.0.0/0 for development)
4. Get connection string
5. Update `MONGODB_URI` in environment variables

### Self-hosted MongoDB
```bash
# Install MongoDB
sudo apt install mongodb

# Start MongoDB service
sudo systemctl start mongodb
sudo systemctl enable mongodb

# Create database and user
mongo
use taskboard
db.createUser({
  user: "taskboard_user",
  pwd: "secure_password",
  roles: ["readWrite"]
})
```

## 🔒 Security Considerations

### Environment Variables
Never commit these to version control:
- `JWT_SECRET`
- `MONGODB_URI`
- `DATABASE_PASSWORD`

### HTTPS/SSL
Always use HTTPS in production:
```bash
# Using Certbot for free SSL
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

### Firewall
Configure firewall rules:
```bash
# UFW (Ubuntu)
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw enable
```

## 📊 Monitoring

### PM2 Monitoring
```bash
# View processes
pm2 list

# View logs
pm2 logs taskboard-api

# Monitor resources
pm2 monit

# Restart app
pm2 restart taskboard-api
```

### Health Checks
The application includes health check endpoints:
- Backend: `GET /api/health`
- Frontend: `GET /health` (nginx)

## 🔄 CI/CD Pipeline

### GitHub Actions Example
```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Deploy to Heroku
        uses: akhileshns/heroku-deploy@v3.12.12
        with:
          heroku_api_key: ${{secrets.HEROKU_API_KEY}}
          heroku_app_name: "your-app-name"
          heroku_email: "your-email@example.com"
```

## 🐛 Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Check connection string
   - Verify network access
   - Check database credentials

2. **Socket.IO Connection Failed**
   - Verify WebSocket support
   - Check proxy configuration
   - Ensure CORS settings

3. **Build Failures**
   - Clear node_modules and reinstall
   - Check Node.js version compatibility
   - Use `--legacy-peer-deps` for React 19

4. **Memory Issues**
   - Increase server memory
   - Optimize database queries
   - Implement caching

### Performance Optimization

1. **Frontend**
   - Enable gzip compression
   - Implement code splitting
   - Optimize images and assets
   - Use CDN for static files

2. **Backend**
   - Database indexing
   - Query optimization
   - Implement caching (Redis)
   - Connection pooling

3. **Database**
   - Create proper indexes
   - Optimize queries
   - Regular maintenance
   - Monitor performance

## 📈 Scaling

### Horizontal Scaling
- Use load balancer (Nginx, HAProxy)
- Multiple backend instances
- Session store (Redis)
- Database clustering

### Vertical Scaling
- Increase server resources
- Optimize application code
- Database performance tuning

This deployment guide covers the most common scenarios. Choose the option that best fits your needs and infrastructure requirements.
