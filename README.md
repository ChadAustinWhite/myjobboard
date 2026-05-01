# myjobboard

UX job feed (Twitter-style UI) with live Arbeitnow + Remotive listings, résumé match scores, and assisted apply flows.

## GitHub Pages (public site)

**Target URL:** https://chadaustinwhite.github.io/myjobboard/

The repo already builds and publishes the production bundle to the **`gh-pages`** branch on every push to **`main`** (workflow: **Deploy to GitHub Pages**).

### Turn the site on (one-time)

1. Open **Settings → Pages:**  
   https://github.com/ChadAustinWhite/myjobboard/settings/pages  
2. Under **Build and deployment → Source**, choose **Deploy from a branch**.  
3. Set **Branch** to **`gh-pages`** and folder **`/ (root)`**, then **Save**.  
4. Wait a minute, then open the **Target URL** above (hard refresh if needed).

If **Actions** shows a red workflow run, open the log for **Deploy to GitHub Pages** and fix the reported error, then re-run the workflow from the Actions tab.

## Local development

```bash
npm install
npm run dev
```

Build the same artifact Pages uses (base path `/myjobboard/`):

```bash
npm run build:pages
npm run preview -- --base /myjobboard/
```

Then open http://localhost:4173/myjobboard/
