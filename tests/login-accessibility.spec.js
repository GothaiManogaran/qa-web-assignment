import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { LoginPage } from './pages/LoginPage.js';
import { HomePage } from './pages/HomePage.js';
import { VALID_USERS, UNKNOWN_CREDENTIALS } from './fixtures/users.js';

// Readable summary for the failure message, instead of a raw JSON dump.
function describeViolations(violations) {
  if (violations.length === 0) return 'none';
  return violations
    .map(v => `[${v.impact}] ${v.id}: ${v.help} (${v.nodes.length} element(s)) - ${v.helpUrl}`)
    .join('\n');
}

test.describe('Login - accessibility', { tag: '@a11y' }, () => {

  test('login page has no automatically detectable accessibility violations', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations, describeViolations(results.violations)).toEqual([]);
  });

  // Neither other scan ever triggers this state - error visibility has its
  // own accessibility concerns (e.g. is it announced to screen readers).
  test('login page with an error message shown has no automatically detectable accessibility violations', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(UNKNOWN_CREDENTIALS.email, UNKNOWN_CREDENTIALS.password);
    await expect(loginPage.errorMessage).toBeVisible();

    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations, describeViolations(results.violations)).toEqual([]);
  });

  // Known, unfixed defect (color-contrast + missing h1) - excluded from
  // automatic CI and 'full' via @known-issue, still runs via the 'a11y'
  // option or an unfiltered `npx playwright test`.
  test('logged-in/Home page has no automatically detectable accessibility violations', { tag: '@known-issue' }, async ({ page }) => {
    const loginPage = new LoginPage(page);
    const homePage = new HomePage(page);
    const user = VALID_USERS[0];

    await loginPage.goto();
    await loginPage.login(user.email, user.password);
    await expect(homePage.menu).toBeVisible();

    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations, describeViolations(results.violations)).toEqual([]);
  });

  // Test to validate login functions only via keyboard
  test('can log in & log out using only the keyboard', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const homePage = new HomePage(page);
    const user = VALID_USERS[0];

    await loginPage.goto();
    await expect(loginPage.emailInput).toBeFocused(); // autofocus

    await page.keyboard.type(user.email);
    await page.keyboard.press('Tab');
    await expect(loginPage.passwordInput).toBeFocused();

    await page.keyboard.type(user.password);
    await page.keyboard.press('Tab');
    await expect(loginPage.loginButton).toBeFocused();

    await page.keyboard.press('Enter');
    await expect(loginPage.loginForm).toBeHidden();

    await page.keyboard.press('Tab');
    await expect(homePage.logoutButton).toBeFocused();

    await page.keyboard.press('Enter');
    await expect(loginPage.loginForm).toBeVisible();
  });

});
