# Google Sign-In setup (CodeItAll)

CodeItAll supports **email + password** and **Continue with Google**.

Auth API lives on the DigitalOcean droplet (`/api/auth`). Google Sign-In works on that origin (for example `http://188.166.214.47:8099/profile/`). Pure Vercel static hosting cannot complete Google login until `/api/auth` is proxied to the droplet or you put the site on a domain that hits the API.

---

## What we already built

| Piece | Location |
|---|---|
| Backend `POST /auth/google`, `GET /auth/config` | `deploy/auth_api.py` |
| Client helper `loginWithGoogle` | `docs/shared/progress.js` |
| Profile “Continue with Google” button | `docs/profile/` |
| Env var | `GOOGLE_CLIENT_ID` in `/etc/codeitall-assist.env` |

---

## Part A — Testing mode (local / droplet IP)

### 1) Create a Google Cloud project

1. Open [Google Cloud Console](https://console.cloud.google.com/).
2. Create a project (or select one), e.g. `CodeItAll`.
3. Wait until the project is fully created and selected in the top bar.

### 2) Configure the OAuth consent screen (Testing)

1. Go to **APIs & Services → OAuth consent screen**.
2. Choose **External** → **Create**.
3. Fill required fields:
   - App name: `CodeItAll`
   - User support email: your email
   - Developer contact: your email
4. Click **Save and Continue** through Scopes (defaults are fine for Sign-In).
5. On **Test users**, click **Add users** and add the Gmail accounts that may sign in while status is **Testing**.
6. Set Publishing status to **Testing** (default for new apps).
7. Finish.

> In Testing mode, **only** listed test users can complete Google login. Anyone else sees Google’s “app is not verified / access blocked” message.

### 3) Create an OAuth Client ID (Web)

1. Go to **APIs & Services → Credentials → Create credentials → OAuth client ID**.
2. Application type: **Web application**.
3. Name: `CodeItAll Web`.
4. **Authorized JavaScript origins** (exact origins, no path):

   ```
   http://188.166.214.47:8099
   http://localhost:8099
   http://127.0.0.1:8099
   ```

   Add any other origin you use for testing (including `https://codeitall-site.vercel.app` only if that origin can call your auth API).

5. **Authorized redirect URIs** — for GIS popup / button ID tokens you usually do **not** need redirects. Leave empty unless Google requires one; if prompted, you can add:

   ```
   http://188.166.214.47:8099/profile/
   ```

6. Click **Create**. Copy the **Client ID**  
   (`….apps.googleusercontent.com`).  
   You do **not** need the Client Secret for this GIS button flow.

### 4) Put the Client ID on the server

SSH to the droplet and edit the assist env file:

```bash
sudo nano /etc/codeitall-assist.env
```

Add (or update):

```bash
GOOGLE_CLIENT_ID=YOUR_CLIENT_ID.apps.googleusercontent.com
CIA_SITE_URL=http://188.166.214.47:8099
```

Optional but recommended (better token verification):

```bash
sudo /opt/codeitall-assist/venv/bin/pip install 'google-auth>=2.28.0'
```

Restart the API:

```bash
sudo systemctl restart codeitall-assist
# or whatever unit name you use for uvicorn assist_api
```

Confirm config is public:

```bash
curl -s http://127.0.0.1:8100/auth/config
# expect: {"ok":true,"googleClientId":"….apps.googleusercontent.com","googleEnabled":true,...}
```

### 5) Deploy updated frontend + backend files

Copy the updated files to the droplet (same path you normally sync):

- `deploy/auth_api.py` → `/opt/codeitall-assist/auth_api.py` (or your assist root)
- `docs/profile/*`, `docs/shared/progress.js` → `/var/www/codeitall/...`

Restart assist after copying `auth_api.py`.

### 6) Test as a listed test user

1. Open `http://188.166.214.47:8099/profile/` in a private window.
2. You should see **Continue with Google** above the email form.
3. Sign in with a **test user** Gmail.
4. You should land signed in; progress sync uses the same session token as email/password.

**Email + password still works** on the same page (Sign in / Create account).

### Common testing errors

| Symptom | Fix |
|---|---|
| Button missing / “not configured” | `GOOGLE_CLIENT_ID` empty or assist not restarted |
| `origin_mismatch` / `The given origin is not allowed` | Add the exact page origin to **Authorized JavaScript origins** |
| Access blocked for your Google account | Add that account under **Test users** |
| Works on droplet, fails on Vercel | Vercel has no `/api/auth` — use droplet URL or proxy API |

---

## Part B — Production mode

When you are ready for any Google user (not only test users):

### 1) Use a real HTTPS domain (recommended)

Point `codeitall.dev` (or your chosen domain) to the droplet with HTTPS (nginx + Let’s Encrypt).

Example origins to add in Google Cloud:

```
https://codeitall.dev
https://www.codeitall.dev
```

Update server env:

```bash
CIA_SITE_URL=https://codeitall.dev
GOOGLE_CLIENT_ID=YOUR_CLIENT_ID.apps.googleusercontent.com
```

Restart assist.

### 2) Update the OAuth client

1. Google Cloud → **Credentials** → your Web client.
2. Add production **Authorized JavaScript origins** (`https://codeitall.dev`, etc.).
3. Keep testing origins if you still need them, or remove when done.
4. Save.

### 3) Publish the OAuth consent screen

1. **OAuth consent screen** → **Publish app**.
2. Confirm you want to move from **Testing** to **In production**.
3. For Sign-In with only email/profile scopes, Google often allows production without a full verification brand review. If Google later asks for verification, follow their checklist (privacy policy URL, homepage, etc.).

Add a privacy policy page URL on the consent screen when publishing (required for many production apps).

### 4) Production smoke test

1. Open `https://codeitall.dev/profile/` (or your prod URL).
2. Continue with Google using a Gmail that is **not** on the old test-user list.
3. Confirm session persists after refresh.
4. Confirm email/password register + login still work.
5. Confirm an existing email account can be linked: create with password, then Continue with Google using the same email — should link and sign in.

### 5) Optional hardening

- Install `google-auth` on the server (preferred verifier).
- Keep `GOOGLE_CLIENT_ID` only on the server env (it is also returned to the browser by `/auth/config` — that is normal for GIS).
- Never put a Client Secret in frontend code for this flow.

---

## Quick checklist

**Testing**

- [ ] OAuth consent = Testing  
- [ ] Test users added  
- [ ] Web Client ID created  
- [ ] JS origins include droplet URL  
- [ ] `GOOGLE_CLIENT_ID` in `/etc/codeitall-assist.env`  
- [ ] assist restarted  
- [ ] `/profile/` shows Google button and signs in  

**Production**

- [ ] HTTPS domain live  
- [ ] JS origins include `https://your-domain`  
- [ ] `CIA_SITE_URL` updated  
- [ ] Consent screen **Published**  
- [ ] Non-test Gmail can sign in  
- [ ] Email/password still works  

---

## API reference (for debugging)

```http
GET  /api/auth/config
→ { "ok": true, "googleEnabled": true, "googleClientId": "…", "siteUrl": "…" }

POST /api/auth/google
Content-Type: application/json
{ "credential": "<GIS id_token JWT>" }

→ { "ok": true, "token": "<session>", "email": "user@gmail.com", "provider": "google" }
```

Email/password endpoints are unchanged: `/api/auth/register`, `/api/auth/login`.
