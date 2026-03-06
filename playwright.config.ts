import { defineConfig } from '@playwright/test';
import * as dotenv from 'dotenv';

dotenv.config();

export default defineConfig({
  testDir: './tests',
  timeout: 240_000,
  expect: { timeout: 20_000 },
  retries: 0,
  reporter: [
  ['html'],
  ['junit', { outputFile: 'test-results/results.xml' }]
],
  use: {
    baseURL: process.env.BASE_URL || 'https://www.automationexercise.com',
    headless: process.env.HEADLESS !== 'false',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure'
  },
  outputDir: 'test-results'
});
