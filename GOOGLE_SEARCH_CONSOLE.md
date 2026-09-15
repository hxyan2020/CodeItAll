# Get CodeItAll into Google Search

Technical SEO is already live on production (`robots.txt`, `sitemap.xml`, indexable meta, canonicals, JSON-LD). Google still needs **you** to verify the property and submit the sitemap—this cannot be finished without your Google account.

## 1) Confirm nothing is blocking crawlers

Open these (should return 200, no login wall):

- https://codeitall-site.vercel.app/robots.txt  
- https://codeitall-site.vercel.app/sitemap.xml  
- https://codeitall-site.vercel.app/

Check that `robots.txt` includes:

```
Allow: /
Sitemap: https://codeitall-site.vercel.app/sitemap.xml
```

Blocked only: `/admin/`, `/reset/`, `/api/` (and setup docs)—not public learning pages.

## 2) Google Search Console (required)

1. Go to [Google Search Console](https://search.google.com/search-console).
2. Add property → **URL prefix** → `https://codeitall-site.vercel.app`
3. Verify ownership (easiest options):
   - **HTML tag**: paste the `google-site-verification` meta into `deploy/apply_seo.py` (see note below) and redeploy, **or**
   - **DNS** if you later move to `codeitall.com`
4. Left menu → **Sitemaps** → submit:

   ```
   sitemap.xml
   ```

   Full URL Google will fetch:  
   `https://codeitall-site.vercel.app/sitemap.xml`

5. Use **URL Inspection** on the homepage and click **Request indexing** for key URLs:
   - `/`
   - `/course/`
   - `/lab/`
   - `/career/`
   - `/dissect/`

## 3) Optional: verification meta tag

After Search Console shows a meta tag like:

```html
<meta name="google-site-verification" content="YOUR_TOKEN" />
```

Add to `deploy/apply_seo.py` inside `seo_block()` (near other meta tags), re-run:

```bash
python deploy/apply_seo.py
npx vercel --prod --yes
```

## 4) Expectations

- New sites often take **days to weeks** to show ranking for competitive phrases.
- Sitemap submission is a **hint**, not a guarantee every URL is crawled.
- Keep publishing useful pages and linking them from the homepage/course nav.
- Prefer one canonical host (`codeitall-site.vercel.app` today; switch BASE in `apply_seo.py` when `codeitall.com` is HTTPS).

## 5) Bing (optional)

Submit the same sitemap at [Bing Webmaster Tools](https://www.bing.com/webmasters).
