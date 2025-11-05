
GitHub Pages Version — How uploads work
=======================================

GitHub Pages is static hosting, so there’s no server to receive files.
This version integrates with a *form backend* so uploads still work.

Quick setup (Getform)
---------------------
1. Go to https://getform.io/ and create a new form (free tier works).
2. Copy your endpoint URL (looks like `https://getform.io/f/...`).
3. Open `config.js` and set:

   window.ADVENT_CONFIG = {
     upload: { getformEndpoint: "YOUR-ENDPOINT-HERE" }
   };

4. Commit and push the folder `advent_site_github/` to your GitHub Pages repo.
5. On Day 11, the upload form will submit directly to Getform in a new tab.
6. You can view uploaded files in your Getform dashboard and/or email.

Notes
-----
- If you prefer another provider (Basin, Formspree, etc.), replace the endpoint and ensure their docs allow file uploads via plain HTML `<form>`.
- Everything is client-side and works on GitHub Pages.
- Day 10’s math popup and the celebratory trumpet still work.
