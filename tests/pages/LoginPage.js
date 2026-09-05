import { BasePage } from './BasePage.js';

// Everything on the login screen: the form fields, the submit button, and
// the error message shown on rejection.
export class LoginPage extends BasePage {
  constructor(page) {
    super(page);
    this.emailInput = page.getByLabel('User');
    this.passwordInput = page.getByLabel('Password');
    this.loginButton = page.getByRole('button', { name: 'LOGIN' });
    this.loginForm = page.locator('.login');
    this.errorMessage = page.locator('.error-message');
  }

  async goto() {
    await this.page.goto('/');
  }

  async login(email, password) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }
}
