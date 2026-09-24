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
  background_color: "#0F172A",
  theme_color: "#0F172A",
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

let html = fs.readFileSync(indexPath, "utf8");
html = html
  .replace(/<meta name="viewport"[^>]*>/, '<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover">')
  .replace("</head>", `    ${tags}\n  </head>`);
fs.writeFileSync(indexPath, html);

// GitHub Pages serves 404.html for unknown paths, so deep links like /FitPro/workout still load the app.
fs.copyFileSync(indexPath, path.join(dist, "404.html"));
// Stop GitHub Pages' Jekyll from hiding the _expo folder.
fs.writeFileSync(path.join(dist, ".nojekyll"), "");

console.log("PWA tags injected, 404.html and .nojekyll written.");
