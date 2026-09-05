import { BasePage } from './BasePage.js';

// Everything on the logged-in screen: the nav menu and the logout control.
export class HomePage extends BasePage {
  constructor(page) {
    super(page);
    this.menu = page.locator('.menu');

    // `.user-section` dropdown is broken (missing CSS class, see App.vue) - use this instead.
    this.logoutButton = page.locator('.btn-logout');
  }

  async logout() {
    await this.logoutButton.click();
  }
}
