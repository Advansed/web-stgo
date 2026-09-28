# WEB-STGO UI direction

## Product task

WEB-STGO is the Mobile Inspector for АО «Сахатранснефтегаз». On site, an inspector needs to see urgent requests, open work, completed work and account search quickly. Mobile at 390×844 is the first composition; desktop at 1920×1080 and 2560×1440 has distinct density and visual scale. Keep 44px or larger touch targets, readable text in daylight, safe areas, clear loading/error/empty states and current backend-driven meaning.

## Brand source

`logo-book-colors.pdf` and [BRAND_GUIDE.md](BRAND_GUIDE.md) govern the visual system. Canonical STNG: `#182E78`, `#0B7CB5`, `#90DBD9`. Use the official full-colour lockup on light surfaces. Do not reconstruct the mark from independent text and emblem. No invented yellow/amber brand accent. A warning colour is permitted only for a functional status such as an actually overdue item.

`src/theme/variables.css` holds semantic digital tones derived from those three colours. Deep blue supplies foundation and text; clear blue supplies actions and links; mint supplies controlled illumination and focus. Light blue-white surfaces increase mobile readability, while deep corporate blue anchors branded hero areas. No random petroleum palette.

## Login

The light header carries the supplied full-colour lockup. A deep corporate blue illustration panel presents the product; the white form panel presents one clear sign-in task. On mobile the hero is compact and the submit button stays visible in the first viewport at 375–430px widths. The industrial 3D object uses the same official blue/mint/silver material family as Home. Inputs use native labels and autocomplete, a 52px password-visibility target, visible focus and existing `useLogin`/API behaviour. There are no invented recovery routes or embedded generated logos.

## Home

The white topbar carries the official lockup. The branded hero shows the inspector's current queue message and direct actions. The summary retains real invoice-derived **overdue**, **open**, and **completed today** counts. Account search remains an action, never a fabricated KPI. The earliest overdue item opens the existing invoice flow; the open card enters the existing list. Loading, empty, error/retry, profile/logout and queue behaviour remain connected to existing stores. A warm warning is used only in the queue row for an actually overdue deadline.

The mobile first fold contains direct actions and the three summary cards. The hero 3D scene is muted on phone so controls keep priority. Full HD uses compact operational density; QHD expands container, air, type and product visual deliberately. Desktop and mobile use the same tokens, not proportional page zoom.

## 3D asset family

`public/assets/auth/inspector-infrastructure.webp` and `public/assets/home/{home-hero-gas-meter,home-kpi-overdue,home-kpi-open,home-kpi-completed,home-action-accounts}.webp` are new transparent WebP assets. They use a shared three-quarter product camera, soft upper-left studio light, realistic navy/blue/mint material, graphite and small silver details. The completed document was regenerated again to remove fake text. No generated asset carries the official logo, fake values, yellow/gold/orange highlights, fire or HUD.

**No AI grid:** never add a square grid, cyber grid, dot matrix background, generic dashboard grid, HUD or sci-fi coordinate layer to this product.

## Verification

Three screenshot/critique/refinement passes were performed for Login and Home on the live DEV Vite page. Final browser QA covered 375×812, 390×844, 430×932, 768×1024, 1280×800, 1440×900, 1920×1080 and 2560×1440. Home was also checked with a browser-only isolated auth/data state because the backend may return 502; application and backend contracts were not changed. Screenshots are in `output/playwright/` in the working workspace.

## Invoices list and search

The `/invoices` list is the inspector's working surface. On desktop it uses three stable panes: request list at left, the existing map in the centre, and a read-only team roster at right. Mobile starts with the request list and switches between List, Map and Team from a reachable bottom dock; New request opens the existing editor. The new request form, map and request detail/edit workflows are complete.

The list searches actual loaded request fields (number, address, description/service, comment, applicant, account, status, assigned worker and work/equipment rows). Filters for All, Open, Overdue and Completed run on the existing `invoiceStore` payload. Overdue means an open request with a `plan_date` before the local calendar day. Cards prioritise number, real status, address, due date, description and assigned worker. A semantic overdue tone is reserved for this actual condition; blue/mint remain the brand accents.

Loading uses stable skeleton rows. No requests, no search match, no filter match and backend failure each have distinct copy/actions. The list, create and map entry points stay visible when request loading fails. The Yandex map can fail independently; its pane reports availability without hiding the working list. The map now treats a zero-result filtered array as zero markers.

Three visual passes covered 390×844, 1920×1080 and 2560×1440; responsive checks additionally covered 375×812, 430×932, 768×1024, 1280×800 and 1440×900. Browser-only request fixtures exercised zero/one/multiple rows, long content, overdue/future dates, statuses, search/filter matches, loading and server failure. No fixture was added to application source. The operational list intentionally uses no decorative 3D image.

## Invoices map

The list and map consume the same `visibleInvoices` result after local search and status filtering. The map never falls back to all store requests when the filtered result is empty. Normalized invoices retain coordinates from nested address data; otherwise the existing Yandex geocoder resolves a valid address. Missing or invalid coordinates never create a marker at a default location. Asynchronous geocoding is cancelled logically when filters change so stale markers cannot return.

The real Yandex Maps 2.1 API supplies the readable base map, clustering, pan and zoom. The existing key/configuration is unchanged. Initial fit shows the current markers once; the explicit “Показать все” action recentres after manual navigation. Blue markers are active, muted blue markers are completed, and semantic red with an exclamation mark indicates an actually overdue request. Selected markers gain a deep-blue/mint outline. A branded count cluster expands with Yandex's native click zoom. Marker selection opens a compact React preview (number, status, address, deadline) and its “Открыть заявку” action uses the existing editor. No untrusted invoice text is inserted into map balloon HTML.

Mobile map mode gives most available height to the map and keeps List/Map/Team navigation in the bottom dock. Native 44px zoom buttons, fit and list actions stay accessible. The employee pane remains read-only and shows no inferred availability. Loading, zero results, missing coordinates and external-map failure have separate states; failed script loading has a working retry. The request list remains usable if Yandex is unavailable. No automatic geolocation permission is requested.

Three real-map screenshot/critique passes covered 390×844, 1920×1080 and 2560×1440. Browser-only invoice fixtures and the real Yandex API covered 375×812, 430×932, 768×1024, 1280×800 and 1440×900 as well as zero/one/multiple markers, cluster expansion, filtering/search sync, marker preview/open, fit, no-coordinate and load-error/retry states. The QA browser required an explicit network proxy for external Yandex requests; the Yandex script responded successfully with that configuration. No fake map or fixture entered application source.

## New request creation

The create mode of `CreateInvoiceModal` is a full-screen mobile workflow and a bounded desktop workspace. It groups real fields into account, address, request, assignee and work selection; the shared equipment/works tab remains accessible for the required priced work row. The header and primary action remain visible while the form scrolls, including mobile safe-area padding.

Account, work type and worker pickers use existing sources. Required errors appear beside their fields and move focus to the first issue. Save keeps the existing `saveInvoice` → `/mi/set_invoice` payload and success refresh, with an in-flight submit guard and inline server feedback. The shared table editor and existing request edit mode are documented below. No new illustration was added to the working form.

## Existing request edit

Edit mode shares the STNG form shell with request creation but starts with the real request number, semantic status, address and deadline. The linked account is read-only context; applicant, phone, address, work kind, description, comment, status, executor and dates use labelled editable controls. The existing works tab stays available with a work count. Inline required errors guide correction. Save retains the existing `saveInvoice` → `/mi/set_invoice` contract, prevents duplicate submission and returns to the refreshed list on success. The work-row editor uses the shared equipment and works tab described below.

## Equipment and works

The shared “Табличная” tab uses compact work cards on mobile and a denser field grid on desktop. Account equipment is read-only context, separate from editable work rows. Inspectors add a row, search the existing price list, set quantity and remove mistakes; price and total come from the selected work and existing calculation. Required work selection is explained in the tab and shown beside pending rows. When an account has no equipment, a work can still be added with an empty `equip_id` in the existing payload shape; real backend acceptance of that case remains to be verified. Create and edit use the same row UI and `saveInvoice` flow.

## Account list

The `/lics` screen is a compact work list with local search over loaded code, subscriber name and address. Cards show only these confirmed fields and keep separate open and secondary delete actions; no inferred balance or account status appears in the list. Deletion requires an Ionic confirmation before the existing `del_lic` call. Mobile keeps the search and find action above dense cards; loading, no accounts, no search match and API failure have separate states. Code lookup, address lookup and subscriber detail are separate workflows.

## Account code search

The `/lics` code search opens in a full-screen mobile modal and a compact desktop dialog. A labelled numeric-keyboard field searches the existing `get_lic` endpoint. Loading and not-found/network errors stay visible beside the field; changing the code invalidates an older response. A found account shows the returned code, subscriber and address, then the existing `add_lic` action. The dialog closes after a successful add and stays open with an inline error if the add fails. Address search is available in the same modal and follows the completed address hierarchy workflow.

The modal uses STNG tokens and the existing account 3D WebP on desktop; mobile keeps the form dominant. Browser QA on DEV covered 375×812, 390×844, 768×1024, 1280×800, 1440×900 and 1920×1080. Browser-only API responses exercised not found, found and add success; live backend acceptance was not established by that QA.

## Account address search

The address tab follows the existing directory response shape: district/ulus → settlement → street → house → apartment only when the house has apartments → account. Each downstream choice is disabled until its predecessor is selected and resets when an earlier choice changes. Directory loading, API failure/retry and empty results appear beside the relevant control. One returned account opens its real-data result card; multiple accounts appear as a compact choice list. The existing `add_lic` action retains its success/error behaviour.

The custom dropdown is anchored in a portal above the modal scroll area, so the list is not clipped. It opens above or below the input according to visual-viewport room, has its own capped scroll and 46px touch rows. Browser-only directory/account responses on DEV verified the cascade, reset, result, add failure/success and code-tab smoke check at 390×844 and 1920×1080. Live directory response availability still requires an authenticated backend check.

After an address result appears, the modal scrolls only its internal content to reveal the full account card. Extra bottom space keeps the final action clear of the modal edge; a multi-account result list is similarly brought into view. Focused browser QA at 390×844 and 1920×1080 verified full card visibility and unchanged background scroll.

## Account detail

Opening an account from the `get_lics` list requests the existing `get_lic` full record by code. The detail modal keeps the code in a compact header, shows an in-place loading skeleton, and offers retry on failure. The read-only body presents subscriber identity, address/object, contacts, equipment, meters, agreements and financial rows only when corresponding data exists in the full response. It does not infer an active account or agreement status, and does not show empty placeholder sections.

Mobile uses a full-screen detail modal with safe-area padding and normal internal scroll. Desktop uses a bounded 860px workspace and two columns for available data. Browser-only responses on DEV verified open → full data → close → list usable, plus failure/retry at 390×844 and desktop layout at 1920×1080. Live full-record availability remains to be verified with an authenticated backend session.
