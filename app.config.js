// app.config.js
// Extends app.json with the web base path, which depends on where the web
// build is hosted:
//   GitHub Pages serves it from /FitPro  -> BASE_URL=/FitPro (set in the deploy workflow)
//   Vercel serves it from the domain root -> BASE_URL unset
module.exports = ({ config }) => ({
  ...config,
  experiments: {
    ...config.experiments,
    baseUrl: process.env.BASE_URL || "",
  },
});
