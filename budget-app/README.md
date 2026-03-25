# Budget App — Free Deployment Guide

A personal budgeting app with real accounts, persistent storage, CSV import, and auto-categorization.

**Stack:** React + Vite (frontend) · Supabase (auth + database) · Vercel (hosting)
**Cost:** $0 — all services have generous free tiers.

---

## Step 1: Create a Supabase Project (5 min)

1. Go to [supabase.com](https://supabase.com) and sign up (free).
2. Click **New Project**, give it a name like `budget-app`, set a database password.
3. Wait for the project to finish setting up (~30 seconds).

### Create the database tables:

4. In Supabase, go to **SQL Editor** (left sidebar).
5. Click **New Query**.
6. Copy the entire contents of `supabase-setup.sql` from this project and paste it in.
7. Click **Run**. You should see "Success. No rows returned."

### Get your API keys:

8. Go to **Settings** → **API** (left sidebar).
9. Copy the **Project URL** — looks like `https://xxxxx.supabase.co`
10. Copy the **anon public** key — a long string starting with `eyJ...`

### Disable email confirmation (optional but recommended):

11. Go to **Authentication** → **Providers** → **Email**
12. Turn OFF **"Confirm email"** (so users can sign in immediately)
13. Click **Save**

---

## Step 2: Deploy to Vercel (5 min)

### Option A: Deploy via GitHub (recommended)

1. Push this project folder to a new GitHub repo:
   ```bash
   cd budget-app
   git init
   git add .
   git commit -m "Initial commit"
   gh repo create budget-app --public --push
   ```
   (Or create a repo on github.com and push manually)

2. Go to [vercel.com](https://vercel.com) and sign up with GitHub.
3. Click **Add New → Project** and import your `budget-app` repo.
4. In the **Environment Variables** section, add:
   - `VITE_SUPABASE_URL` → your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` → your Supabase anon key
5. Click **Deploy**. Done! You'll get a URL like `budget-app.vercel.app`.

### Option B: Deploy via Vercel CLI

1. Install: `npm i -g vercel`
2. Create a `.env` file (copy from `.env.example`) and fill in your Supabase keys.
3. Run:
   ```bash
   cd budget-app
   npm install
   vercel
   ```
4. Follow prompts. Add environment variables when asked.

---

## Step 3: Use the App

1. Open your Vercel URL.
2. Create an account with email + password.
3. Upload your bank CSV — transactions auto-categorize.
4. Click any transaction to edit it (description, amount, date, category).
5. Click **Categories** to add/edit/delete custom categories.
6. Sign out and back in — your data persists.
7. Access from any device with the same account.

---

## Local Development

```bash
cp .env.example .env
# Fill in your Supabase URL and anon key

npm install
npm run dev
```

Opens at `http://localhost:5173`

---

## CSV Format Support

The app auto-detects most bank CSV formats:

- **With headers:** Date, Description, Amount (or Debit/Credit columns)
- **Without headers:** Auto-detects date, description, and numeric columns
- **Debit/Credit split:** Handles separate debit and credit columns (like your bank's format)
- Duplicate transactions are automatically skipped on re-import

---

## Project Structure

```
budget-app/
├── index.html
├── package.json
├── vite.config.js
├── supabase-setup.sql    ← Run this in Supabase SQL Editor
├── .env.example          ← Copy to .env, fill in keys
└── src/
    ├── main.jsx
    ├── index.css
    ├── supabase.js       ← Supabase client config
    └── App.jsx           ← Full application
```
