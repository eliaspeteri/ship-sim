import { expect, test } from '@playwright/test';

test('top navigation includes simulator link', async ({ page }) => {
  await page.goto('/');
  const simulatorLink = page.getByRole('link', {
    name: 'Simulator',
    exact: true,
  });
  await expect(simulatorLink).toBeVisible();
  await expect(simulatorLink).toHaveAttribute('href', '/sim');
});

test('top navigation link routes to globe', async ({ page }) => {
  await page.goto('/');
  const mapLink = page.getByRole('link', { name: /Map/ });
  await expect(mapLink).toBeVisible();
  await Promise.all([
    page.waitForURL('**/globe', { timeout: 30_000 }),
    mapLink.click(),
  ]);
});

test('landing page manage spaces button navigates to spaces', async ({
  page,
}) => {
  await page.goto('/');
  const spacesButton = page.getByRole('button', { name: 'Manage spaces' });
  await expect(spacesButton).toBeVisible();
  await Promise.all([
    page.waitForURL('**/spaces', { timeout: 30_000 }),
    spacesButton.click(),
  ]);
  await expect(
    page.getByText('Sign in to view and manage your spaces.'),
  ).toBeVisible();
});

test('profile page shows sign-in prompt when unauthenticated', async ({
  page,
}) => {
  await page.goto('/profile');
  await expect(page.getByText('Profile & settings')).toBeVisible();
  await expect(
    page.getByText('Sign in to manage your preferences.'),
  ).toBeVisible();
});

test('vessels page shows error state when API fails', async ({ page }) => {
  await page.route('**/api/vessels', async route => {
    await route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'Unable to load vessels (500).' }),
    });
  });

  await page.goto('/vessels');
  await expect(page.getByText('Global vessels')).toBeVisible();
  await expect(page.getByText('Unable to load vessels (500).')).toBeVisible();
});
