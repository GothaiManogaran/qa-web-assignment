import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  reporter: 'html',
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'on',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    // Excludes accessibility: WebKit skips buttons in the default Tab order
    // (no Full Keyboard Access), which isn't an app/Playwright bug but does
    // fail the keyboard-navigation test - see TESTING.md Assumptions.
    { name: 'webkit', use: { ...devices['Desktop Safari'] }, testIgnore: '**/login-accessibility.spec.js' },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
});
