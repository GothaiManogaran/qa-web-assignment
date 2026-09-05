// Shared across page objects: checking the session doesn't belong to either
// screen's DOM specifically, so it lives here instead of being duplicated in
// both LoginPage and HomePage.
export class BasePage {
  constructor(page) {
    this.page = page;
  }

  async getSessionEmail() {
    return this.page.evaluate(() => localStorage.getItem('logged'));
  }
}
