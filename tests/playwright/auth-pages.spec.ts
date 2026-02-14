import { expect, test } from '@playwright/test';

test('login page links to register', async ({ page }) => {
  await page.goto('/login');

  await expect(page.getByLabel('Username')).toBeVisible();
  await expect(page.getByLabel('Password')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Login' })).toBeVisible();

  await page.getByRole('link', { name: 'Register New Account' }).click();
  await expect(page).toHaveURL(/\/register$/);
});

test('register page links back to login', async ({ page }) => {
  await page.goto('/register');

  await expect(page.getByLabel('Username')).toBeVisible();
  await expect(page.getByLabel('Password')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Register' })).toBeVisible();

  await page.getByRole('link', { name: 'Login' }).click();
  await expect(page).toHaveURL(/\/login$/);
});

test('register shows API error response', async ({ page }) => {
  await page.route('**/api/register', async route => {
    await route.fulfill({
      status: 400,
      contentType: 'application/json',
      body: JSON.stringify({
        success: false,
        error: 'Username must be at least 3 characters',
      }),
    });
  });

  await page.goto('/register');
  await page.getByLabel('Username').fill('ab');
  await page.getByLabel('Password').fill('secret123');
  await page.getByRole('button', { name: 'Register' }).click();

  await expect(
    page.getByText('Username must be at least 3 characters'),
  ).toBeVisible();
});

test('register shows generic error on network failure', async ({ page }) => {
  await page.route('**/api/register', async route => {
    await route.abort();
  });

  await page.goto('/register');
  await page.getByLabel('Username').fill('pilot_test');
  await page.getByLabel('Password').fill('secret123');
  await page.getByRole('button', { name: 'Register' }).click();

  await expect(page.getByText('Registration failed')).toBeVisible();
});

test('login shows loading state while auth request is in flight', async ({
  page,
}) => {
  await page.route('**/api/auth/csrf', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ csrfToken: 'pw-test-token' }),
    });
  });

  await page.route('**/api/auth/callback/credentials**', async route => {
    await new Promise(resolve => setTimeout(resolve, 1_000));
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ok: false,
        status: 401,
        error: 'Invalid credentials',
        url: null,
      }),
    });
  });

  await page.goto('/login');
  await page.getByLabel('Username').fill('pilot_test');
  await page.getByLabel('Password').fill('wrong-pass');
  await page.getByRole('button', { name: 'Login' }).click();

  await expect(
    page.getByRole('button', { name: 'Logging in...' }),
  ).toBeVisible();
});
