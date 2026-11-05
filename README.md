# Drug Development Simulator

Take fictional programs from discovery to NDA/BLA review.

**Live demo:** https://drug-development-simulator.randomthingsonlineatsk.workers.dev

> This is a fictional, educational demonstration. Do not use it for real patient data, clinical decisions or regulatory submissions.

## Features
- 14 fictional programs, including pediatric, ADC, RNA/siRNA, radiopharmaceutical and biosimilar archetypes
- Discovery, preclinical/IND-enabling, CMC, clinical and regulatory review stages
- Regulatory divergence across 21 authorities, Phase IV module, portfolio mode and post-mortem analysis
- Save/resume, difficulty modes and a CTD-style Word export

## Tech stack
TanStack Start, React, Tailwind CSS. Static site hosted on Cloudflare Workers. The leaderboard and cross-device sync codes use the browser's storage by default, or Convex when configured.

## Run locally
```bash
npm install --legacy-peer-deps
npm run dev
```

## Deploy on Cloudflare Workers
- Build variable: `NITRO_PRESET=node-server`
- Build command: `npm install --legacy-peer-deps && npm run build`
- Deploy command: `npx wrangler deploy --assets .output/public --name drug-development-simulator --compatibility-date 2026-01-01`

## Backend (optional, Convex)
Without a backend the leaderboard and sync codes only work inside one browser. For a shared leaderboard and real cross-device sync:
1. Create a free project at convex.dev.
2. Run `npx convex dev` once, then `npx convex deploy` for production.
3. Set `VITE_CONVEX_URL` (your `https://....convex.cloud` URL) as a build variable on Cloudflare and redeploy.

## Attribution
Created by **Khan Gulrez Shagufa Fazal Ahmed**.

If you reuse or adapt this project, please credit the original author and link back to https://github.com/randomthingsonlineatsk-cloud/drug-development-simulator. The Apache License 2.0 requires you to keep the `LICENSE` and `NOTICE` files with any copy you distribute.

## License
Licensed under the [Apache License 2.0](LICENSE). Copyright 2026 Khan Gulrez Shagufa Fazal Ahmed.
