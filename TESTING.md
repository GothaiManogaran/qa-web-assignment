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
npm run test:e2e          # full suite, excludes a11y + other known issues - 23 scenarios, all green
npm run test:e2e:sanity   # 2 scenarios - fast confidence check
npm run test:e2e:a11y     # just the 4 accessibility scenarios (includes 1 known failure)
npm run test:e2e:ui       # Playwright's interactive UI mode
```

Every command runs across **all 3 configured browsers** (Chromium, Firefox, WebKit) except accessibility, which runs on Chromium + Firefox only - see [Assumptions](#6-assumptions) for why. So `test:e2e` runs 69 (23 × 3, all passing), `test:e2e:sanity` runs 6 (2 × 3), `test:e2e:a11y` runs 8 (4 × 2, 2 failing).

`npm run test:e2e:ui` is the best way to explore a test interactively — it shows the live browser, each step, and DOM snapshots side by side. In WebStorm/IntelliJ, installing the official **Playwright** plugin adds a run gutter icon next to each `test(...)` for one-click execution.

### Via GitHub Actions

[.github/workflows/e2e-tests.yml](.github/workflows/e2e-tests.yml) runs automatically on every push/PR to `master` (69 tests = 23 scenarios × 3 browsers, all passing - see [Assumptions](#6-assumptions)). To run it manually: repo → **Actions** tab → **E2E Tests** → **Run workflow** → pick a branch and one of three options:

| Option | Runs |
|---|---|
| `sanity` (default) | 6 (2 scenarios × 3 browsers), all passing |
| `full` | 69 (23 scenarios × 3 browsers), all passing - excludes a11y and other known issues |
| `a11y` | 8 (4 scenarios × 2 browsers - Chromium + Firefox only), 2 failing |

Every run uploads the HTML report (with screenshots, and video on failure) as a downloadable artifact.

### Viewing the report

Every run generates `playwright-report/` (git-ignored, regenerated each time). Open it with:

```bash
npx playwright show-report
```

This opens the full interactive report in your browser: pass/fail summary, every test's steps, a screenshot for every test, and video + trace for any failure. From a GitHub Actions run: open the run → **Summary** tab → download the `playwright-report` artifact → unzip → open `index.html`.

**Sample console output**, from `npx playwright test` with no filters (every scenario, every applicable browser - 83 test runs total, including the 3 known-issue categories). `npm run test:e2e` itself excludes all of these and is fully green (69/69) - this unfiltered run is shown here to demonstrate everything at once:

```
  8 failed
    [chromium] › login-accessibility.spec.js:40:3 › Login - accessibility › logged-in/Home page has no automatically detectable accessibility violations @a11y @known-issue
    [chromium] › login-behavior.spec.js:82:3 › Login - behavior › clicking the user icon opens a visible sign-out dropdown @known-issue
    [chromium] › login-responsive.spec.js:29:3 › Login - responsive › nav menu items have visible spacing on a mobile viewport @known-issue
    [firefox] › login-accessibility.spec.js:40:3 › Login - accessibility › logged-in/Home page has no automatically detectable accessibility violations @a11y @known-issue
    [firefox] › login-behavior.spec.js:82:3 › Login - behavior › clicking the user icon opens a visible sign-out dropdown @known-issue
    [firefox] › login-responsive.spec.js:29:3 › Login - responsive › nav menu items have visible spacing on a mobile viewport @known-issue
    [webkit] › login-behavior.spec.js:82:3 › Login - behavior › clicking the user icon opens a visible sign-out dropdown @known-issue
    [webkit] › login-responsive.spec.js:29:3 › Login - responsive › nav menu items have visible spacing on a mobile viewport @known-issue
  75 passed (17.2s)
```

All 8 failures are known, intentionally-documented findings (see [Assumptions](#6-assumptions)) — not a broken suite: 2 are the accessibility color-contrast/heading issue (Chromium + Firefox), 3 are the broken logout dropdown (all 3 browsers), 3 are the mobile nav-spacing bug (all 3 browsers).

## 3. Test approach

Playwright + Page Object Model. Tests describe *what* they check; `LoginPage`/`HomePage` own *how* to find and interact with elements, so a markup change only needs updating in one place. Test data (users, invalid-login scenarios, expected messages) lives in `tests/fixtures/`, never hardcoded in spec files. Suites are split by concern (valid / invalid / robustness / behavior / accessibility / responsive) and tagged (`@sanity`, `@a11y`, `@known-issue`) so CI can run a fast subset, everything, or exclude known-red tests, on demand. Where the app itself has real bugs, tests document them honestly (assert the ideal state and let the test fail with a clear message) rather than working around them - see [Assumptions](#6-assumptions).

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
├── login-accessibility.spec.js        # axe-core scans + keyboard navigation
└── login-responsive.spec.js           # mobile-viewport layout checks
```

- **`BasePage`** holds only what's shared and isn't tied to one screen's DOM (session-state check via `localStorage`).
- **`LoginPage` / `HomePage`** each own only their own screen's locators and actions (`login()`, `logout()`).
- Tests use `test.step(...)` to break each test into named Arrange/Act/Assert phases, so a failure's report shows exactly which phase broke.
- Per-test `{ tag: '@sanity' }`, describe-level `{ tag: '@a11y' }`, and per-test `{ tag: '@known-issue' }` (on the 3 tests that document real, unfixed defects) drive the CI filtering described above.

## 5. Scenarios covered (29 distinct scenarios, run across Chromium/Firefox/WebKit - accessibility on Chromium/Firefox only)

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

**Behavior (5)** — stateful/interaction checks beyond a single login attempt.
1. Rejects the same invalid credentials consistently on repeat attempts (no hidden lockout)
2. Clears the error message as soon as the user edits a field
3. Logs in when submitting via the Enter key instead of clicking LOGIN
4. Does not persist the error message across a page reload
5. Clicking the user icon opens a visible sign-out dropdown *(currently fails - documents a real defect, see [Assumptions](#6-assumptions))*

**Accessibility (4)** — Chromium + Firefox only (see [Assumptions](#6-assumptions) for why WebKit is excluded here).
1. Login page has no automatically detectable accessibility violations
2. Login page with an error message shown has no automatically detectable accessibility violations
3. Logged-in/Home page has no automatically detectable accessibility violations *(currently fails - documents 2 real WCAG findings)*
4. Can log in & log out using only the keyboard

**Responsive (2)** — checked by resizing the page with Playwright's `page.setViewportSize({ width: 375, height: 812 })` (an iPhone-sized viewport), no separate device/tooling needed. To check other sizes, change that value and re-run.
1. Login form is usable on a mobile viewport
2. Nav menu items have visible spacing on a mobile viewport *(currently fails - documents a real defect, see [Assumptions](#6-assumptions))*

### Bug report

Real, confirmed app defects found while testing — not fixed (out of scope), documented instead. Full root-cause detail for each is in [Assumptions](#6-assumptions).

| # | Bug | Failing test | Status |
|---|---|---|---|
| 1 | Post-login content (`.content`) is permanently invisible - hardcoded `display: none` in CSS, nothing ever overrides it | *none* | Not tested — out of scope for a login test, mentioned here for completeness only |
| 2 | Logout dropdown (click the user icon) never becomes visible - missing the `.active` CSS class its own stylesheet requires | `login-behavior.spec.js` › "clicking the user icon opens a visible sign-out dropdown" | Failing (`@known-issue`) |
| 3 | Logout button fails WCAG color-contrast (3.96:1 vs. required 4.5:1); logged-in view has no `<h1>` anywhere | `login-accessibility.spec.js` › "logged-in/Home page has no automatically detectable accessibility violations" | Failing (`@a11y`, `@known-issue`) |
| 4 | Nav menu items ("Home"/"Products"/"Contact") render with 0px spacing on mobile viewports - `.menu { width: 45vh }` uses height units on a width property, with no `@media` query to compensate | `login-responsive.spec.js` › "nav menu items have visible spacing on a mobile viewport" | Failing (`@known-issue`) |

Run `npx playwright test --grep @known-issue` to execute bugs #2-4 together (see [Assumptions](#6-assumptions) for why #1 has no test and why these are excluded from automatic CI).

## 6. Assumptions

- **The app's real login logic is `App.vue`'s inline `users` array**, not `js/users.js` — the latter isn't imported by the running app, only by tests (and the original `js/users.test.js` unit test). Both currently list the same 3 users, so this doesn't affect test validity, but it's worth knowing they're two separate sources.
- **No backend exists.** Authentication is a client-side array match; sessions are just a `localStorage` key. Tests treat `localStorage` as the source of truth for "is a session active."
- **Four known app defects are deliberately left unfixed and documented, not patched** (the task is to test the app, not modify it):
  - `.content` (the post-login body text) has `display: none` hardcoded in CSS with nothing to override it — real, but out of scope for a login test, so no test asserts on it.
  - The `.user-section` logout dropdown never becomes visible (missing an `.active` CSS class the app never adds). `HomePage`'s `logout()` uses the working `.btn-logout` button instead, but `login-behavior.spec.js` has a dedicated test that asserts the dropdown *should* become visible and lets it fail, documenting the defect rather than only mentioning it here.
  - Accessibility: a color-contrast failure on the Logout button and a missing `<h1>` on the logged-in view are real WCAG findings, intentionally left as a failing test (`login-accessibility.spec.js`).
  - Responsive: `css/style.css` sets `.menu { width: 45vh }` — viewport-*height* units on a *width* property, with no `@media` query anywhere to compensate. On a mobile-width viewport there's no room left for `justify-content: space-between` to create any gap, so the nav items ("Home", "Products", "Contact") render with exactly 0px between them, visually running together. `login-responsive.spec.js` asserts a real gap should exist and lets it fail.
- **All 3 known-issue categories are excluded from automatic CI** (push/PR) via `--grep-invert "@a11y|@known-issue"` in both `package.json`'s `test:e2e` and `.github/workflows/e2e-tests.yml`, so pre-existing issues don't turn every commit red. `@a11y` excludes the whole accessibility category; `@known-issue` additionally tags the specific dropdown and responsive-spacing tests (and, redundantly but for clarity, the one failing accessibility test) so all three carry a common, greppable marker. As a result `npm run test:e2e` and automatic CI are both fully green (69/69). To see the known issues: the accessibility one via `npm run test:e2e:a11y` (or the workflow's `a11y` option), the dropdown and responsive-spacing ones via `npx playwright test login-behavior login-responsive`, or all three together via `npx playwright test --grep @known-issue` (not currently wired to a named script or CI option).
- **WebKit runs everything except accessibility.** Safari/WebKit excludes buttons from the default Tab order (only text inputs get focus via Tab, unless the user has macOS's "Full Keyboard Access" enabled) - a genuine platform difference, not a Playwright or app bug. It only affects the keyboard-navigation test in `login-accessibility.spec.js`, so that one file is excluded from the `webkit` project via `testIgnore` in `playwright.config.js`, while every other spec still runs on all 3 browsers.
- **`master` is the default/CI-integration branch.**
- Two pre-existing workflows (`add-candidate-collaborator.yml`, `google-form-submission.yml`) are unrelated recruiter-onboarding automation carried over from the assignment template repo — left untouched, not part of this test suite.
