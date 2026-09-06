import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/LoginPage.js';
import { HomePage } from './pages/HomePage.js';
import { VALID_USERS } from './fixtures/users.js';

const MOBILE_VIEWPORT = { width: 375, height: 812 };

test.describe('Login - responsive', () => {

  test('login form is usable on a mobile viewport', async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
    const loginPage = new LoginPage(page);
    const user = VALID_USERS[0];

    await loginPage.goto();
    await expect(loginPage.emailInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
    await expect(loginPage.loginButton).toBeVisible();

    await loginPage.login(user.email, user.password);
    await expect(loginPage.loginForm).toBeHidden();
  });

  // css/style.css:113 sets `.menu { width: 45vh }` - viewport-HEIGHT units on
  // a width property, with no @media query anywhere to compensate. Works by
  // coincidence on wide desktop viewports; on a narrow mobile viewport there's
  // no room left for justify-content: space-between to create any gap, so the
  // nav items render with zero spacing ("HomeProductsContact").
  test('nav menu items have visible spacing on a mobile viewport', { tag: '@known-issue' }, async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
    const loginPage = new LoginPage(page);
    const homePage = new HomePage(page);
    const user = VALID_USERS[0];

    await loginPage.goto();
    await loginPage.login(user.email, user.password);

    const [homeBox, productsBox, contactBox] = await Promise.all([
      homePage.homeMenuItem.boundingBox(),
      homePage.productsMenuItem.boundingBox(),
      homePage.contactMenuItem.boundingBox(),
    ]);

    expect(productsBox.x - (homeBox.x + homeBox.width)).toBeGreaterThan(0);
    expect(contactBox.x - (productsBox.x + productsBox.width)).toBeGreaterThan(0);
  });

});
