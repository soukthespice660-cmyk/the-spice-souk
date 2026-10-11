# The Spice Souk deployment

Repository owner: `soukthespice660-cmyk`. Repository: `the-spice-souk`, private.
Production: https://spicesouk.pages.dev/es/
Cloudflare account: `b82720c86bc0f368984c8a22be0b121c`; existing Pages project: `spicesouk`.

GitHub Actions checks pull requests and deploys pushes to `main` only after lint, order tests, build and SEO assertions pass. The action versions are pinned to verified upstream commit SHAs.

Required repository secret: `CLOUDFLARE_API_TOKEN`. Create it only in the Spice Souk Cloudflare account, with Account / Cloudflare Pages / Edit and resource scope restricted to that account. Store the value in GitHub Settings / Secrets and variables / Actions. Never put a token in a file, commit or chat. Changes to workflow files must receive the same scrutiny as production code because they can use the deployment credential.

The existing project uses Direct Upload. GitHub Actions uploads the checked build with Wrangler, retaining the production hostname. This does not change Search Console processing or guarantee indexing.

Local verification:
```
npm ci --no-audit --no-fund
npm run lint
npm test
npm run build
node tests/seo.mjs
```

Activation is complete only when the GitHub workflow succeeds and the published sitemap returns HTTP 200 with the expected four language URLs. Roll back from the Spice Souk Cloudflare Pages deployment history if needed.

Reference: https://developers.cloudflare.com/pages/how-to/use-direct-upload-with-continuous-integration/
