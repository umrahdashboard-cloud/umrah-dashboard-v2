# Umrah Dashboard v2

Hajj & Umrah CRM — package calculator, bookings, invoices, accounts, hotel vouchers, and master settings.

## Local development

```bash
npm install
cp .env.example .env.local
# Fill in Supabase keys and SESSION_SECRET in .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Demo login: `admin` / `admin123`.

## Deploy to Netlify

1. Push this repo to GitHub.
2. In [Netlify](https://app.netlify.com), **Add new site → Import from Git** and select the repository.
3. Netlify reads `netlify.toml` automatically (`@netlify/plugin-nextjs` handles the Next.js App Router runtime).
4. Under **Site configuration → Environment variables**, add the values from `.env.example`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `SESSION_SECRET` (long random string)
   - `NEXT_PUBLIC_BASE_URL` (your Netlify URL, e.g. `https://your-site.netlify.app`)
5. Deploy.

## Scripts

| Command        | Description          |
|----------------|----------------------|
| `npm run dev`  | Start dev server     |
| `npm run build`| Production build     |
| `npm run start`| Start production     |
| `npm run lint` | Run ESLint           |
