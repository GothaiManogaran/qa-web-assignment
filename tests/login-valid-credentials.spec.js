import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/LoginPage.js';
import { HomePage } from './pages/HomePage.js';
import { VALID_USERS } from './fixtures/users.js';

test.describe('Login - valid credentials', () => {

  // One isolated test per valid user: login, validate session, then logout.
  // Only the first user is tagged @sanity - the login logic is one generic
  // match over the user list, not per-user code paths, so one representative
  // user is enough to prove the mechanism isn't broken. The rest still run
  // in the full suite (see login-invalid-credentials for the rejection half).
  for (const user of VALID_USERS) {
    const tag = user === VALID_USERS[0] ? '@sanity' : undefined;
    test(`logs in and out as ${user.email}`, { tag }, async ({ page }) => {
      const loginPage = new LoginPage(page);
      const homePage = new HomePage(page);

      await test.step('Arrange: open the app', async () => {
        await loginPage.goto();
      });

      await test.step('Act: submit valid credentials', async () => {
        await loginPage.login(user.email, user.password);
      });

      await test.step('Assert: the login form is gone', async () => {
        await expect(loginPage.loginForm).toBeHidden();
      });

      await test.step('Assert: the logged-in navigation is now visible', async () => {
        await expect(homePage.homeMenuItem).toBeVisible();
        await expect(homePage.productsMenuItem).toBeVisible();
        await expect(homePage.contactMenuItem).toBeVisible();
      });

      await test.step('Assert: the session was persisted correctly', async () => {
        expect(await homePage.getSessionEmail()).toBe(user.email);
      });

      await test.step('Act: log out', async () => {
        await homePage.logout();
      });

      await test.step('Assert: the login form is back', async () => {
        await expect(loginPage.loginForm).toBeVisible();
      });

      await test.step('Assert: the session was cleared', async () => {
        expect(await loginPage.getSessionEmail()).toBeNull();
      });
    });
  }

});
