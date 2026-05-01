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

## Production behavior (Feeds / GitHub Pages)

When Arbeitnow + Remotive return **HTTP 200** but every listing fails the UX or US/geo heuristics, the board used to render **nothing** because fallback samples were only wired for dual-source failures. The client now swaps in curated US-aligned sample postings, keeps fetching on your refresh cadence, and treats common `City, ST` shorthand as positive US grounding. Users see a lightweight toast once per tab session explaining that mismatch case.

## Pull requests

Push a feature branch, then compare it against **`main`** and choose **Compare & pull request** on GitHub (for example: `https://github.com/ChadAustinWhite/myjobboard/compare/main...YOUR-BRANCH?expand=1`).
