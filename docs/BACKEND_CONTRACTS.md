# Backend contracts observed in frontend

This documents calls in `src/Store/api.ts` and `src/Store/invoiceStore.ts`, not a backend specification. All methods below use JSON `POST` and return a 1C-style envelope, usually `{ success, data, message }`; some successful responses use `error: false` and some `data` fields contain JSON strings. The frontend normalizes these where noted. Do not infer undocumented routes.

Base A: `https://fhd.aostng.ru/mi/`. `api.ts` uses the Vite `/mi` proxy in DEV and the absolute backend URL in production. Base B: `https://fhd.aostng.ru/inter_vesta/hs/API_STNG/V2/`.

| Frontend function | Backend method / endpoint | JSON payload | Expected data / consumer | Token |
|---|---|---|---|---|
| `login` | `login`, A + `login` | `{login, password}` | `data` contains user fields and `token`; `useLogin` | No |
| `getWorkers` | `workers`, A + `workers` | `{token}` | Worker list; `useApp` → `navigationStore` | Yes |
| `getWorks` | `get_works`, A + `get_works` | `{token}` | Work list `{id,name,price}` after normalization; invoice editor | Yes |
| `getWorkTypes` | `get_work_types`, A + `get_work_types` | `{token}` | Work kinds `{id,name}` after normalization; invoice editor | Yes |
| `getLic` | `get_lic`, A + `get_lic` | `{token,code}` | Account object (first array item if array); account search, invoice editor/view, `licsStore` | Yes |
| `getLics` | `get_lics`, A + `get_lics` | `{token}` | Account array; `licsStore` | Yes |
| `addLic` | `add_lic`, A + `add_lic` | `{token,lc,id}` | Success envelope; `licsStore`, account list/invoice editor | Yes |
| `delLic` | `del_lic`, A + `del_lic` | `{token,lc}` | Success envelope; `licsStore` | Yes |
| `getSettlements` | `getSettlements`, B + `getSettlements` | `{token}` | Settlement data; `useFindLics` | Yes |
| `getStreets` | `getStreets`, B + `getStreets` | `{token,s_id}` | Street data; `useFindLics` | Yes |
| `getHouses` | `getHouses`, B + `getHouses` | `{token,ids}` | House data; `useFindLics` | Yes |
| `getCompletedAct` | `COMPLETED_GET`, A + `COMPLETED_GET` | `{invoice_id,user_id}` | Completed act; `useCompleted` | No token in current call |
| `createCompletedAct` | `COMPLETED_CREATE`, A + `COMPLETED_CREATE` | `{token,...actComplete}` | Saved act envelope; `useCompleted` | Yes |
| `getInvoices` (private to store) | `invoices`, A + `invoices` | `{token}` | Invoice list, sometimes JSON in `data`; `invoiceStore` | Yes |
| `setInvoice` (private to store) | `set_invoice`, A + `set_invoice` | `SetInvoicePayload` including token, invoice identity, account, dates, address, works and status | Success envelope; `saveInvoice` → editor/assignment/update | Yes |

## Authentication

`Login.tsx` supplies form state to `useLogin.ts`; `useLogin` calls `api.login({login,password})` only when the user submits the form. On `success`, it stores the returned user and `data.token` in `loginStore.ts`, sets `auth=true`, and `App.tsx` renders the authenticated router. A previous session is not restored: startup removes `ads-auth-storage`, and the persist merge keeps `auth` false until that button press. If Remember me is on, `useLogin` still prefills `mi.login` and `mi.password`. `useApp.ts` loads invoices and workers after auth. `post` and `getData` log out when a response indicates an invalid token. The Home profile menu calls the existing local `loginStore.logout()` action; it clears persisted user/token/auth and makes no logout API request. There is no confirmed forgot-password or registration endpoint in the frontend.

## Security debt (existing; outside Login visual scope)

- `useLogin.ts` stores the **plaintext password** in localStorage as `mi.password` when Remember me is checked and reads it on mount. This is an existing behavior and must be addressed separately with a migration/UX decision.
- `api.ts` logs request parameters and responses, which can expose login credentials and tokens in the browser console. No new logging should be added.
- Persisted token is readable by JavaScript in localStorage. Do not expand credential storage during UI work.
- `Maps.tsx` and `CreateInvoiceModal.tsx` contain fallback/exposed third-party API keys. Review separately.

## Home data use (verified on DEV)

`useApp.ts` still loads `POST /mi/invoices` and `POST /mi/workers` after auth; Home makes no new backend call. `invoiceStore.ts` normalizes the invoice list and now exposes `loaded` and `error` alongside `loading` so Home can distinguish waiting, empty and failed states. The Home refresh button invokes the existing `loadInvoices(token, true)`; retry uses the same method. No endpoint or payload changed.

Home counts open invoices only for `Новый`, `Назначен`, `В работе`, `Отложен`. “Просроченные заявки” is the subset of open invoices whose `plan_date` precedes the device-local day; the earliest opens in the existing invoice modal. “Завершено сегодня” requires a completed status (`Завершен`, `Завершено`, `Выполнена`, `Выполнено`) **and** a `complete_date` matching the device-local calendar date. Priority rows sort open invoices by `plan_date`; recent rows sort by invoice `date` (creation date, not an inferred activity timestamp). The account quick action uses the existing `/lics` route and displays no count. The worker API response observed on DEV included `id`, `name`, `role`, `in_work`, `completed` but no presence/status field; its old Home KPI was removed. `useApp` still loads workers for other app views. No new endpoint or payload was added.

The active invoice row passes its existing ID through React Router location state to `/invoices`, where the existing invoice view opens that record. This is frontend navigation only; it uses the existing store/list and API. Accounts actions navigate to the existing `/lics` page, which loads its own data.
