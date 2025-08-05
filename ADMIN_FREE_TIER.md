# 👑 CREATE ADMIN USER - RENDER FREE TIER

Since Render Shell is only available on paid plans, here are alternative methods to create your admin user:

## 🎯 **Method 1: API Endpoint (Easiest)**

I've created a special one-time admin creation endpoint for you.

### **Step 1: Deploy the New Code**
The admin creation endpoint has been added to your backend. Commit and push:

```bash
git add backend/src/routes/admin-setup.js backend/src/server.js
git commit -m "Add one-time admin creation endpoint for Render free tier"
git push origin main
```

### **Step 2: Redeploy on Render**
1. Go to [render.com](https://render.com)
2. Click your service: `real-time-task-board-pqql`
3. Click "Manual Deploy" → "Deploy Latest Commit"
4. Wait for deployment

### **Step 3: Create Admin via API Call**
Use curl, Postman, or any HTTP client:

```bash
curl -X POST https://real-time-task-board-pqql.onrender.com/api/admin/create-first-admin \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin User",
    "email": "admin@taskboard.com", 
    "password": "AdminPass123!"
  }'
```

**Expected Response:**
```json
{
  "message": "Admin user created successfully",
  "admin": {
    "id": "...",
    "name": "Admin User",
    "email": "admin@taskboard.com",
    "role": "admin",
    "createdAt": "2025-08-05T08:00:00.000Z"
  }
}
```

### **Step 4: Test Login**
Go to your frontend and login with:
- **Email**: `admin@taskboard.com`
- **Password**: `AdminPass123!`

---

## 🎯 **Method 2: Regular User Registration + Database Update**

### **Step 1: Register as Normal User**
1. Go to your frontend: `https://real-time-task-board-e098iulss-swapsdotdevs-projects.vercel.app`
2. Click "Register"
3. Create account with email: `admin@taskboard.com`

### **Step 2: Use MongoDB Atlas Dashboard**
1. Go to [MongoDB Atlas](https://cloud.mongodb.com)
2. Browse Collections → `taskboard` database → `users` collection
3. Find your user document
4. Edit the document and change:
   ```json
   {
     "role": "admin"
   }
   ```
5. Save changes

---

## 🎯 **Method 3: Environment Variables + Startup Script**

### **Add to Render Environment Variables:**
```env
CREATE_ADMIN_ON_STARTUP=true
ADMIN_NAME=Admin User
ADMIN_EMAIL=admin@taskboard.com
ADMIN_PASSWORD=AdminPass123!
```

This would require modifying the server.js to check these variables on startup.

---

## 🔐 **Security Notes**

### **For Method 1 (API Endpoint):**
- ✅ Only works if no admin exists
- ✅ Only works if database has < 5 users
- ✅ Endpoint automatically disables after first use
- ⚠️ **Remove the endpoint** after creating admin (optional)

### **For All Methods:**
- 🔑 **Change default password** after first login
- 📧 **Use your real email** address
- 🗑️ **Consider removing the setup endpoint** after use

---

## 🚀 **Recommended: Use Method 1**

Method 1 (API endpoint) is the safest and easiest approach:

1. **Deploy the new code** (commit + push + redeploy)
2. **Make one API call** to create admin
3. **Login and test** admin functionality
4. **Optional**: Remove the admin setup route

This gives you full admin access without needing paid Render features!

---

## ✅ **Success Verification**

After creating admin user:
- [ ] Can login with admin credentials
- [ ] Has admin role in the application
- [ ] Can access admin-only features
- [ ] Can manage other users and tasks

**Choose Method 1 for the easiest setup on Render free tier!** 🎯
