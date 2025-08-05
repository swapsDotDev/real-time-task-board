# 🚀 RENDER BACKEND DEPLOYMEN```env
NOAfter service creation, go to **Environment** tab and add:

```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@YOUR_CLUSTER.mongodb.net/taskboard?retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET=your_secure_64_character_jwt_secret_key_here_replace_with_actual_secret
PORT=10000
FRONTEND_URL=https://your-vercel-app.vercel.app
```

**📝 Environment Variable Notes:**uction
MONGODB_URI=mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@YOUR_CLUSTER.mongodb.net/taskboard?retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET=your_secure_64_character_jwt_secret_key_here_replace_with_actual_secret
PORT=10000
FRONTEND_URL=https://your-vercel-app.vercel.app
```

**📝 Environment Variable Notes:**
- **MONGODB_URI**: Replace with your actual MongoDB Atlas connection string
- **JWT_SECRET**: Replace with your secure 128-character secret
- **PORT**: Must be 10000 (Render requirement)
- **FRONTEND_URL**: Update with actual Vercel URL after frontend deployment

**🚨 SECURITY**: Never commit real credentials to git. Use placeholders in documentation. Step-by-Step Deployment Process

### **1. Create Web Service on Render**

1. **Go to [render.com](https://render.com)** and login
2. **Click "New +"** → **"Web Service"**
3. **Connect GitHub** and select: `swapsDotDev/real-time-task-board`

### **2. Service Configuration**

Set these **exact settings** during creation:

```
Name: taskboard-backend
Region: Ohio (US East)
Branch: main
Root Directory: backend
Runtime: Node
Build Command: npm install
Start Command: npm start
Instance Type: Free
```

### **3. Environment Variables**

After service creation, go to **Environment** tab and add:

```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@YOUR_CLUSTER.mongodb.net/taskboard?retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET=your_secure_jwt_secret_replace_with_actual_secret
PORT=10000
FRONTEND_URL=https://your-vercel-app.vercel.app
```

**� Environment Variable Notes:**
- **MONGODB_URI**: Your Atlas connection with database name `taskboard`
- **JWT_SECRET**: Secure 128-character secret (generated above)
- **PORT**: Must be 10000 (Render requirement)
- **FRONTEND_URL**: Update with actual Vercel URL after frontend deployment

### **4. Deploy Service**

1. **Click "Create Web Service"**
2. **Wait for deployment** (usually 2-5 minutes)
3. **Check logs** for any errors
4. **Test the health endpoint**: `https://your-app.onrender.com/api/health`

### **5. Post-Deployment Setup**

#### **A. Create Admin User**
1. **Go to your Render service dashboard**
2. **Click "Shell" tab**
3. **Run**: `node create-admin.js`
4. **Follow prompts** to create admin user

#### **B. Test API Endpoints**
Your backend will be available at: `https://your-app-name.onrender.com`

Test these endpoints:
- **Health Check**: `GET /api/health`
- **Register**: `POST /api/auth/register`
- **Login**: `POST /api/auth/login`
- **Tasks**: `GET /api/tasks` (requires auth)

### **6. Update Frontend URL**

After Vercel frontend is deployed:
1. **Copy your Vercel URL**: `https://your-project.vercel.app`
2. **Go to Render** → Your service → **Environment**
3. **Update FRONTEND_URL** with actual Vercel URL
4. **Redeploy service**

---

## 🔍 Expected Deployment Process

### **During Deployment, you'll see:**

```bash
==> Cloning from https://github.com/swapsDotDev/real-time-task-board...
==> Using Node version 18.19.0
==> Running build command 'npm install'...
==> Installing dependencies
==> Starting service with 'npm start'...
==> Server listening on port 10000
==> Your service is live at https://your-app.onrender.com
```

### **Health Check Response:**
```json
{
  "status": "OK",
  "message": "Task Board API is running",
  "timestamp": "2025-08-05T12:00:00.000Z",
  "environment": "production"
}
```

---

## 🚨 Common Issues & Solutions

### **Issue: Build Fails**
- **Check**: Root Directory is set to `backend`
- **Check**: Build Command is `npm install`
- **Check**: package.json exists in backend folder

### **Issue: Database Connection Error**
- **Check**: MONGODB_URI is correct
- **Check**: MongoDB Atlas allows connections from 0.0.0.0/0
- **Check**: Database user has read/write permissions

### **Issue: Service Won't Start**
- **Check**: Start Command is `npm start`
- **Check**: PORT environment variable is set to 10000
- **Check**: All required environment variables are present

### **Issue: CORS Errors**
- **Check**: FRONTEND_URL points to your actual Vercel URL
- **Update**: FRONTEND_URL after frontend deployment

---

## 📋 Deployment Checklist

- [ ] ✅ Render account created
- [ ] ✅ GitHub repository connected
- [ ] ✅ Web service configured with correct settings
- [ ] ✅ Environment variables added
- [ ] ✅ Service deployed successfully
- [ ] ✅ Health endpoint responds
- [ ] ✅ Admin user created
- [ ] ✅ API endpoints tested
- [ ] ✅ Frontend URL updated (after Vercel deployment)

---

## 🎯 Next Steps

1. **Deploy backend** (follow this guide)
2. **Fix Vercel frontend** (using VERCEL_FIX.md)
3. **Update FRONTEND_URL** in Render with actual Vercel URL
4. **Test complete application** end-to-end

**Your backend will be live at**: `https://your-app-name.onrender.com/api`
