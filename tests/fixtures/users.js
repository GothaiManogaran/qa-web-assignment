// Test data only - no Playwright/locator code belongs in this file.
import { users } from '../../js/users.js';

// Imported, not duplicated - tests track whatever users the app defines.
export const VALID_USERS = users;

export const INVALID_LOGIN_MESSAGE = 'Invalid email or password. Please try again.';

const [admin, biancunha, growdev] = users;

// A representative credential pair with no matching user - used wherever a
// test just needs "some rejected login", not a specific field combination.
export const UNKNOWN_CREDENTIALS = { email: 'notreal@user.com', password: 'wrongpass' };

// App.vue's logIn() does a strict === match, no .trim(), no case folding -
// so whitespace/case variants of valid credentials are expected to fail too.
export const INVALID_LOGIN_SCENARIOS = [
  { description: 'a wrong password is used with a valid email', email: admin.email, password: 'wrongpass', smoke: true },
  { description: 'an unregistered email is used with a valid password', email: 'notreal@user.com', password: admin.password },
  { description: 'both the email and password are wrong', ...UNKNOWN_CREDENTIALS },
  { description: 'the email is left empty', email: '', password: admin.password },
  { description: 'the password is left empty', email: admin.email, password: '' },
  { description: 'both fields are left empty', email: '', password: '' },
  { description: "a valid email is paired with another user's password", email: admin.email, password: biancunha.password },
  { description: 'valid credentials have surrounding whitespace', email: `  ${admin.email}  `, password: `  ${admin.password}  ` },
  { description: 'the email case does not match exactly', email: admin.email.toUpperCase(), password: admin.password },
  { description: 'the password case does not match exactly', email: growdev.email, password: growdev.password.toUpperCase() },
];

// No sink to exploit here (no v-html, no backend) - these are crash-safety
// checks: must degrade to the normal rejection, not hang. A separate list
// from INVALID_LOGIN_SCENARIOS because this validates robustness, not the
// login-matching logic itself.
export const MALFORMED_INPUT_SCENARIOS = [
  { description: 'a SQL-injection-style string is entered', email: "' OR '1'='1", password: "' OR '1'='1" },
  { description: 'an HTML/script-injection string is entered', email: '<script>alert(1)</script>', password: '<img src=x onerror=alert(1)>' },
  { description: 'extremely long input is entered', email: `${'a'.repeat(5000)}@test.com`, password: 'b'.repeat(5000) },
  { description: 'unicode and emoji characters are entered', email: '😀🔥💀@emoji.com', password: '密码テスト🔒' },
  { description: 'symbol-only input is entered', email: '!@#$%^&*()', password: '!@#$%^&*()' },
];
