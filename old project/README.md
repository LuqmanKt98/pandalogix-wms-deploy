# 🐼 PandaLogix WMS - Deploy to Vercel

## ✅ CORRECT STRUCTURE (Fixed!)

```
pandalogix-wms/
├── app/              ← At ROOT level (not in src/)
│   ├── layout.js
│   ├── page.js
│   └── WMSApp.jsx
├── package.json
└── next.config.js
```

## 🚀 Deploy Instructions

### Verify Structure First!

Before deploying, check your folder:
```bash
ls -la
# You should see:
# app/
# package.json
# next.config.js
```

```bash
ls -la app/
# You should see:
# layout.js
# page.js
# WMSApp.jsx
```

### Deploy to Vercel

**Option 1: GitHub**
1. Push ALL files to GitHub (including the `app` folder!)
2. On GitHub, verify you see the `app` folder
3. Go to vercel.com → Import repository → Deploy

**Option 2: Vercel CLI (Easier)**
```bash
npm install -g vercel
cd pandalogix-wms-deploy
vercel
```

### Test Locally First

```bash
npm install
npm run build    # Must succeed!
npm run dev      # Test at localhost:3000
```

## ⚠️ Common Issue

**If GitHub doesn't show the `app` folder:**
- GitHub may have ignored it
- Solution: Use Vercel CLI instead
- Or zip the folder and upload directly to Vercel

## 📦 What's Inside

- Complete WMS with all features
- Client management
- Quality control with photos
- Inventory tracking
- Reports with CSV export

## 🐼 Support

If you still get the error, the `app` folder is not being uploaded.

**Quick fix:**
```bash
# Use Vercel CLI - it will upload everything correctly
npm i -g vercel
vercel
```

🎋 Built for PandaLogix
