# Quick Start Deployment Guide

## 🚀 Fast Track Deployment

### Backend (Render) - 5 minutes

1. **Create PostgreSQL Database on Render**
   - Go to [Render Dashboard](https://dashboard.render.com/)
   - Click **"New +"** → **"PostgreSQL"**
   - Name it `cell-scaler-db`
   - Copy the **Internal Database URL**

2. **Set Up Database Schema**
   - In Render dashboard → Your database → **"Connect"** tab
   - Use the **psql** command or Render Shell
   - Copy and paste the SQL from `server/database.sql`

3. **Deploy Backend**
   - Click **"New +"** → **"Web Service"**
   - Connect your GitHub repo
   - Settings:
     - **Root Directory**: `server`
     - **Build Command**: `npm install`
     - **Start Command**: `npm start`
   - Environment Variables:
     - `DATABASE_URL` = (your database URL from step 1)
     - `NODE_ENV` = `production`
   - Click **"Create Web Service"**
   - Copy your backend URL (e.g., `https://cell-scaler-backend.onrender.com`)

### Frontend (Vercel) - 3 minutes

1. **Deploy to Vercel**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click **"Add New..."** → **"Project"**
   - Import your GitHub repo
   - Settings:
     - **Framework Preset**: Vite
     - **Root Directory**: `client`
     - **Build Command**: `npm run build`
     - **Output Directory**: `dist`
   - Environment Variables:
     - `VITE_API_URL` = `https://your-backend-url.onrender.com`
   - Click **"Deploy"**

2. **Update Backend CORS (if needed)**
   - In Render → Your Web Service → Environment
   - Add: `FRONTEND_URL` = `https://your-vercel-app.vercel.app`

### ✅ Done!

- **Frontend**: `https://your-app.vercel.app`
- **Backend**: `https://your-backend.onrender.com`

---

## 📝 Environment Variables Checklist

### Backend (Render)
- [ ] `DATABASE_URL` - PostgreSQL connection string
- [ ] `NODE_ENV` - `production`
- [ ] `FRONTEND_URL` - Your Vercel URL (optional, for CORS)

### Frontend (Vercel)
- [ ] `VITE_API_URL` - Your Render backend URL

---

## 🐛 Common Issues

**CORS Errors?**
- Add `FRONTEND_URL` to backend environment variables
- Or update `server/index.js` CORS configuration

**Database Connection Failed?**
- Wait 30-60 seconds (Render free tier spins down)
- Verify `DATABASE_URL` is correct
- Check database is running in Render dashboard

**API Calls Failing?**
- Verify `VITE_API_URL` includes `https://`
- Check backend is deployed and running
- Test backend health: `https://your-backend.onrender.com/api/health`

---

For detailed instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md)

