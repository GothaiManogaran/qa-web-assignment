import { BasePage } from './BasePage.js';

// Everything on the logged-in screen: the nav menu and the logout control.
export class HomePage extends BasePage {
  constructor(page) {
    super(page);
    this.menu = page.locator('.menu');
    // getByText, not a CSS class selector: each item's whole content is just
    // its label text (the icon has none), so this resolves to the same
    // element either way - text is the more resilient choice.
    this.homeMenuItem = page.getByText('Home');
    this.productsMenuItem = page.getByText('Products');
    this.contactMenuItem = page.getByText('Contact');

    // `.user-section` dropdown is broken (missing CSS class, see App.vue) - use
    // this.logoutButton instead for actually logging out.
    this.logoutButton = page.locator('.btn-logout');
    this.userIcon = page.locator('.user-section');
    this.logoutDropdown = page.locator('.logout');
  }

  async logout() {
    await this.logoutButton.click();
  }
}
