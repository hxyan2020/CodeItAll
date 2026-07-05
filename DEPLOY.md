# Deploy CodeItAll to the web

## Option A — Live now (temporary tunnel)

A public tunnel is running. Open:

- **Home:** https://common-cloths-speak.loca.lt/
- **Notebook:** https://common-cloths-speak.loca.lt/notebook.html

> Localtunnel may ask you to click through a warning on first visit.
> This URL stops working when the background server is closed.

## Option B — Vercel (permanent, free)

1. Visit https://vercel.com/oauth/device and enter the code shown in terminal
2. Run: `npx vercel docs --yes --prod`
3. You will get a permanent `*.vercel.app` URL

## Option C — GitHub Pages (permanent, free)

1. Create a repo on GitHub named `CodeItAll`
2. Push this project:
   ```powershell
   git remote add origin https://github.com/YOUR_USERNAME/CodeItAll.git
   git branch -M main
   git push -u origin main
   ```
3. In repo **Settings → Pages**, set source to **GitHub Actions**
4. Site will be at `https://YOUR_USERNAME.github.io/CodeItAll/`
