# CalcTutor 2.0 — Real AI setup

This version uses a secure serverless backend so the OpenAI API key is **not** placed in the browser JavaScript.

## Option A — easiest: deploy the whole repository to Vercel

1. Push/upload all project files to GitHub.
2. Import that GitHub repository into Vercel.
3. Add an environment variable named `OPENAI_API_KEY` with your own API key.
4. Optionally set `OPENAI_MODEL` (default: `gpt-5.6-luna`).
5. Deploy.
6. Open the Vercel URL. The frontend and `/api/chat` backend are on the same site, so no frontend URL change is required.

## Option B — keep GitHub Pages for the frontend

Deploy the same repository to Vercel so that `/api/chat` exists. Then add this before `app.js` in `index.html`:

```html
<script>window.CALCTUTOR_API_URL="https://YOUR-VERCEL-PROJECT.vercel.app/api/chat";</script>
<script src="app.js"></script>
```

For production, set `FRONTEND_ORIGIN` on Vercel to your exact GitHub Pages origin.

## Important

- Never put the API key in `app.js`, `index.html`, `style.css`, or GitHub Pages.
- The scanner sends the selected image to the backend for vision analysis.
- API usage can consume credits on the API account that owns the key.
