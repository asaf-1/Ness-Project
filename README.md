כן — אתה במקום הנכון ב־**Actions**.
במסך שאתה נמצא בו עכשיו (All workflows), יש לך **workflow run אחד**. כדי להמשיך:

### על מה ללחוץ עכשיו (בדיוק)

1. תלחץ על השורה באמצע עם ה־❌ האדום: **“Add GitHub Actions workflow for Playwright”**
   זה יכניס אותך לדף של ה־Run עצמו (Logs).

2. בתוך דף ה־Run:

* אם זה נכשל: תלחץ למעלה על **Re-run jobs** (או Re-run all jobs) אחרי שתבדוק את הסיבה.
* אם זה הצליח: תרד למטה ותראה **Artifacts** (שם מורידים `playwright-report` / `test-results` אם שמרנו אותם).

3. אם אתה רוצה להריץ ידנית workflow (מבלי לעשות push):

* בצד שמאל תלחץ על **Playwright E2E (AutomationExercise)**
* ואז בצד ימין למעלה אמור להיות כפתור **Run workflow**.

---

## README.md מלא (עם הסעיף החדש של GitHub Actions)

תעתיק את כל זה כמו שהוא ל־`README.md`:

```md
# Ness-Project — Playwright E2E (AutomationExercise)

This repository is a ready-to-run **Playwright + TypeScript** E2E automation project.
It was built as a clean “take-home style” setup, so an interviewer can clone it and run it immediately.

## Project Goal

Automate a full E2E flow on https://www.automationexercise.com/:

1. Signup with a **random user** (new user each run)
2. Add **multiple products** to cart (handles the site’s cart modal correctly)
3. Proceed to **Checkout**
4. Take **screenshots** on checkout and after purchase (order summary / totals)
5. Fill payment details and confirm order
6. Navigate to product page and submit a **random review** using the same user

The test is designed to be stable by:
- Using **data-qa** selectors when available
- Handling the **cart modal** every time it appears
- Handling **random ad overlays** (Google vignette) if they appear

---

## Tech Stack / Libraries

- Playwright: `@playwright/test`
- TypeScript
- dotenv (loads `.env`)
- cross-env (portable env vars in scripts)

---

## Repository Structure

```

Ness-Project/
├─ .github/
│  └─ workflows/
│     └─ playwright.yml              # GitHub Actions workflow (CI)
├─ data/
│  ├─ products.json                  # Product configuration used by the test
│  └─ payment.json                   # Payment input data used by the test
├─ src/
│  ├─ pages/
│  │  └─ AutomationExercisePage.ts   # Page Object / main actions wrapper
│  └─ utils/
│     └─ randomUser.ts               # Random user generator (unique per run)
├─ tests/
│  └─ Test-File.spec.ts              # ✅ MAIN test entry (runs by default)
├─ playwright.config.ts              # Playwright config (baseURL, report, timeouts)
├─ .env.example                      # Example environment file
├─ .gitignore                        # Ignore local artifacts (node_modules, reports, etc.)
├─ package.json                      # Scripts + deps
└─ README.md

````

> Note: The test runner uses `testDir: "./tests"`, so only files under `/tests` run by default.

---

## Prerequisites

- Node.js **18+** recommended
- Windows / macOS / Linux supported

---

## Setup (Local Run)

### 1) Install dependencies
```bash
npm install
````

### 2) Install Playwright browsers

```bash
npx playwright install
```

### 3) Environment file

This project uses `.env` (loaded by `dotenv` inside `playwright.config.ts`).

* Copy `.env.example` → `.env`

**Windows PowerShell:**

```powershell
copy .env.example .env
```

---

## Run Tests

### Run headless (default)

```bash
npm test
```

### Run headed (see the browser)

```bash
npm run test:headed
```

### Open the HTML report (after a run)

```bash
npm run report
```

---

## Where Screenshots & Reports Are Saved

During a local run Playwright creates:

* `test-results/`  → raw outputs + attachments (screenshots)
* `playwright-report/` → the HTML report

In this project the test explicitly saves screenshots at Checkout and after Order Placed.
You will typically find them under something like:

```
test-results/
└─ <test-name>/
   └─ attachments/
      ├─ 01-checkout-summary-<runId>.png
      ├─ 02-checkout-before-place-order-<runId>.png
      └─ 03-order-placed-<runId>.png
```

---

## Data Files

### `data/products.json`

Controls which products are used (IDs / quantities / flow type “Home card” vs “View Product”).

### `data/payment.json`

Controls payment form inputs (name/card/cvc/month/year).

> You can modify these JSON files to change the scenario without editing the test logic.

---

## GitHub Actions (CI) — Run in GitHub

This repository includes a GitHub Actions workflow that runs the Playwright test on every:

* **push**
* **pull request**
  and can also be triggered manually.

### Manual run (recommended for interview)

1. Go to the repository on GitHub
2. Click **Actions**
3. Select **Playwright E2E (AutomationExercise)**
4. Click **Run workflow**
5. Choose the branch and run

### Results (Artifacts)

After the workflow run finishes:

1. Open the workflow run
2. Scroll to **Artifacts**
3. Download:

   * `playwright-report` (HTML report)
   * `test-results` (screenshots/attachments)

### Env handling in CI

The workflow copies `.env.example` to `.env` automatically (so the run does not depend on your local machine).

---

## Troubleshooting

### 1) “Cart Modal” blocks clicks (loop / intercept)

The site shows a modal after adding products.
This project handles it via:

* “Continue Shopping” for most adds
* “View Cart” only on the last add

### 2) Random Ad Overlay (google_vignette)

Sometimes a Google vignette appears and blocks the page.
The code tries to close it using `#dismiss-button` (best-effort), including inside frames.

### 3) If Playwright fails in CI

* Check Actions logs (which step failed)
* Re-run jobs
* Download `playwright-report` artifact for full trace

---

## Interviewer Quick Start (TL;DR)

```bash
git clone <repo-url>
cd Ness-Project
npm install
npx playwright install
copy .env.example .env   # (Windows) or: cp .env.example .env
npm test
npm run report
```

That’s it ✅

```


