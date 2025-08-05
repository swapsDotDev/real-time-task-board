# 🔧 WebSocket Debug & Fix Guide

## 🚨 **Current Issue**
```
WebSocket authentication failed: Error: Token has been revoked
```

## 🎯 **Root Cause**
1. **Token Blacklisting**: JWT token was blacklisted during logout
2. **Stale Token Usage**: WebSocket trying to connect with old/revoked token
3. **No Token Refresh**: WebSocket doesn't refresh tokens automatically

## ✅ **Fixes Applied**

### **1. Frontend WebSocket Service (socket.js)**
- ✅ Added proper token handling with `currentToken` storage
- ✅ Enhanced authentication failure handling (code 1008)
- ✅ Added `updateToken()` method for token refresh
- ✅ Improved reconnection logic with fresh token retrieval
- ✅ Added `handleAuthenticationFailure()` for proper cleanup

### **2. Frontend AuthContext (AuthContext.jsx)**
- ✅ Added WebSocket authentication failure listener
- ✅ Automatic logout on WebSocket auth failure
- ✅ Proper cleanup of WebSocket connections

### **3. Backend WebSocket Service (websocketService.js)**
- ✅ Enhanced error logging with specific reasons
- ✅ Better error messages for different failure types
- ✅ Improved connection rejection handling

## 🚀 **Deployment Steps**

### **Step 1: Commit and Push Changes**
```bash
git add .
git commit -m "Fix WebSocket authentication issues - handle token revocation"
git push origin main
```

### **Step 2: Redeploy Backend (Render)**
1. Go to [Render Dashboard](https://render.com)
2. Select `real-time-task-board-pqql` service
3. Click **"Manual Deploy"** → **"Deploy Latest Commit"**
4. Wait for deployment (2-3 minutes)

### **Step 3: Redeploy Frontend (Vercel)**
1. Go to [Vercel Dashboard](https://vercel.com)
2. Select your project
3. Go to **Deployments** tab
4. Click **"Redeploy"** on latest deployment
5. Wait for deployment (1-2 minutes)

### **Step 4: Clear User Sessions (Critical)**
```bash
# Connect to MongoDB Atlas
# Go to Collections → taskboard → blacklistedtokens
# Clear all blacklisted tokens (optional - for clean start)

# OR let tokens expire naturally (24h with current JWT_EXPIRE)
```

## 🧪 **Testing Steps**

### **1. Test Authentication Flow**
1. **Clear Browser Data**: `F12` → Application → Storage → Clear All
2. **Visit Frontend**: `https://your-vercel-app.vercel.app`
3. **Login with Demo Credentials**:
   - Email: `admin@taskboard.com`
   - Password: `AdminPass123!`

### **2. Test WebSocket Connection**
1. **Open Browser Console**: `F12` → Console
2. **Look for WebSocket Messages**:
   ```
   ✅ Expected: "✅ WebSocket connected"
   ❌ Avoid: "❌ WebSocket authentication failed"
   ```

### **3. Test Real-Time Updates**
1. **Open Two Browser Windows** (same user or different users)
2. **Create a Task** in one window
3. **Verify Real-Time Update** in other window
4. **Test Drag & Drop** between columns

### **4. Test Token Revocation Handling**
1. **Login** → **Logout** → **Login Again**
2. **Verify** WebSocket connects after re-login
3. **Check Console** for authentication messages

## 🐛 **Common Issues & Solutions**

### **Issue 1: Still Getting "Token Revoked" Error**
**Solution**: Clear browser storage completely
```javascript
// Run in browser console
localStorage.clear();
sessionStorage.clear();
location.reload();
```

### **Issue 2: WebSocket Not Connecting in Production**
**Solution**: Check environment variables
```bash
# Vercel Environment Variables
VITE_API_URL=https://real-time-task-board-pqql.onrender.com/api

# Render Environment Variables  
FRONTEND_URL=https://your-vercel-app.vercel.app
```

### **Issue 3: CORS Errors with WebSocket**
**Solution**: Backend already configured, but verify:
```javascript
// Check backend server.js CORS origins include your Vercel URL
```

## 🔍 **Debug Commands**

### **Check WebSocket Status (Browser Console)**
```javascript
// Check connection status
console.log('WebSocket Status:', socketService.isConnected);

// Check stored token
console.log('Token:', localStorage.getItem('token'));

// Manual reconnect
socketService.disconnect();
socketService.connect(localStorage.getItem('token'));
```

### **Backend Logs (Render Dashboard)**
1. Go to Render → Your Service → Logs
2. Look for:
   ```
   ✅ Good: "🔌 User connected via WebSocket: [name]"
   ❌ Bad: "❌ WebSocket authentication failed: Token has been revoked"
   ```

## 📊 **Success Criteria**

- [ ] Users can login without WebSocket errors
- [ ] Real-time task updates work across browsers
- [ ] Logout → Re-login → WebSocket reconnects successfully  
- [ ] No "Token revoked" errors in production
- [ ] WebSocket connection survives page refreshes

## 🎯 **Next Steps After Fix**

1. **Monitor Logs**: Watch Render logs for 24 hours
2. **User Testing**: Test with multiple demo accounts
3. **Performance**: Check WebSocket connection stability
4. **Documentation**: Update README with troubleshooting

---

## 🚨 **Emergency Rollback** (If Issues Persist)

```bash
# Revert to previous working commit
git log --oneline -5
git revert <commit-hash>
git push origin main
```

**This fix addresses the core token revocation issue and provides robust WebSocket authentication handling for production deployment.**
