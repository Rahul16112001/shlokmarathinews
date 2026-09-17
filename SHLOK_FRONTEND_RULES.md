# SHLOK Marathi News - Frontend Development Rules

## Mandatory Production Stack
Production runtime MUST use only:
- HTML5
- CSS3
- Vanilla JavaScript (ES6+)
- Static JSON/data when needed
- Approved external CDN assets when needed

Python MUST NOT be required at runtime.

## Python Policy
Python may be used only as an optional development/build utility.

Never use Python for runtime page rendering, API endpoints, authentication, database access, form processing, dynamic content delivery, or starting a production server.

Existing Python scripts such as `fix.py`, `extract_components.py`, and `update_css.py` must never be imported or executed by browser code.

If Python functionality is needed by the website, convert it to HTML/CSS/JavaScript wherever technically possible.

## Backend Policy
Keep the production website static. Existing approved external services such as Supabase may be accessed from JavaScript.

Do NOT introduce Flask, Django, FastAPI, Python servers, localhost APIs, or `127.0.0.1` runtime dependencies.

Never expose secret/service-role credentials in frontend JavaScript.

## HTML Policy
Use semantic HTML5 and include:
- `<!DOCTYPE html>`
- `<meta charset="UTF-8">`
- responsive viewport meta tag

Use UTF-8 correctly for Marathi/Devanagari. Never introduce mojibake such as `à¤`, `Ã`, or `â`.

## CSS Policy
Use CSS3 only. Keep global styling reusable.

Do not duplicate global header/footer CSS across pages. Use shared styling for Header, Breaking News, Trending Bar, Sidebar, Footer, cards, buttons, and typography.

## JavaScript Policy
Use browser-compatible vanilla JavaScript unless an already-approved library is required.

JavaScript may handle UI interactions, menus, sliders, tabs, tickers, search, frontend rendering, API calls, validation, and utilities.

Do not introduce unnecessary frameworks or runtime dependencies.

## Global Design Policy
`index.html` is the master reference for the current SHLOK Marathi News global design.

All pages must share the same:
- Header
- Breaking News bar
- Trending bar
- Navigation
- Footer
- Typography system
- Brand styling

Do not create separate old/new global components.

## Design Preservation
Keep the current premium SHLOK Marathi News visual identity. Do not downgrade the interface to a basic template.

Preserve premium spacing, clean cards, subtle shadows, professional typography, red/navy branding, editorial hierarchy, and responsive behavior.

## File Path Policy
Use production-safe relative paths such as:
- `css/style.css`
- `js/script.js`
- `./assits/...`
- `../assits/...`

Never use Windows absolute paths, local machine paths, or localhost runtime URLs.

## Deployment Policy
The final website must work after uploading to standard static hosting such as Hostinger `public_html/`.

Production MUST NOT require:
- Python
- pip
- virtualenv
- Flask
- Django
- FastAPI
- Node.js runtime
- local development server

Build tools are allowed during development only. Browser runtime must remain HTML/CSS/JavaScript.

## Python-to-Frontend Conversion
When converting Python functionality:
1. Inspect what the Python code actually does.
2. Identify whether it is build-time or runtime.
3. Remove build-only runtime dependencies.
4. Convert runtime functionality to JavaScript when possible.
5. Preserve existing UI and behavior.
6. Do not remove working features.
7. Test in the browser.
8. Verify no Python runtime calls remain.

## Change Safety
Before modifying the project, inspect the existing implementation.

Do not blindly rewrite working files, remove features, duplicate components, unnecessarily replace CSS, change the website language, or break existing Supabase functionality.

Prefer the smallest necessary code change.

## Mandatory Final Audit
Before declaring the project complete, verify:
- Python runtime dependency: none
- No Flask/Django/FastAPI runtime
- No localhost or `127.0.0.1` runtime API
- No broken asset paths
- No broken CSS/JS imports
- Marathi Unicode is correct
- No duplicate global header/footer
- All pages load
- Desktop and mobile layouts work
- Existing features still work

## Mandatory Final Report
Always report:

`PYTHON REQUIRED AT RUNTIME: YES/NO`

If YES, list every file/feature requiring Python and do not claim static-hosting readiness.

If NO, confirm that production runtime uses HTML + CSS + JavaScript only and identify any remaining Python files as development/build-only.

## Core Rule
The production website is HTML + CSS + JavaScript only.

Do not introduce Python runtime dependencies in future changes unless the project owner explicitly requests a backend architecture change.
