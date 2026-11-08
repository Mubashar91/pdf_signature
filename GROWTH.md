# Goal: 5,000 monthly organic search clicks

Aim for **5,000 clicks from Google Search in a calendar month**, roughly 167 per day in a 30-day month. This is a target, not a traffic forecast. Search clicks, website visits, completed signatures, and advertisement clicks are different measurements. Do not encourage visitors to click ads.

## Establish the baseline

- Use `https://freepdfsignature.vercel.app` as the production origin. Keep `seo.config.json`, canonical URLs, sharing URLs, and the sitemap aligned with that origin. If the production domain changes, run `node scripts/configure-seo.mjs --origin https://your-real-domain` before deploying.
- In Google Search Console, verify the production property, submit `/sitemap.xml`, and inspect the homepage and all three guide URLs. Confirm they are publicly accessible and indexable. A sitemap does not guarantee indexing.
- Record monthly Web search clicks, impressions, CTR, and average position. Review queries, landing pages, countries, and mobile versus desktop. Compare complete periods; a click is not a unique visitor.
- Track successful signed PDF downloads separately if analytics are added. Never send document contents, file names, or signature data to analytics.

## Improve the existing experience

1. Keep the upload workspace easy to reach, especially on mobile. Show the 25 MB limit, supported file type, and browser processing explanation beside the file chooser.
2. Keep the sample document available so a visitor can test the flow without sharing a personal file. Verify upload, signature creation, placement, and downloaded PDF output after changes.
3. Measure loading and interaction performance. Consider loading PDF libraries when the visitor starts signing rather than on every initial page view. Check Core Web Vitals with real user data when available.
4. Review the existing Monetag integration for intrusive pop-ups, redirects, layout shifts, or ads that distract from the signing controls. Keep advertisements distinguishable from upload and download actions.

## Make the three guides more useful

- **`/guides/how-to-sign-a-pdf/`:** keep the instructions synchronized with the actual controls. Add original screenshots or examples where they resolve a real difficulty. Expand mobile download and protected-PDF troubleshooting when visitor questions or Search Console queries reveal a gap.
- **`/guides/draw-or-type-a-signature/`:** show real examples of the available styles and ink colours. Explain resizing and the limits of an image signature accurately. Link directly to the signing workspace.
- **`/guides/ats-friendly-resume-pdf/`:** answer resume PDF questions about selectable text, formatting, file limits, AI editing, and signing when requested. Watch relevant resume PDF queries in Search Console. Keep the guidance sourced and avoid claims that Inklet creates resumes or certifies ATS compatibility.
- Use Search Console queries to identify wording and questions visitors actually use. Improve the most relevant existing page before creating another one. Avoid near-duplicate pages for keyword variations, invented search volumes, or unsupported legal claims.
- Share the working tool with relevant communities and people who handle PDFs. Use useful demonstrations and accurate descriptions; avoid purchased links, automated traffic, or click exchanges.

## Milestones to review

| Target | Evidence to review | Next action |
| --- | --- | --- |
| Public site and four intended pages indexable | URL Inspection, sitemap processing, Page indexing report | Resolve access, canonical, or indexing issues |
| 500 monthly search clicks | Queries and pages producing relevant impressions and clicks | Improve the pages that are beginning to attract users |
| 1,500 monthly search clicks | High-impression queries with weak CTR; mobile usability and signing completion | Clarify relevant titles, descriptions, content, and task flow |
| 5,000 monthly search clicks | Complete monthly Search Console report and successful signing experience | Maintain useful content and investigate changes in performance |

These are checkpoints, not promised dates. No indexing, ranking, traffic, or AdSense approval outcome is guaranteed. At a hypothetical 5% search CTR, 5,000 clicks would require 100,000 impressions; actual CTR depends on the queries and search results.

## Official references

- [Google Search Essentials](https://developers.google.com/search/docs/essentials): helpful content, descriptive wording, crawlable links, and relevant promotion.
- [Creating helpful, reliable, people-first content](https://developers.google.com/search/docs/fundamentals/creating-helpful-content): useful online tools count as main content; avoid producing pages primarily to manipulate rankings.
- [Search Console performance reports](https://support.google.com/webmasters/answer/10268906): clicks, impressions, CTR, queries, and page comparisons.
- [Build and submit a sitemap](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap): sitemap creation and submission guidance.
- [Understanding page experience](https://developers.google.com/search/docs/appearance/page-experience): mobile usability, security, intrusive ads, and overall experience.
- [Core Web Vitals](https://developers.google.com/search/docs/appearance/core-web-vitals): loading, responsiveness, and visual stability.
- [AdSense ad placement policies](https://support.google.com/adsense/answer/1346295?hl=en): distinguish ads from navigation and downloads, and avoid encouraging ad clicks.
