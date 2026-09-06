import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { LoginPage } from './pages/LoginPage.js';
import { HomePage } from './pages/HomePage.js';
import { VALID_USERS } from './fixtures/users.js';

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

  test('logged-in/Home page has no automatically detectable accessibility violations', async ({ page }) => {
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
