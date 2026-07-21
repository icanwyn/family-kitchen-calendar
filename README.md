# Family Kitchen Calendar

A modern **family kitchen hub** for shared calendars, chores, and fitness — with login protection for privacy.

## Features

- **Login gate** — shared family username/password (Auth.js)
- **Today hub** — day-at-a-glance
- **Shared calendar** — month / week / day, per-member colors
- **Chores & tasks** — assign, complete, points
- **Fitness** — workouts + weekly programs
- **Family members** — modern profile avatars, Google/Outlook ICS connect
- **Local persistence** — browser `localStorage` (per device)

## Local development

```bash
cp .env.example .env.local
# set AUTH_SECRET, FAMILY_USERNAME, FAMILY_PASSWORD

npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You’ll be redirected to `/login`.

### Generate AUTH_SECRET

```bash
openssl rand -base64 32
```

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `AUTH_SECRET` | Yes | Session encryption secret |
| `FAMILY_USERNAME` | No (default `family`) | Login username |
| `FAMILY_PASSWORD` | Yes | Login password |
| `AUTH_URL` | Prod recommended | Full site URL e.g. `https://your-app.vercel.app` |

## Deploy (Vercel)

1. Push this repo to GitHub
2. Import the project in [Vercel](https://vercel.com)
3. Set the env vars above
4. Deploy

Or CLI:

```bash
npx vercel
npx vercel env add AUTH_SECRET
npx vercel env add FAMILY_USERNAME
npx vercel env add FAMILY_PASSWORD
npx vercel --prod
```

## Connecting calendars

See [docs/CONNECT_CALENDARS.md](docs/CONNECT_CALENDARS.md) for Google / Outlook ICS setup.

## Tech

- Next.js 16 (App Router) + React 19 + TypeScript
- Tailwind CSS v4
- Auth.js (NextAuth v5) credentials
- Imagine-generated profile avatars in `/public/avatars`
