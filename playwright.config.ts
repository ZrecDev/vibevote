import { defineConfig, devices } from '@playwright/test';

const hostedBaseURL = process.env.VIBEVOTE_E2E_BASE_URL?.trim();
const baseURL = hostedBaseURL || 'http://127.0.0.1:3000';

export default defineConfig({
  testDir: './tests/e2e',
  use: {
    baseURL,
    ...devices['iPhone 13'],
    browserName: 'chromium',
  },
  webServer: hostedBaseURL
    ? undefined
    : {
        command: 'pnpm dev',
        url: baseURL,
        reuseExistingServer: !process.env.CI,
      },
});
