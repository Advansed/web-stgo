# WEB-STGO working guide

## Environment
- Codex host: current VPS.
- DEV runtime: `ssh WEB-STGO`; remote project: `/opt/web-stgo`.
- DEV URL: `http://89.108.98.207:8080`; Vite service: `web-stgo-dev.service`.
- Before each task: `git -c safe.directory=/opt/web-stgo status --short --branch` on DEV. Preserve existing changes.

WEB-STGO is primarily a Mobile Inspector application; prioritize field/mobile workflows, touch ergonomics, readability, resilience, and fast task completion.

Official visual source of truth: `docs/BRAND_GUIDE.md`. Brand book source: `logo-book-colors.pdf`. Use the STNG official palette and approved logo variants. Do not invent brand accent colours.

## Stack
React 19, TypeScript, Vite 5, Ionic React 8, Capacitor 7, Zustand, React Router 5.

## Critical rules
- Do UI work on `WEB-STGO:/opt/web-stgo`. Preserve backend contracts, real API data and business logic.
- Production requires explicit approval. Never overwrite `/var/www/html` or change production Nginx during DEV work.
- Reuse existing architecture; do not add Next.js, Tailwind or shadcn just for a redesign.
- Use installed frontend design, UI standards, UX, motion, assets and visual QA skills. Use purposeful optimized 3D assets in redesigned screens; inspect real DEV UI in a browser after meaningful work.
- Do not commit or push until explicitly requested. Do not store credentials in this repository.

## Quick architecture map
- App/auth gate: `src/App.tsx`, `src/useApp.ts`.
- Login: `src/components/Login/`.
- Stores: `src/Store/` (auth, invoices, accounts, navigation, acts).
- API: `src/Store/api.ts`, invoice operations in `src/Store/invoiceStore.ts`.
- Navigation/pages: `src/pages/Page.tsx`, `src/pages/Home.tsx` (field work hub and profile/logout menu), `src/components/Invoices/`, `src/components/Lics/`.
- Theme: `src/theme/variables.css`; Login styles: `src/components/Login/Login.css`.

See `docs/PROJECT_MAP.md`, `docs/BACKEND_CONTRACTS.md`, `docs/UI_REDESIGN.md`.

For current redesign progress and remaining screens see: docs/PROJECT_MAP.md#redesign-inventory
