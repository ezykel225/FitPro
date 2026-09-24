// Post-processes the web export so FitPro installs like an app from Safari
// ("Share -> Add to Home Screen") and survives page refreshes on GitHub Pages.
const fs = require("fs");
const path = require("path");

const dist = path.join(__dirname, "..", "dist");
const indexPath = path.join(dist, "index.html");
const base = "/FitPro";

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
