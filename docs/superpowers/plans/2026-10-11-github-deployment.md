# Spice Souk GitHub Deployment Plan
> Execute inline with superpowers:executing-plans.
Goal: keep the private source in soukthespice660-cmyk/the-spice-souk and deploy to the existing spicesouk Cloudflare Pages project.
Architecture: checks on pull requests; deployment only from main, after build, lint, order tests and SEO checks. Credentials stay in GitHub Actions secrets.
Stack: static Node.js catalogue, GitHub Actions, Cloudflare Wrangler action. Spec: owner's approval in this chat; preserve spicesouk.pages.dev and use only Spice Souk accounts.
- [ ] Create private repository and isolated local Git history; exclude artifacts, credentials, runtime caches and unrelated media tooling.
- [ ] Add pinned workflow and deployment instructions; validate locally and inspect tracked files.
- [ ] Push source using the Spice Souk GitHub identity; obtain explicit approval for persistent Cloudflare deployment credentials.
- [ ] Configure credential, run workflow and verify successful production deployment and public sitemap.
