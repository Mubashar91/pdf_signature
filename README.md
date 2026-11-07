# Inklet — Free PDF Signature

A browser-based PDF signing tool built with static HTML, CSS, and JavaScript. Draw or type a signature, place it on a PDF page, and download the signed document. PDF processing happens on the visitor's device.

## Features

- Draw a signature or type your name in three signature styles.
- Choose forest green, black, or blue ink.
- Navigate multi-page PDFs, move your signature, and adjust its size.
- Open PDFs up to 25 MB and download a signed copy without a watermark.
- Try the built-in two-page sample document.
- Read two original PDF signing guides.

The tool places one signature image in a document at a time. It does not provide certificate-based digital signatures, identity verification, or an audit trail.

## Run locally

From the project directory, run:

```powershell
python -m http.server 4173 --bind 127.0.0.1 --directory dist
```

Open <http://localhost:4173>. There is no dependency installation or build step. An internet connection is needed to load PDF.js, pdf-lib, and the web fonts.

## Deploy

Serve the contents of `dist` as a static website. For Vercel, select **Other** as the framework, leave the build command empty, and set the output directory to **dist**.

Before deploying to a new production domain, update the SEO origin:

```powershell
node scripts/configure-seo.mjs --origin https://your-domain.example
```

Use your actual production origin in that command. It updates the canonical URLs, sitemap, structured data, and social sharing URLs. See [SEO.md](SEO.md) for details.

## Project structure

- `dist/` — Static website, signing application, guides, and assets.
- `scripts/configure-seo.mjs` — SEO metadata and sitemap configuration.
- `seo.config.json` — Current production origin.
- `.openai/hosting.json` — Existing ChatGPT Sites deployment configuration.

Local QA artifacts and temporary checkouts are excluded from Git.
