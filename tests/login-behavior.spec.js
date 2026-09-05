import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/LoginPage.js';
import { HomePage } from './pages/HomePage.js';
import { VALID_USERS, INVALID_LOGIN_MESSAGE, UNKNOWN_CREDENTIALS } from './fixtures/users.js';

test.describe('Login - behavior', () => {

  // No lockout/rate-limit exists - repeated bad attempts must fail identically.
  test('rejects the same invalid credentials consistently on repeat attempts', async ({ page }) => {
    const loginPage = new LoginPage(page);

    await loginPage.goto();

    await test.step('First attempt is rejected', async () => {
      await loginPage.login(UNKNOWN_CREDENTIALS.email, UNKNOWN_CREDENTIALS.password);
      await expect(loginPage.errorMessage).toHaveText(INVALID_LOGIN_MESSAGE);
    });

    await test.step('Second, identical attempt is rejected the same way', async () => {
      await loginPage.login(UNKNOWN_CREDENTIALS.email, UNKNOWN_CREDENTIALS.password);
      await expect(loginPage.errorMessage).toHaveText(INVALID_LOGIN_MESSAGE);
      expect(await loginPage.getSessionEmail()).toBeNull();
    });
  });

  // clearError() should fire on @input, before any resubmission.
  test('clears the error message as soon as the user edits a field', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const user = VALID_USERS[0];

    await loginPage.goto();
    await loginPage.login(UNKNOWN_CREDENTIALS.email, UNKNOWN_CREDENTIALS.password);
    await expect(loginPage.errorMessage).toBeVisible();

    await test.step('Editing the email field clears the error immediately', async () => {
      await loginPage.emailInput.fill(user.email);
      await expect(loginPage.errorMessage).toBeHidden();
    });

    await test.step('Submitting corrected credentials still logs in successfully', async () => {
      await loginPage.passwordInput.fill(user.password);
      await loginPage.loginButton.click();
      await expect(loginPage.loginForm).toBeHidden();
    });
  });

  // Enter should submit the form the same way clicking LOGIN does.
  test('logs in when submitting via the Enter key instead of clicking LOGIN', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const homePage = new HomePage(page);
    const user = VALID_USERS[0];

    await loginPage.goto();
    await loginPage.emailInput.fill(user.email);
    await loginPage.passwordInput.fill(user.password);
    await loginPage.passwordInput.press('Enter');

    await expect(loginPage.loginForm).toBeHidden();
    expect(await homePage.getSessionEmail()).toBe(user.email);
  });

  // errorMessage is in-memory only - a reload should return a clean form.
  test('does not persist the error message across a page reload', async ({ page }) => {
    const loginPage = new LoginPage(page);

    await loginPage.goto();
    await loginPage.login(UNKNOWN_CREDENTIALS.email, UNKNOWN_CREDENTIALS.password);
    await expect(loginPage.errorMessage).toBeVisible();

    await page.reload();

    await expect(loginPage.loginForm).toBeVisible();
    await expect(loginPage.errorMessage).toBeHidden();
    await expect(loginPage.emailInput).toHaveValue('');
    await expect(loginPage.passwordInput).toHaveValue('');
  });

});
