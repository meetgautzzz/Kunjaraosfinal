# Kunjara OS™ — Launch Guide
**Time to live: ~15 minutes**

---

## Step 1 — Push to GitHub

```bash
# In your terminal, create a new folder and init git
mkdir kunjaraos-website && cd kunjaraos-website

# Copy all files from this deploy folder into it, then:
git init
git add .
git commit -m "feat: Kunjara OS website v1 launch"

# Create a new repo on github.com called 'kunjaraos-website'
# Then connect and push:
git remote add origin https://github.com/YOUR_USERNAME/kunjaraos-website.git
git branch -M main
git push -u origin main
```

---

## Step 2 — Deploy on Vercel

1. Go to **vercel.com** → **Add New Project**
2. Click **Import Git Repository** → select `kunjaraos-website`
3. Framework Preset: **Other**
4. Root Directory: `.` (leave as is)
5. Build Command: **leave blank**
6. Output Directory: **leave blank**
7. Click **Deploy** → done in ~30 seconds

---

## Step 3 — Connect Your Domain (kunjaraos.com)

In Vercel:
1. Go to your project → **Settings** → **Domains**
2. Add `kunjaraos.com` and `www.kunjaraos.com`
3. Vercel will show you DNS records to add

In your domain registrar (Namecheap/Cheapname):
```
Type    Name    Value
A       @       76.76.21.21
CNAME   www     cname.vercel-dns.com
```
4. Wait 5–60 minutes for DNS to propagate
5. Vercel auto-provisions SSL (HTTPS) — free

---

## Step 4 — Set Up Supabase

1. Go to **supabase.com** → your project
2. Copy your **Project URL** and **anon public key**
3. Open `login.html`, `signup.html`, `waitlist.html`
4. Replace these two lines in each file:
   ```js
   const SUPABASE_URL = 'https://YOUR_PROJECT_REF.supabase.co';
   const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY_HERE';
   ```
5. In Supabase → **Authentication** → **URL Configuration**:
   - Site URL: `https://kunjaraos.com`
   - Redirect URLs: add `https://app.kunjaraos.com/dashboard`

### Enable Google OAuth
1. Supabase → **Auth** → **Providers** → **Google**
2. Enable it, add your Google OAuth credentials
3. (Get from console.cloud.google.com → create OAuth client)

### Create Waitlist Table
Run this in Supabase → **SQL Editor**:
```sql
create table waitlist (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  email text not null,
  company text,
  plan text,
  monthly_events text,
  created_at timestamptz default now()
);

-- Enable Row Level Security
alter table waitlist enable row level security;

-- Allow inserts from anon users (waitlist signups)
create policy "Allow waitlist inserts" on waitlist
  for insert with check (true);

-- Only you can read (use service role key in your admin panel)
create policy "Only admin can read waitlist" on waitlist
  for select using (false);
```

---

## Step 5 — Add Environment Variables (optional but recommended)

In Vercel → Project → **Settings** → **Environment Variables**:
```
SUPABASE_URL        = https://your-project.supabase.co
SUPABASE_ANON_KEY   = your-anon-key
```

---

## Step 6 — Add Demo Video (when ready)

In `index.html`, find the `video-wrap` section and replace the placeholder div with:
```html
<video
  src="https://your-cdn.com/kunjaraos-demo.mp4"
  poster="https://your-cdn.com/video-thumbnail.jpg"
  controls
  preload="metadata"
  style="width:100%;height:100%;object-fit:cover;border-radius:20px;">
</video>
```

**Or** embed a YouTube video:
```html
<iframe
  src="https://www.youtube.com/embed/YOUR_VIDEO_ID?autoplay=0&rel=0"
  style="width:100%;height:100%;border:none;border-radius:20px;"
  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope"
  allowfullscreen>
</iframe>
```

---

## File Structure

```
kunjaraos-website/
├── index.html        ← Main marketing website
├── login.html        ← Login page (Supabase auth)
├── signup.html       ← Signup page (Supabase auth)
├── waitlist.html     ← Expert/Enterprise waitlist
├── vercel.json       ← Routing, headers, redirects
└── README.md         ← This file
```

---

## Revenue Goal Tracker — ₹35,990 by Month End

| Plan         | Price       | Needed |
|-------------|-------------|--------|
| Basic        | ₹1,999/mo  | 18 subscribers |
| Professional | ₹3,999/mo  | 9 subscribers  |
| Expert       | ₹11,999/mo | 3 subscribers  |
| Enterprise   | ₹24,999/mo | 2 subscribers  |

**Fastest path:** 2 Pro + 1 Expert = ₹19,997/mo. Secure 5 Pro = ₹19,995.

---

## Next Session — Supabase Backend

- User dashboard schema (events, proposals, budgets)
- Row Level Security policies (DPDP Act 2023 compliance)
- Razorpay subscription integration
- AI Proposal Builder API endpoint

---

*Built by Kunjara OS™ · Indigo EP · Mumbai · Made in Bharat 🇮🇳*
