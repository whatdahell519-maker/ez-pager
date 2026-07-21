# Digital Pager System - Multi-Device & Grandma-Friendly Pager

This project is a real-time digital pager application built with React, Vite, Tailwind CSS, and Web Audio API synthesizers.

---

## ☁️ How to Deploy to Cloudflare Pages (Export ZIP or GitHub)

When you export this repository as a **ZIP file** or push it to **GitHub** from Google AI Studio, it is **100% ready for Cloudflare Pages** with zero complex setup:

### Option A: Cloudflare Pages Git / Repository Connect
1. Upload/Push this ZIP repository to GitHub or GitLab.
2. Go to **Cloudflare Dashboard** -> **Workers & Pages** -> **Create Application** -> **Pages** -> **Connect to Git**.
3. Select this repository.
4. Set the build settings:
   - **Framework preset**: `Vite`
   - **Build command**: `npm run build` (or `npm run build:pages`)
   - **Build output directory**: `dist`
5. Click **Save and Deploy**. Cloudflare Pages will build the app into `dist` and deploy it across Cloudflare's global edge network!

### Option B: Cloudflare Pages Direct Upload (Drag-and-Drop)
1. Run `npm install && npm run build` locally to generate the static `dist/` folder.
2. Drag and drop the `dist/` folder directly into Cloudflare Pages Direct Upload.

---

## 📱 How Real-Time Multi-Device Sync Works on Cloudflare Pages

When hosted on Cloudflare Pages static hosting:
- The app automatically utilizes a **global cloud relay (`ntfy.sh`)** over encrypted WebSocket/SSE connections.
- **Zero backend server or database setup required!**
- Grandma's phone, your phone, or any tablet connected to the URL will immediately pair on your private channel code (e.g. `[DEFAULT]` or custom `[GRANDMA-HOME]`).
- Tapping a button on your phone immediately triggers real-time audio bleeps and visual alerts on Grandma's device.

---

## 🚀 Local Development

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start local server:
   ```bash
   npm run dev
   ```
3. Open [http://localhost:3000](http://localhost:3000)
