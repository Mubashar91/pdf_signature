# Inklet SEO configuration

The homepage targets **free PDF signature** and **sign PDF online for free**. Two original guides cover the signing process and choosing a drawn or typed signature. They are static HTML, linked from the homepage, and readable without JavaScript.

Search titles, descriptions, canonical URLs, social metadata, and structured data are maintained by `scripts/configure-seo.mjs`. Its only configuration is the production origin in `seo.config.json`.

After changing page metadata in the script, run:

```powershell
node scripts/configure-seo.mjs
```

When moving to a custom domain or Vercel, run the following with the actual production origin before deployment:

```powershell
node scripts/configure-seo.mjs --origin https://your-domain.example
```

This updates every canonical URL, Open Graph and Twitter card URL, JSON-LD reference, `robots.txt`, and `sitemap.xml` together. Deploy the resulting `dist` directory. A Vercel preview hostname should not replace your chosen production origin.

The application doesn't require a build. The included `vercel.json` sets the Other framework preset, skips installation and building, serves `dist`, and uses trailing slashes for guide pages. Keep the Vercel Root Directory at the repository root. To run locally, use `python -m http.server 4173 --directory dist`.

The production SEO origin is `https://freepdfsignature.vercel.app`. Search engines need public, unauthenticated access to crawl the pages. Verify ownership of the production site in Google Search Console and submit `/sitemap.xml`. The separate ChatGPT Sites deployment retains its existing access settings. A sitemap and structured data do not guarantee indexing, rankings, rich results, or AdSense approval.

The JSON-LD describes the site, its pages, and the guides. It contains no invented reviews or ratings. The visible FAQ remains ordinary page content; it is not presented as eligible for Google's restricted FAQ rich results.
