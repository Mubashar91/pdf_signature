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

The application doesn't require a build. For Vercel, use the Other framework preset, an empty build command, and `dist` as the output directory. To run locally, use `python -m http.server 4173 --directory dist`.

The current ChatGPT Site is private. These source changes do not change that audience. Search engines need public, unauthenticated access to crawl the pages. After the production site is public, verify ownership in Google Search Console and submit `/sitemap.xml`. A sitemap and structured data do not guarantee indexing, rankings, rich results, or AdSense approval.

The JSON-LD describes the site, its pages, and the guides. It contains no invented reviews or ratings. The visible FAQ remains ordinary page content; it is not presented as eligible for Google's restricted FAQ rich results.
