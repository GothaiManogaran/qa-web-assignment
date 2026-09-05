import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/LoginPage.js';
import { INVALID_LOGIN_MESSAGE, MALFORMED_INPUT_SCENARIOS } from './fixtures/users.js';

// Distinct from login-invalid-credentials.spec.js: these check the app
// degrades safely under hostile/malformed input, not the credential-matching
// logic itself (see fixtures/users.js for why there's no real sink to exploit).
test.describe('Login - input robustness', () => {

  for (const scenario of MALFORMED_INPUT_SCENARIOS) {
    test(`rejects login when ${scenario.description}`, async ({ page }) => {
      const loginPage = new LoginPage(page);

      await test.step('Arrange: open the app', async () => {
        await loginPage.goto();
      });

      await test.step('Act: submit the scenario\'s credentials', async () => {
        await loginPage.login(scenario.email, scenario.password);
      });

      await test.step('Assert: the app degrades to the normal rejection', async () => {
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
