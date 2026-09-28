# WEB-STGO project map

## Product and primary user

WEB-STGO is primarily a **Mobile Inspector** application for field staff. Smartphone, Android/Capacitor, one-hand use, daylight, poor connectivity, touch accuracy, keyboard resize and fast task completion are first-order design constraints. The main working objects visible in code are invoices/assignments, account records, addresses, workers and acts.

## Entry points and routing

`index.html` mounts `src/main.tsx` → `src/App.tsx`. App imports Ionic CSS and `src/theme/variables.css`, wraps content in `IonApp` and `ToastProvider`, and uses `useApp.ts` to choose Login or the authenticated `IonReactRouter`. `vite.config.ts` configures React/legacy plugins and a DEV `/mi` proxy; `capacitor.config.ts` retains the mobile shell. No backend code lives here.

Only authenticated routes exist: `/` redirects to `/home`; `/:name` renders `src/pages/Page.tsx`. Page maps `/home` to `Home`, `/lics` to `Lics`, `/invoices` to `Invoices`. `/settings` and unknown names redirect to `/home`; there is no implemented Settings page. Login is an auth gate, not a route. No `/forgot-password` or `/register` page exists.

## Authentication flow

`App.tsx` waits for Zustand persist hydration → `useApp.ts` reads `loginStore.auth` → unauthenticated `Login.tsx` → `useLogin.ts` manages username/password/remember/loading and calls `api.ts:login` → `POST /mi/login` → `loginStore.ts` stores user, token and auth in Zustand (persisted) → App renders router. After auth, `useApp` loads invoices and workers. Invalid-token responses in API utilities call `loginStore.logout()`. The Home header profile menu uses the same existing logout action; it also links to the real invoices and accounts routes. Persist merging derives `auth` from the saved token so startup restoration updates Zustand subscribers.

## Pages

| Page | Route | File | Purpose | Backend dependencies |
|---|---|---|---|---|
| Login | auth gate | `src/components/Login/Login.tsx` | Account sign-in | `login` |
| Home | `/home` | `src/pages/Home.tsx` | Mobile Inspector work hub: priority actions, real summary, active queue, recent invoices, navigation | Invoice Zustand data loaded by `useApp`; workers load globally but are not used on Home |
| Accounts | `/lics` | `src/components/Lics/Lics.tsx` | Account list, search, detail | `get_lics`, `get_lic`, `add_lic`, `del_lic`, address directory |
| Invoices and map | `/invoices` | `src/components/Invoices/index.tsx` | Invoice list, filters, map, workers, editor | `invoices`, `set_invoice`, workers, works/work types, account lookup |
| Settings redirect | `/settings` | `src/pages/Page.tsx` | Redirects to Home; no settings UI/backend contract was found | none |

## Components

| Component | File | Purpose | State | API dependency |
|---|---|---|---|---|
| Page shell | `src/pages/Page.tsx` | Ionic page switch; Home owns its branded header | route, user, token, add-account flag | invoice refresh through store |
| Home work hub | `src/pages/Home.tsx` | Priority actions, metric cards, due queue, recent invoices, account/invoice links, profile menu/logout | invoice store + authenticated user | existing invoices call via useApp |
| Login | `src/components/Login/Login.tsx`, `useLogin.ts` | Sign-in form and behavior | local form, Zustand auth/loading | `login` |
| Toast | `src/components/Toast/` | App-wide responsive feedback provider and hook; error alerts have accessible roles | React context | none |
| Account workspace | `src/components/Lics/Lics.tsx` | List/detail and add flow | lics/navigation stores | account methods |
| Account list/item | `src/components/Lics/components/List/` | Browsing accounts | props | indirect |
| Account search | `src/components/Lics/components/FindLic/` | Search by code/address, directory selection | `useFindLics` local state, token | `get_lic`, directory methods |
| Account detail | `src/components/Lics/components/LicsForm/` | Account, debts and related information | props | indirect |
| Address form | `src/components/Lics/components/FindAddress/` | Address suggestions | local state | react-dadata external service |
| Invoices | `src/components/Invoices/index.tsx`, `useHook.ts` | List/map/workers and modal orchestration | local filters/modals, invoice store | invoice methods |
| Invoice list/item/worker | `src/components/Invoices/components/InvoiceList/` | Invoice and worker rows | props | indirect |
| Invoice editor | `src/components/Invoices/components/CreateInvoiceModal.tsx` | Create/update invoice | local form, stores | `set_invoice`, work dictionaries, account lookup |
| Invoice view | `src/components/Invoices/components/InvoiceView.tsx` | Invoice detail | local state, stores | account lookup, invoice update |
| Worker picker/execution | `src/components/Invoices/components/WorkerPicker.tsx`, `InvExecute.tsx` | Select worker, change execution | local state, navigation/invoice stores | invoice update |
| Map | `src/components/Maps/Maps.tsx` | Yandex map of filtered invoices | map refs and parent-supplied visible list | Yandex Maps/geocoding external service |
| Completed act | `src/components/Acts/ActCompleted/` | Act form, print and `useCompleted` logic | acts store, local errors | `COMPLETED_GET`, `COMPLETED_CREATE` |
| Act form primitives | `src/components/Acts/Forms/` | Reused form rows/fields/print rows | props/local | none |

`src/components/Invoices/types.ts`, `src/Store/types.ts` and `src/types/User.ts` hold models; `src/utils/format.ts` holds display formatters. Component/page `.css` and `.module.css` files contain presentation; hooks and stores own most behavior. Some large components mix API orchestration and markup.

## Zustand stores

| Store | State | Actions and API | Main consumers |
|---|---|---|---|
| `loginStore.ts` | `auth`, `user`, `token`, `isLoading` (persisted except loading) | setters, logout; `useLogin` calls `login` API | App/useApp, Login, Page, authenticated views |
| `invoiceStore.ts` | normalized invoices, loading, loaded, error | load/refresh `invoices`, update item, assign worker/save `set_invoice` | Home, Page, Invoices, Map, invoice editor/view |
| `licsStore.ts` | accounts, selected item, loading | load/get/add/delete via account API | Lics, account search/editor, invoice editor |
| `navigationStore.ts` | local route history, item, add flag, update flag, worker list | setters/back; workers populated by `useApp` | Page, Lics, Invoices, worker picker |
| `actStore.ts` | completed/inspection/seal act drafts, loading, saving | set field/data/reset; API called by `useCompleted` | completed act form/hook |

## Styling and assets

- `logo-book-colors.pdf` is the official brand source. `docs/BRAND_GUIDE.md` records its practical rules: canonical STNG `#182E78`, `#0B7CB5`, `#90DBD9`; no invented yellow/amber brand accent. A warning colour is reserved for a real functional state.
- `src/theme/variables.css` defines global `--stng-*` brand and semantic digital tokens, Ionic primary/secondary brand colour and existing legacy utilities. Login and Home use these tokens; other screens may still need later migration.
- `src/components/Login/Login.css` provides a mobile-first sign-in composition with a full-colour official logo on a light header, deep blue product panel and light form panel. The form still uses `useLogin` and existing `/mi/login`.
- `src/pages/Home.module.css` and `Home.tsx` provide the work hub: official logo on white topbar, deep blue hero, light data cards, real loading/error/empty states, and QHD-specific sizing. `Page.css` hosts the surrounding Ionic shell.
- Official supplied brand assets: `public/assets/brand/stng-wordmark.png` (horizontal colour lockup) and `stng-emblem.png` (standalone emblem); older panel/glow derivatives remain in the asset folder but Login/Home use the original lockup. Do not generate or reassemble logos.
- The new transparent STNG 3D family is `public/assets/auth/inspector-infrastructure.webp` and `public/assets/home/home-hero-gas-meter.webp`, `home-kpi-overdue.webp`, `home-kpi-open.webp`, `home-kpi-completed.webp`, `home-action-accounts.webp`. These are illustrative only; counts and labels remain HTML. No yellow/amber/gold, AI grid or HUD.
- `public/favicon.png` and `public/manifest.json` remain legacy shell assets. `ionicons` supplies action icons.
- `src/mi-data.sql` is a data sample, not app code. `src/App.test.tsx`, `src/setupTests.ts` and `cypress/` are test infrastructure.

## Important dependencies

React 19, TypeScript, Vite 5, Ionic React 8, React Router 5, Zustand 5 and Capacitor 7 form the app. `ionicons` is the icon system. `react-dadata` powers address suggestions; Yandex Maps is loaded as an external browser script.

## Home summary semantics

`Home.tsx` derives three summary cards from `invoiceStore.data`: overdue means open status and `plan_date` before the device local day; open means one of `Новый`, `Назначен`, `В работе`, `Отложен`; completed today means a completed status and `complete_date` on the local day. An overdue card opens the earliest overdue invoice in the existing invoice modal; the open card navigates to `/invoices`. The account action navigates to `/lics` and shows no invented count. All summary values distinguish loading from error; the queue and recent list use the same real invoice data. There is no separate Home metrics API. The `MetricCard` primitive lives in `Home.tsx` with variant styles in `Home.module.css`; it is local to Home until another screen actually needs it.

## Observed technical debt

- `useLogin.ts` stores plaintext remembered password and `api.ts` logs request/response bodies (including possible credentials/tokens); see backend contracts security notes.
- Login had links to unimplemented `/forgot-password` and `/register` and placeholder support details.
- The old Home had static activity items, dead notification/profile buttons, QR/shift/emergency controls, a Settings link that rendered Home, and incorrect KPI labels. The second Home pass removed the employee KPI because `/mi/workers` has no presence signal and headcount is not an inspector priority. It replaced the ambiguous “В работе” KPI with open requests, added an overdue subset and kept completed-today based on the real completion date. Direct Settings/unknown URLs redirect to Home.
- Legacy `Page.tsx` still imports `logOutOutline` without using it; Home now exposes the existing Zustand logout action through its profile menu.
- `variables.css` has duplicated/global safe-area and light-mode rules, hardcoded values and a reference to an absent `26785882.png` background.
- `public/manifest.json` still contains generic Ionic names and refers to icon paths absent from `public/`.
- Store/API and user types are often `any`; large invoice editor mixes presentation and logic.

## Redesign inventory

Inventory from the DEV audit (2026-09-28), updated as redesign tasks pass QA. Count a route, large modal, substantive tab, or map as one user-facing screen/workflow. Count the shared equipment/works tab once across new and existing invoices. Do not count toasts, confirmations, small pickers, decorative panels, or unreachable components. "Connected" means a code path to an API function. Main backend availability was not tested; the external Yandex map was browser-tested.

**Counts:** 11 reachable user-facing workflows; 11 done, 0 remaining in the approved redesign inventory. Six orphan UI components are tracked separately as dead/possibly unused; they are not extra reachable screens. Acts remain a separate potential capability pending entry-point and API validation.

### Route resolution

- Unauthenticated: `App.tsx` renders `Login` for any URL; the login screen is experienced at `/` but is an auth gate, not a `Route`.
- Authenticated: `/` redirects to `/home`; `/:name` enters `Page.tsx`, which accepts only `home`, `lics`, `invoices`. Unknown names (including `/settings`) redirect to `/home`.
- `history.push('/invoices', { openInvoiceId })` from Home opens the invoice editor after the invoice list loads; `Invoices/index.tsx` then clears location state with `history.replace`.
- `navigationStore.currentRoute/history` and `useRoutes` are not used by the rendered router. The active navigation is React Router plus local modal/tab state.
- The old project-map wording that lists InvoiceView, InvExecute, WorkerPicker and completed acts as normal components describes files, not reachable routes.

| # | Route / screen | Component | Purpose | Current UI | Backend | Redesign status | Priority | Size |
|---|---|---|---|---|---|---|---|---|
| 1 | `/` unauthenticated — Login | `Login.tsx` | Sign in | NEW BRAND DESIGN | REAL / CONNECTED | DONE | — | — |
| 2 | `/home` — Home | `Home.tsx` | Work queue and navigation | NEW BRAND DESIGN | REAL / CONNECTED | DONE | — | — |
| 3 | `/invoices` — request list and search | `Invoices/index.tsx`, `InvoiceItem.tsx` | Find/select requests | NEW BRAND DESIGN | REAL / CONNECTED | DONE | — | — |
| 4 | `/invoices` — map pane | `Maps.tsx` | Locate requests | NEW BRAND DESIGN | REAL / CONNECTED | DONE | — | — |
| 5 | `/invoices` → new request modal, “Лицевая” | `CreateInvoiceModal.tsx` | Create request, choose account/status/assignee | NEW BRAND DESIGN | REAL / CONNECTED | DONE | — | — |
| 6 | `/invoices` → selected request modal, “Лицевая” | `CreateInvoiceModal.tsx` | Inspect/edit request | NEW BRAND DESIGN | REAL / CONNECTED | DONE | — | — |
| 7 | Request modal → “Табличная” | `CreateInvoiceModal.tsx` | Equipment, work selection and prices | NEW BRAND DESIGN | REAL / CONNECTED | DONE | — | — |
| 8 | `/lics` — attached account list | `Lics.tsx`, `LicsList.tsx` | Browse/remove linked accounts | NEW BRAND DESIGN | REAL / CONNECTED | DONE | — | — |
| 9 | `/lics` → search modal, “По коду” | `FindLics.tsx` | Find account by code, add/select | NEW BRAND DESIGN | REAL / CONNECTED | DONE | — | — |
| 10 | `/lics` → search modal, “По адресу” | `FindLics.tsx`, `useFindLics.ts` | Find account through address hierarchy | NEW BRAND DESIGN | REAL / CONNECTED | DONE | — | — |
| 11 | `/lics` → account detail modal | `LicForm.tsx`, `LicAccountCard.tsx` | Full account record and confirmed fields | NEW BRAND DESIGN | REAL / CONNECTED | DONE | — | — |

The list, map and worker pane are composed on one URL. The map is counted separately because it is a large, distinct spatial view; the worker pane is read-only because the backend does not confirm availability or assign work from that pane. The “Лицевая” new/edit modes are separate user tasks with materially different data and restrictions, though they share a component. The “Табличная” tab has its own work-row editor, so it is one more surface shared by those modes. Code and address search are separate workflows inside one modal.

### Screen → store → API → endpoint → status

| Screen(s) | Store / hook | API function | Endpoint | Status in active UI |
|---|---|---|---|---|
| 1 Login | `useLogin`, `loginStore` | `login` | DEV `POST /mi/login` | Connected; backend availability outside this audit |
| 2 Home | `invoiceStore`, `useApp` | `loadInvoices` → `getInvoices` | `POST /mi/invoices` | Connected; summary derived from real rows |
| 3 Request list/search | `invoiceStore`, `useHook` | `loadInvoices` → `getInvoices` | `POST /mi/invoices` | Connected; search and status/deadline filters are local |
| 4 Map | `invoiceStore`, `Maps` local map state | `getInvoices`; Yandex Maps/geocode | `POST /mi/invoices`; external Yandex | Connected: identical filtered array drives list/map; zero results mean zero markers; marker preview opens existing editor |
| 5 New request | `CreateInvoiceModal`, `invoiceStore`, `licsStore`, `navigationStore.workers` | `saveInvoice`, `getLic`, `getWorkTypes`, `getWorks`, `getWorkers` | `/mi/set_invoice`, `/mi/get_lic`, `/mi/get_work_types`, `/mi/get_works`, `/mi/workers` | Connected; account selection also invokes `/mi/add_lic` |
| 6 Request detail/edit | `CreateInvoiceModal`, `invoiceStore` | `saveInvoice`, `getWorks`, `getWorkTypes` | `/mi/set_invoice`, `/mi/get_works`, `/mi/get_work_types` | Connected; read from already-loaded invoice list, no separate detail API |
| 7 Equipment/works tab | `CreateInvoiceModal` local work rows | `getWorks`, `saveInvoice` | `/mi/get_works`, `/mi/set_invoice` | Connected; row prices/calculations are local |
| 8 Account list | `licsStore` | `getLics`, `addLic`, `delLic` | `/mi/get_lics`, `/mi/add_lic`, `/mi/del_lic` | Connected; delete has no confirmation/undo |
| 9 Code search | `FindLics`, `licsStore` | `getLic`, then `addLic` | `/mi/get_lic`, `/mi/add_lic` | Connected |
| 10 Address search | `useFindLics`, `licsStore` | `getSettlements`, `getStreets`, `getHouses`, then `addLic` | external `inter_vesta/hs/API_STNG/V2/{getSettlements,getStreets,getHouses}`; `/mi/add_lic` | Connected; cascade, dropdown and result tested with browser-only responses; live directory response still needs authenticated verification |
| 11 Account detail | `licsStore.item` from list row, `LicForm` | `getLics`, then `getLic` on open | `/mi/get_lics`, `/mi/get_lic` | Connected; full record is fetched with inline loading/error/retry; only returned fields are displayed |

`src/Store/api.ts` uses the DEV `/mi/` proxy for its main API; the address directory uses an absolute external host. `docs/BACKEND_CONTRACTS.md` still describes the former absolute main API path and should be reconciled in a separate backend-contract documentation task. The original inventory did not call backend endpoints. Map QA later used browser-only invoice fixtures and the real Yandex API.

### Hidden workflows and modal boundary

- Reachable large modal: request create/edit with “Лицевая” and “Табличная”; nested account picker opens `FindLics`.
- Reachable large modals: account code/address search and account detail.
- Map is an embedded large view; marker selection opens a compact DOM preview with an action into the existing request editor.
- Unreachable: `CompletedForm` (completed act editor) and its `CompletedPrint` print modal. They have real API methods but no import from the active app tree.
- Unreachable: `InvoiceView`, `InvExecute`, `WorkerPicker`, `AddressForm`. Their presence must not be mistaken for active screens.
- No active `IonAlert`, `IonPopover`, or `IonActionSheet` workflow found. Toast and the request editor's small dropdowns are not counted as screens.

### Backend capabilities without complete active UI

| Capability | Store/API | Current UI | Recommendation |
|---|---|---|---|
| Completed work act fetch/create | `actStore`, `useCompleted`, `getCompletedAct`/`createCompletedAct` → `/mi/COMPLETED_GET`, `/mi/COMPLETED_CREATE` | `CompletedForm` and print exist but are unreachable | Validate contract and entry point from completed request, then design editor and print review as future screens; not counted in reachable total |
| Full account lookup for detail | `getLic` → `/mi/get_lic` | Used by code search, request editor and account detail | Detail loads the full record on open; show only fields actually returned by the backend |

The active request editor can assign an executor through `/mi/set_invoice`; `invoiceStore.assignWorker` is a separate unused helper, not a missing backend endpoint. `actStore` also contains house-inspection and seal-act draft types without corresponding API functions or reachable UI: do not count them as implemented backend capabilities.

### UI without reliable backend meaning / functional debt

- The request list filter is now functional client-side; the worker pane shows only actual name/role/work counts, without inferred availability or assignment.
- Account detail now loads `get_lic` and shows only returned fields; it does not invent an active status.
- Request editor's work tab and address search do use live APIs; the price and address selections must be verified against real response shapes before visual refinement.
- The account list now confirms removal before calling `/mi/del_lic`; failed requests restore the item through the existing store.
- The shared `Page.tsx` header uses the official logo and real route buttons; redesigned workflows use the aligned title and modal header pattern.

### Dead / possibly unused (6 items, excluded from screen total)

1. `InvoiceView.tsx` — no active import; replaced by the request editor's edit mode.
2. `InvExecute.tsx` — no active import; contains local priority/rating/availability defaults not backed by a verified contract.
3. `WorkerPicker.tsx` — no active import.
4. `CompletedForm.tsx` — no active import; act workflow unreachable.
5. `CompletedPrint.tsx` — only imported by unreachable `CompletedForm`.
6. `FindAddress/FindAddress.tsx` (`AddressForm`) — no active import; active request editor uses DaData directly.

Additional non-screen dead code: `navigationStore.currentRoute/history/useRoutes` is not used by active routing; `useHook.upd_address/upd_worker` are returned but not consumed by the active request page. `/settings` is not a screen; it redirects. No `/forgot-password` or `/register` route exists. These are not added to the six orphan UI items.

### Recommended order and scope

**Phase 1 — daily request work:** P1 request list/search, P2 map, P3 new request, P4 request detail/edit and P5 equipment/works are done. Mobile has list/map/team navigation; desktop keeps list left, map centre and read-only workers right.

**Phase 2 — account/customer:** P6 attached-account list, P7 code lookup, P8 address lookup and P9 account detail are done. Account status is omitted unless a confirmed backend field is defined.

**Phase 3 — acts and supporting work:** Validate completed-act API and entry point before deciding whether to reconnect/redesign `CompletedForm` and `CompletedPrint`. Decide whether unused worker/legacy address components should be retired; do not count them in the current remaining total.

**Progress:** 11 / 11 workflows done; 0 remaining.

**Next screen:** None in the approved 11-workflow inventory. Acts remain a separate potential capability pending entry-point and API validation.
