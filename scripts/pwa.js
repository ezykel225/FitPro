// Post-processes the web export so FitPro installs like an app from Safari
// ("Share -> Add to Home Screen") and survives page refreshes on GitHub Pages.
// BASE_URL matches app.config.js: "/FitPro" on GitHub Pages, empty on Vercel.
const fs = require("fs");
const path = require("path");

const dist = path.join(__dirname, "..", "dist");
const indexPath = path.join(dist, "index.html");
const base = process.env.BASE_URL || "";

// Web app manifest, written here so its paths follow the base path.
const manifest = {
  name: "FitPro: The Lazy Fitness Assistant",
  short_name: "FitPro",
  start_url: `${base}/`,
  scope: `${base}/`,
  display: "standalone",
  orientation: "portrait",
  background_color: "#0B0F19",
  theme_color: "#0B0F19",
  icons: [{ src: `${base}/icon-1024.png`, sizes: "1024x1024", type: "image/png", purpose: "any" }],
};
fs.writeFileSync(path.join(dist, "manifest.json"), JSON.stringify(manifest, null, 2));

const tags = [
  `<link rel="manifest" href="${base}/manifest.json">`,
  `<link rel="apple-touch-icon" href="${base}/apple-touch-icon.png">`,
  `<meta name="apple-mobile-web-app-capable" content="yes">`,
  `<meta name="mobile-web-app-capable" content="yes">`,
  `<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">`,
  `<meta name="apple-mobile-web-app-title" content="FitPro">`,
].join("\n    ");

// Static copy of components/SplashIntro.tsx, shown instantly while the JS
// bundle downloads. React replaces #root's contents on first render, and the
// SplashIntro component picks up from the same look. Keep the two in sync.
const splash = `
    <div id="static-splash">
      <style>
        html, body { background: #0B0F19; }
        #static-splash { position: fixed; inset: 0; display: flex; flex-direction: column; align-items: center;
          justify-content: center; background: #0B0F19; padding: 24px;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
        #static-splash .logo { width: 104px; height: 104px; border-radius: 30px; display: flex; align-items: center;
          justify-content: center; background: linear-gradient(135deg, #3B82F6, #22D3EE);
          box-shadow: 0 10px 30px rgba(59,130,246,0.55); animation: fp-pulse 1.2s ease-in-out infinite; }
        #static-splash .name { color: #F9FAFB; font-size: 44px; font-weight: 900; margin-top: 28px; letter-spacing: -1px; }
        #static-splash .tagline { color: #9CA3AF; font-size: 12px; font-weight: 700; letter-spacing: 3px; margin-top: 6px; }
        #static-splash .footer { position: absolute; bottom: 90px; display: flex; flex-direction: column; align-items: center; }
        #static-splash .track { position: relative; width: 180px; height: 4px; border-radius: 2px; background: #1F2937; overflow: hidden; }
        /* Moving shimmer so a slow download doesn't look frozen */
        #static-splash .track::after { content: ""; position: absolute; top: 0; bottom: 0; width: 40%; border-radius: 2px;
          background: linear-gradient(90deg, transparent, #3B82F6, #22D3EE, transparent); animation: fp-slide 1.1s ease-in-out infinite; }
        @keyframes fp-slide { from { left: -40%; } to { left: 100%; } }
        #static-splash .line { color: #9CA3AF; font-size: 13px; margin-top: 14px; }
        @keyframes fp-pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.06); } }
      </style>
      <div class="logo">
        <svg width="52" height="52" viewBox="0 0 64 64" fill="#fff" aria-hidden="true">
          <rect x="18" y="29" width="28" height="6" rx="3"/><rect x="12" y="18" width="8" height="28" rx="3"/>
          <rect x="44" y="18" width="8" height="28" rx="3"/><rect x="5" y="23" width="7" height="18" rx="3"/>
          <rect x="52" y="23" width="7" height="18" rx="3"/>
        </svg>
      </div>
      <div class="name">FitPro</div>
      <div class="tagline">THE LAZY FITNESS ASSISTANT</div>
      <div class="footer"><div class="track"></div><div class="line">Warming up…</div></div>
    </div>
  `;

let html = fs.readFileSync(indexPath, "utf8");
if (!html.includes('<div id="root"></div>')) throw new Error("pwa.js: couldn't find the #root element to add the splash to");
html = html.replace('<div id="root"></div>', `<div id="root">${splash}</div>`);
html = html
  .replace(/<meta name="viewport"[^>]*>/, '<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover">')
  .replace("</head>", `    ${tags}\n  </head>`);
fs.writeFileSync(indexPath, html);

// GitHub Pages serves 404.html for unknown paths, so deep links like /FitPro/workout still load the app.
fs.copyFileSync(indexPath, path.join(dist, "404.html"));
// Stop GitHub Pages' Jekyll from hiding the _expo folder.
fs.writeFileSync(path.join(dist, ".nojekyll"), "");

console.log("PWA tags injected, 404.html and .nojekyll written.");
