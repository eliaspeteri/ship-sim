import { expect, test } from '@playwright/test';

test('landing page renders and primary actions are visible', async ({
  page,
}) => {
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: 'Ship Simulator' }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Launch simulator' }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Explore the map' }),
  ).toBeVisible();
});

test('login page renders credentials form', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByLabel('Username')).toBeVisible();
  await expect(page.getByLabel('Password')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Login' })).toBeVisible();
});
