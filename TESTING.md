# Testing Documentation

## 1. Install & run the app

```bash
npm install
npm run dev
```

App opens at `http://localhost:5173`. Test users (from [js/users.js](js/users.js), mirrored inline in `src/App.vue`):

| Email | Password |
|---|---|
| admin@admin.com | 2020 |
| biancunha@gmail.com | 123456 |
| growdev@growdev.com.br | growdev123 |

## 2. Running the tests

### In your IDE / terminal

```bash
npm run test:e2e          # full suite, excludes a11y - 22 scenarios
npm run test:e2e:sanity   # 2 scenarios - fast confidence check
npm run test:e2e:a11y     # just the 3 accessibility scenarios
npm run test:e2e:ui       # Playwright's interactive UI mode
```

Every command runs across **all 3 configured browsers** (Chromium, Firefox, WebKit) except accessibility, which runs on Chromium + Firefox only - see [Assumptions](#6-assumptions) for why. So `test:e2e` runs 66 (22 × 3), `test:e2e:sanity` runs 6 (2 × 3), `test:e2e:a11y` runs 6 (3 × 2).

`npm run test:e2e:ui` is the best way to explore a test interactively — it shows the live browser, each step, and DOM snapshots side by side. In WebStorm/IntelliJ, installing the official **Playwright** plugin adds a run gutter icon next to each `test(...)` for one-click execution.

### Via GitHub Actions

[.github/workflows/e2e-tests.yml](.github/workflows/e2e-tests.yml) runs automatically on every push/PR to `master` (66 tests = 22 scenarios × 3 browsers, excludes accessibility - see [Assumptions](#6-assumptions)). To run it manually: repo → **Actions** tab → **E2E Tests** → **Run workflow** → pick a branch and one of three options:

| Option | Runs |
|---|---|
| `sanity` (default) | 6 (2 scenarios × 3 browsers) |
| `full` | 66 (22 scenarios × 3 browsers, excludes a11y) |
| `a11y` | 6 (3 scenarios × 2 browsers - Chromium + Firefox only) |

Every run uploads the HTML report (with screenshots, and video on failure) as a downloadable artifact.

### Viewing the report

Every run generates `playwright-report/` (git-ignored, regenerated each time). Open it with:

```bash
npx playwright show-report
```

This opens the full interactive report in your browser: pass/fail summary, every test's steps, a screenshot for every test, and video + trace for any failure. From a GitHub Actions run: open the run → **Summary** tab → download the `playwright-report` artifact → unzip → open `index.html`.

**Sample console output**, from a full `npm run test:e2e` + `npm run test:e2e:a11y` run (72 scenarios total):

```
[70/72] [webkit] › login-valid-credentials.spec.js:15:5 › Login - valid credentials › logs in and out as admin@admin.com @sanity
[71/72] [webkit] › login-valid-credentials.spec.js:15:5 › Login - valid credentials › logs in and out as biancunha@gmail.com
[72/72] [webkit] › login-valid-credentials.spec.js:15:5 › Login - valid credentials › logs in and out as growdev@growdev.com.br
  2 failed
    [chromium] › login-accessibility.spec.js:25:3 › Login - accessibility › logged-in/Home page has no automatically detectable accessibility violations @a11y
    [firefox] › login-accessibility.spec.js:25:3 › Login - accessibility › logged-in/Home page has no automatically detectable accessibility violations @a11y
  70 passed (12.7s)
```

The 2 failures are the known, intentionally-documented accessibility findings (see [Assumptions](#6-assumptions)) — not a broken suite.

## 3. Test approach

Playwright + Page Object Model. Tests describe *what* they check; `LoginPage`/`HomePage` own *how* to find and interact with elements, so a markup change only needs updating in one place. Test data (users, invalid-login scenarios, expected messages) lives in `tests/fixtures/`, never hardcoded in spec files. Suites are split by concern (valid / invalid / robustness / behavior / accessibility) and tagged (`@sanity`, `@a11y`) so CI can run a fast subset or everything, on demand. Where the app itself has real bugs, tests document them honestly (assert the ideal state and let the test fail with a clear message) rather than working around them - see [Assumptions](#6-assumptions).

## 4. Test Architecture

**Framework:** Playwright Test (with `@axe-core/playwright` for accessibility scans).
**Architecture:** Page Object Model (POM) — tests describe *what* to check, page objects (`LoginPage`, `HomePage`) own *how* to find and interact with elements, and test data lives separately in fixtures.

```
tests/
├── fixtures/
│   └── users.js                      # test data only: users, invalid-login scenarios, expected messages
├── pages/
│   ├── BasePage.js                    # shared: getSessionEmail() (reads localStorage)
│   ├── LoginPage.js                   # login form: fields, button, error message
│   └── HomePage.js                    # logged-in view: nav menu, logout button
├── login-valid-credentials.spec.js    # happy path, full lifecycle per user
├── login-invalid-credentials.spec.js  # field-combination rejections
├── login-input-robustness.spec.js     # hostile/malformed input
├── login-behavior.spec.js             # stateful/interaction behavior
└── login-accessibility.spec.js        # axe-core scans + keyboard navigation
```

- **`BasePage`** holds only what's shared and isn't tied to one screen's DOM (session-state check via `localStorage`).
- **`LoginPage` / `HomePage`** each own only their own screen's locators and actions (`login()`, `logout()`).
- Tests use `test.step(...)` to break each test into named Arrange/Act/Assert phases, so a failure's report shows exactly which phase broke.
- `test.describe(..., { tag: '@sanity' })` / per-test `{ tag: '@a11y' }` drive the CI filtering described above.

## 5. Scenarios covered (25 distinct scenarios, run across Chromium/Firefox/WebKit - accessibility on Chromium/Firefox only)

**Valid credentials (3)** — full lifecycle per user: login → session established → nav visible → logout → session cleared.
1. Logs in and out as `admin@admin.com`
2. Logs in and out as `biancunha@gmail.com`
3. Logs in and out as `growdev@growdev.com.br`

**Invalid credentials (10)** — each must be rejected: error shown, no session created.
1. A wrong password is used with a valid email
2. An unregistered email is used with a valid password
3. Both the email and password are wrong
4. The email is left empty
5. The password is left empty
6. Both fields are left empty
7. A valid email is paired with another user's password
8. Valid credentials have surrounding whitespace
9. The email case does not match exactly
10. The password case does not match exactly

**Input robustness (5)** — hostile/malformed input must degrade to the normal rejection, not crash or hang.
1. A SQL-injection-style string is entered
2. An HTML/script-injection string is entered
3. Extremely long input is entered (5000 characters)
4. Unicode and emoji characters are entered
5. Symbol-only input is entered

**Behavior (4)** — stateful/interaction checks beyond a single login attempt.
1. Rejects the same invalid credentials consistently on repeat attempts (no hidden lockout)
2. Clears the error message as soon as the user edits a field
3. Logs in when submitting via the Enter key instead of clicking LOGIN
4. Does not persist the error message across a page reload

**Accessibility (3)** — Chromium + Firefox only (see [Assumptions](#6-assumptions) for why WebKit is excluded here).
1. Login page has no automatically detectable accessibility violations
2. Logged-in/Home page has no automatically detectable accessibility violations
3. Can log in & log out using only the keyboard

## 6. Assumptions

- **The app's real login logic is `App.vue`'s inline `users` array**, not `js/users.js` — the latter isn't imported by the running app, only by tests (and the original `js/users.test.js` unit test). Both currently list the same 3 users, so this doesn't affect test validity, but it's worth knowing they're two separate sources.
- **No backend exists.** Authentication is a client-side array match; sessions are just a `localStorage` key. Tests treat `localStorage` as the source of truth for "is a session active."
- **Two known app defects are deliberately left unfixed and documented, not patched:**
  - `.content` (the post-login body text) has `display: none` hardcoded in CSS with nothing to override it — real, but out of scope for a login test, so no test asserts on it.
  - The `.user-section` logout dropdown never becomes visible (missing an `.active` CSS class the app never adds) — tests use the working `.btn-logout` button instead.
  - Accessibility: a color-contrast failure on the Logout button and a missing `<h1>` on the logged-in view are real WCAG findings, intentionally left as a failing test (`login-accessibility.spec.js`) rather than fixed, since the task is to test the app, not modify it.
- **Accessibility tests are excluded from automatic CI** (push/PR) specifically because of the above known failures — otherwise every commit would show red for a pre-existing, unrelated issue. They remain fully runnable on demand (`a11y` or `full` in the manual workflow dropdown).
- **WebKit runs everything except accessibility.** Safari/WebKit excludes buttons from the default Tab order (only text inputs get focus via Tab, unless the user has macOS's "Full Keyboard Access" enabled) - a genuine platform difference, not a Playwright or app bug. It only affects the keyboard-navigation test in `login-accessibility.spec.js`, so that one file is excluded from the `webkit` project via `testIgnore` in `playwright.config.js`, while every other spec still runs on all 3 browsers.
- **`master` is the default/CI-integration branch.**
- Two pre-existing workflows (`add-candidate-collaborator.yml`, `google-form-submission.yml`) are unrelated recruiter-onboarding automation carried over from the assignment template repo — left untouched, not part of this test suite.
