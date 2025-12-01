# 🐼 PandaLogix WMS

Production-ready Warehouse Management System built with Next.js 14 (App Router), TypeScript, and Tailwind CSS 3.4. It includes client management, quality control with photos, inventory tracking, and CSV exportable reports.

## Features

- Client management
- Quality control with photos
- Inventory tracking with low-stock alerts
- Reports with CSV export
- Accessible, responsive UI with a consistent brand design

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS 3.4
- Lucide Icons, Recharts

## Project Structure

```
pandalogix-wms-deploy/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── WMSApp.jsx
│   └── components/
│       ├── Nav.jsx
│       ├── Dashboard.jsx
│       ├── ClientsView.jsx
│       ├── GoodsReceivedView.jsx
│       ├── ShipmentsView.jsx
│       ├── InventoryView.jsx
│       └── ReportsView.jsx
├── lib/
│   ├── brand.ts
│   ├── csv.ts
│   └── storage.ts
├── app/globals.css
├── tailwind.config.js
├── postcss.config.js
├── tsconfig.json
├── package.json
└── next.config.js
```

## Getting Started

Prerequisites: Node.js 18+

```bash
npm install
npm run dev        # http://localhost:3000

npm run build
npm run start      # production server
```

## Deployment

Use GitHub import on Vercel or deploy via CLI:

```bash
npm install -g vercel
vercel
```

## Repository

Remote: `https://github.com/LuqmanKt98/pandalogix-wms.git`

## License

MIT
