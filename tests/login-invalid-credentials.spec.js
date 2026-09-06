import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/LoginPage.js';
import { INVALID_LOGIN_MESSAGE, INVALID_LOGIN_SCENARIOS } from './fixtures/users.js';

test.describe('Login - invalid credentials', () => {

  // Every scenario must be rejected: error shown, no session created (see
  // fixtures/users.js for what each scenario covers and why). One is tagged
  // @sanity as the fast check that rejection works at all.
  for (const scenario of INVALID_LOGIN_SCENARIOS) {
    const tag = scenario.sanity ? '@sanity' : undefined;
    test(`rejects login when ${scenario.description}`, { tag }, async ({ page }) => {
      const loginPage = new LoginPage(page);

      await test.step('Arrange: open the app', async () => {
        await loginPage.goto();
      });

      await test.step('Act: submit the scenario\'s credentials', async () => {
        await loginPage.login(scenario.email, scenario.password);
      });

      await test.step('Assert: the exact error message is shown', async () => {
        await expect(loginPage.errorMessage).toBeVisible();
        await expect(loginPage.errorMessage).toHaveText(INVALID_LOGIN_MESSAGE);
      });

      await test.step('Assert: the user was NOT logged in', async () => {
        await expect(loginPage.loginForm).toBeVisible();
        expect(await loginPage.getSessionEmail()).toBeNull();
      });
    });
  }

});
