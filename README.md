````md
# Ness-Project — Playwright E2E (AutomationExercise)

This repository is a **self-contained Playwright TypeScript project** created as a clean “take-home / interview-ready” automation assignment.

It demonstrates a full **E2E web flow** on: https://www.automationexercise.com  
including **random user signup**, **adding multiple products**, **handling modals**, **checkout screenshots**, **payment**, and **submitting a review**.

> ✅ Goal: Any interviewer (or anyone cloning the repo) can run this project **without relying on your local machine files/paths**.

---

## ✅ What the test does (End-to-End flow)

**Signup (random user)** → **Add multiple products** → **View Cart** → **Checkout** → **Take screenshots** → **Payment** → **Submit review**

### Key behaviors handled:
- **Random user per run** (unique email) → no reuse, no local accounts needed.
- **Cart modal popup** after each Add-to-cart:
  - for most products: clicks **Continue Shopping**
  - for the last product: clicks **View Cart**
- **View Product flow**:
  - navigates to `/product_details/{id}`
  - changes quantity (`#quantity`)
  - clicks **Add to cart**
- **Random Google vignette ad** handling:
  - if `#google_vignette` appears, the test attempts to close using `#dismiss-button`.
- **Screenshots captured automatically** at important checkout points.

---

## 📦 Requirements (what interviewer needs installed)

### System prerequisites
- **Node.js 18+** (recommended)
- **npm** (comes with Node)
- Internet access to download Playwright browsers on first run

---

## 🚀 Quick start (exact steps)

### 1) Clone the repository
```bash
git clone <REPO_URL>
cd Ness-Project
````

### 2) Install dependencies

```bash
npm install
```

### 3) Install Playwright browsers

```bash
npx playwright install
```

### 4) Run the test

#### Headless (default)

```bash
npm test
```

#### Headed (browser visible)

```bash
npm run test:headed
```

### 5) Open the HTML report

```bash
npm run report
```

---

## 🧾 Dependencies (libraries list + why)

Installed under `devDependencies`:

* **@playwright/test**
  Playwright test runner + browser automation
* **typescript**
  Strong typing and cleaner maintainable automation code
* **dotenv**
  Loads `.env` variables into `process.env` (configurable runs)
* **cross-env**
  Cross-platform env variable support (Windows/macOS/Linux)

> (Optional) If you see TypeScript errors like “Cannot find name 'process'”, install:

```bash
npm i -D @types/node
```

---

## 🌱 Environment variables (what to change and where)

### Where is `.env.example`?

✅ It must be located in the **ROOT** of the project:

```
Ness-Project/.env.example
```

### What interviewer should do:

1. Copy `.env.example` → `.env`
2. Edit values only if needed

Example `.env`:

```env
BASE_URL=https://www.automationexercise.com
HEADLESS=true
```

### What each variable means:

* **BASE_URL**
  Base site URL. Default is `https://www.automationexercise.com` if not provided.
* **HEADLESS**
  `true` or `false`. When `false`, browser UI is visible.

✅ No other local machine configuration is required.

---

## 📁 Project structure (what each file/folder is for)

```
Ness-Project/
├─ tests/
│  └─ Test-File.spec.ts
│     - MAIN test file (final E2E script)
│     - Contains helper functions + full E2E flow
│
├─ playwright.config.ts
│  - Playwright configuration:
│    - baseURL from .env (BASE_URL)
│    - reporter settings
│    - output directories (test-results, playwright-report)
│
├─ data/
│  ├─ payment.json
│  └─ products.json
│  - Reserved for future improvement:
│    - move payment/product test data OUT of the test file
│    - keep test logic clean & configurable
│
├─ src/
│  ├─ pages/
│  - Reserved for Page Object Model (POM) classes
│
│  └─ utils/
│  - Reserved for reusable utilities (random generators, modal handlers, etc.)
│
├─ test-results/
│  - Runtime artifacts created per test run:
│    - screenshots
│    - traces (if enabled)
│
├─ playwright-report/
│  - Generated HTML test report
│
├─ package.json
│  - Scripts + dependencies
│
├─ .env.example
│  - Template env file (safe to commit)
│
└─ .gitignore
   - Ensures node_modules, reports, and local env files are NOT committed
```

---

## 📸 Where screenshots are saved

Screenshots are saved automatically during the run:

### Primary location:

```
test-results/**/
```

### Also available via report:

```
playwright-report/index.html
```

Example screenshot names:

* `01-checkout-summary-<runId>.png`
* `02-checkout-before-place-order-<runId>.png`
* `03-order-placed-<runId>.png`

---

## 🧪 What to expect when running

The console output contains step logs like:

* `STEP 7.3 - View Product (id=1) -> set quantity -> Add to cart`
* `📸 Screenshot saved: 01-checkout-summary-...png`
* `✅ TEST DONE - reached review submit successfully`

This makes it easy for an interviewer to understand **where** the test is and **what** failed if it fails.

---

## 🛠️ Common issues (and what to do)

### 1) Ads / Google vignette appears

The test includes an ad closer:

* detects `google_vignette`
* tries `#dismiss-button` (and fallback selectors)

If the site changes the ad behavior, simply **rerun**:

```bash
npm test
```

### 2) Slow loading / flaky UI

Run headed for debugging:

```bash
npm run test:headed
```

### 3) Browsers not installed

If Playwright prompts about missing browsers:

```bash
npx playwright install
```

---

## ✅ Why this project is interview-ready

* **Single repo** → clone & run
* **No local paths** used
* **Random user** each run
* **Handles real-world flakiness** (modals + ads)
* **Screenshots** prove the checkout summary and totals visually
* Designed to be easily refactored into:

  * Page Objects (`src/pages`)
  * External test data (`data/*.json`)
  * ENV-based configuration (`.env`)

---

## Author

Asaf Nuri — QA Automation (Playwright / TypeScript)

```

