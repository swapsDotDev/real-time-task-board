# 🔧 VERCEL DEPLOYMENT FIX

## ❌ Problem
Vercel build fails with: `sh: line 1: cd: frontend: No such file or directory`

## ✅ Solution: Configure Vercel Dashboard Settings

### **Step 1: Go to Vercel Dashboard**
1. Login to [vercel.com](https://vercel.com)
2. Go to your project: `real-time-task-board`
3. Click **Settings** → **General**

### **Step 2: Update Project Settings**

| Setting | Value | Why |
|---------|-------|-----|
| **Root Directory** | `frontend` | 🎯 **KEY FIX** - Tells Vercel to build from frontend folder |
| **Framework Preset** | `Vite` | Auto-detects build commands |
| **Node.js Version** | `18.x` | Matches our development version |

### **Step 3: Build & Output Settings**

| Setting | Value | Status |
|---------|--------|--------|
| **Build Command** | `npm run build` | ✅ Auto-detected |
| **Output Directory** | `dist` | ✅ Auto-detected |
| **Install Command** | `npm install --legacy-peer-deps` | ⚠️ Must set manually |
| **Development Command** | `npm run dev` | ✅ Auto-detected |

### **Step 4: Environment Variables**
Go to **Settings** → **Environment Variables** and add:

```env
VITE_API_URL=https://real-time-task-board-pqql.onrender.com/api
VITE_APP_NAME=TaskBoard
```

**🎯 IMPORTANT**: Use your actual Render backend URL: `https://real-time-task-board-pqql.onrender.com/api`

### **Step 5: Deploy**
1. Click **Deployments** tab
2. Click **Redeploy** on latest deployment
3. ✅ Build should now succeed!

---

## 🎯 **Why This Works**

**Before Fix:**
- Vercel runs from repo root: `/`
- Tries to run: `cd frontend && npm install`
- Fails because it's already in root, not seeing frontend folder structure

**After Fix:**
- Vercel runs from: `/frontend` (Root Directory setting)
- Runs: `npm install --legacy-peer-deps` (from frontend directory)
- ✅ Success! All files and package.json are in correct location

---

## 📱 **Alternative: Manual Project Import**

If settings don't work, create a new Vercel project:

1. **Delete current Vercel project**
2. **Import again from GitHub**
3. **During import, set Root Directory to `frontend`**
4. **Set Install Command to `npm install --legacy-peer-deps`**

---

## 🚀 **Expected Result**

After fixing settings, you should see:
```
✅ Running "install" command: `npm install --legacy-peer-deps`...
✅ Running "build" command: `npm run build`...
✅ Build completed successfully
✅ Deployment ready
```

**Your frontend will be live at**: `https://your-project.vercel.app`

---

## 🔄 **Quick Checklist**

- [ ] Root Directory set to `frontend`
- [ ] Install Command set to `npm install --legacy-peer-deps`
- [ ] Framework set to `Vite`
- [ ] Environment variables added
- [ ] Redeployed project
- [ ] Build succeeded
