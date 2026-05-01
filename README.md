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

## Optional: Indeed (Publisher search via Worker)

Indeed does **not** accept browser calls with your Publisher ID. This repo ships a **Cloudflare Worker** under **`workers/indeed-proxy/`** that keeps the ID secret, enables CORS for your GitHub Pages origin, and forwards `apisearch`.

1. In `workers/indeed-proxy/wrangler.toml`, extend **`ALLOW_ORIGINS`** with every origin where you browse the SPA (preview ports, localhost, Pages URL).
2. `cd workers/indeed-proxy && npm install`
3. `npx wrangler secret put INDEED_PUBLISHER_ID` → paste Publisher number from Indeed.
4. `npx wrangler deploy` → note the **`*.workers.dev`** URL.
5. Add a GitHub **Actions secret** **`VITE_INDEED_PROXY_URL`** with that Worker URL (`https://…`) so Pages builds bake it into the bundle, **or** set it when running `npm run build` locally.

If Indeed stops issuing new Publisher programmatic access or returns `{ "error": "…" }` on `apisearch`, the board still runs on Arbeitnow + Remotive + Remote OK—you’ll simply see zero rows from Indeed until partner credentials arrive.

**LinkedIn:** there is still no sanctioned public job-search JSON API comparable to Arbeitnow—aggregating LinkedIn postings needs an approved LinkedIn Talent / Jobs partner path, which is outside this static-site setup.

## Pull requests

Push a feature branch, then compare it against **`main`** and choose **Compare & pull request** on GitHub (for example: `https://github.com/ChadAustinWhite/myjobboard/compare/main...YOUR-BRANCH?expand=1`).
