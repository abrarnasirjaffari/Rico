# RICO Website & Documentation

The public-facing marketing, landing page, documentation, pricing, roadmap, workflows, and legal pages for **RICO** (Autonomous Financial & Agentic Commerce Agent).

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS
- **Visuals & Animation:** Three.js (interactive smoke dissolve canvas), Framer Motion
- **Icons:** Lucide React

## Getting Started

From the repository root:

```bash
cd website
npm install
npm run dev
```

The website will start at [http://localhost:3000](http://localhost:3000) (or the next available port if the core app is running on 3000).

## Available Scripts

- `npm run dev` — Start the Next.js development server
- `npm run build` — Build the production bundle and generate static pages
- `npm run start` — Run the production build
- `npm run lint` — Run ESLint across website files

## Deployment

Deploy this directory (`website/`) as an independent project on Vercel, Cloudflare Pages, or Render:
- **Root Directory:** `website`
- **Build Command:** `npm run build`
- **Output Directory:** `.next`
