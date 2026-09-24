import { test, expect } from '@playwright/test';

/**
 * Contact API contract (POST /api/contact).
 *
 * The contact form UI was removed from the site, but the route is kept as
 * the contact channel backend. These tests lock its validation shape using
 * only invalid payloads — a valid payload would reach Resend, which is
 * never acceptable from tests.
 */
test.describe('Contact API route — contract', () => {
  test('rejects an empty payload with field errors', async ({ request }) => {
    const res = await request.post('/api/contact', { data: {} });
    expect(res.status()).toBe(400);

    const body = await res.json();
    expect(body.error).toBeDefined();
    // The route replies with `details` = zod's flattened field errors map.
    expect(Array.isArray(body.details?.name)).toBe(true);
    expect(Array.isArray(body.details?.email)).toBe(true);
    expect(Array.isArray(body.details?.message)).toBe(true);
  });

  test('rejects an invalid email with a specific field error', async ({ request }) => {
    const res = await request.post('/api/contact', {
      data: { name: 'Juan Test', email: 'not-an-email', message: 'Hola' },
    });
    expect(res.status()).toBe(400);

    const body = await res.json();
    expect(Array.isArray(body.details?.email)).toBe(true);
    // The other fields are valid, so no other field errors should be present.
    expect(body.details?.name).toBeUndefined();
    expect(body.details?.message).toBeUndefined();
  });
});
