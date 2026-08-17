import { test, expect, type Page } from '@playwright/test';

/**
 * Contact form flow (ContactForm.tsx → POST /api/contact).
 *
 * The form is language-aware via the language seam (cookie drives SSR,
 * localStorage drives hydration), so UI assertions run in both languages.
 *
 * Network strategy:
 * - Form submission tests mock /api/contact with page.route() so no real
 *   email is ever sent and the success/error branches are deterministic.
 * - API contract tests hit the real route with the `request` fixture
 *   (browser-independent) to lock in the 400 validation shape. They use
 *   only invalid payloads — a valid payload would reach Resend, which is
 *   never acceptable from tests.
 */

const LANGS = ['es', 'en'] as const;
type Lang = (typeof LANGS)[number];

const TEXTS: Record<
  Lang,
  {
    nameLabel: string;
    emailLabel: string;
    companyLabel: string;
    typeLabel: RegExp;
    typeOption: string;
    messageLabel: string;
    send: string;
    errName: string;
    errEmail: string;
    errType: string;
    errMessage: string;
    success: string;
    successMsg: string;
    errTitle: string;
    errMsg: string;
    retry: string;
  }
> = {
  es: {
    nameLabel: 'Nombre Completo',
    emailLabel: 'Email Corporativo',
    companyLabel: 'Empresa / Organización',
    typeLabel: /Tipo de proyecto/,
    typeOption: 'Auditoría de Seguridad OT/IT',
    messageLabel: 'Mensaje / Requerimiento Técnico',
    send: 'Enviar Protocolo de Contacto',
    errName: 'El nombre es obligatorio',
    errEmail: 'Ingresá un email válido',
    errType: 'Seleccioná un tipo de proyecto',
    errMessage: 'El mensaje es obligatorio',
    success: '¡Mensaje enviado!',
    successMsg: 'Respondo en menos de 24 horas hábiles.',
    errTitle: 'Error al enviar',
    errMsg: 'Hubo un problema al enviar el mensaje.',
    retry: 'Volver a intentar',
  },
  en: {
    nameLabel: 'Full Name',
    emailLabel: 'Corporate Email',
    companyLabel: 'Company / Organization',
    typeLabel: /Project type/,
    typeOption: 'OT/IT Security Audit',
    messageLabel: 'Message / Technical Requirement',
    send: 'Send Contact Protocol',
    errName: 'Name is required',
    errEmail: 'Enter a valid email',
    errType: 'Select a project type',
    errMessage: 'Message is required',
    success: 'Message Sent!',
    successMsg: 'I respond in less than 24 business hours.',
    errTitle: 'Error sending',
    errMsg: 'There was a problem sending your message.',
    retry: 'Try again',
  },
};

/** Pin both sides of the language seam so SSR and hydration agree. */
async function setLanguage(page: Page, lang: Lang) {
  await page.context().addCookies([
    { name: 'portfolio_lang', value: lang, domain: 'localhost', path: '/' },
  ]);
  await page.context().addInitScript(
    (l) => localStorage.setItem('portfolio_lang', l),
    lang,
  );
}

/** Fill every field with valid values. */
async function fillValidForm(page: Page, lang: Lang) {
  await page.getByLabel(TEXTS[lang].nameLabel).fill('Juan Test');
  await page.getByLabel(TEXTS[lang].emailLabel).fill('juan@example.com');
  await page.getByLabel(TEXTS[lang].companyLabel).fill('TestCorp');
  await page
    .getByLabel(TEXTS[lang].typeLabel)
    .selectOption({ label: TEXTS[lang].typeOption });
  await page.getByLabel(TEXTS[lang].messageLabel).fill('Necesito una auditoría de seguridad OT.');
}

test.describe('Contact form — client-side validation', () => {
  for (const lang of LANGS) {
    test.describe(`language: ${lang}`, () => {
      test.beforeEach(async ({ page }) => {
        await setLanguage(page, lang);
      });

      test(`empty submission shows required-field errors and never calls the API (${lang})`, async ({
        page,
      }) => {
        let apiCalls = 0;
        await page.route('**/api/contact', async (route) => {
          apiCalls++;
          await route.fulfill({
            status: 500,
            contentType: 'application/json',
            body: JSON.stringify({ error: 'should not be called' }),
          });
        });

        await page.goto('/');
        await page.getByRole('button', { name: TEXTS[lang].send }).click();

        await expect(page.getByText(TEXTS[lang].errName)).toBeVisible();
        await expect(page.getByText(TEXTS[lang].errEmail)).toBeVisible();
        await expect(page.getByText(TEXTS[lang].errType)).toBeVisible();
        await expect(page.getByText(TEXTS[lang].errMessage)).toBeVisible();
        expect(apiCalls).toBe(0);
      });

      test(`invalid email shows the email error only (${lang})`, async ({ page }) => {
        let apiCalls = 0;
        await page.route('**/api/contact', async (route) => {
          apiCalls++;
          await route.fulfill({ status: 500, body: 'unexpected' });
        });

        await page.goto('/');
        await page.getByLabel(TEXTS[lang].nameLabel).fill('Juan Test');
        await page.getByLabel(TEXTS[lang].emailLabel).fill('not-an-email');
        await page
          .getByLabel(TEXTS[lang].typeLabel)
          .selectOption({ label: TEXTS[lang].typeOption });
        await page.getByLabel(TEXTS[lang].messageLabel).fill('Hola');
        await page.getByRole('button', { name: TEXTS[lang].send }).click();

        await expect(page.getByText(TEXTS[lang].errEmail)).toBeVisible();
        await expect(page.getByText(TEXTS[lang].errName)).toHaveCount(0);
        await expect(page.getByText(TEXTS[lang].errType)).toHaveCount(0);
        await expect(page.getByText(TEXTS[lang].errMessage)).toHaveCount(0);
        expect(apiCalls).toBe(0);
      });
    });
  }
});

test.describe('Contact form — submission against mocked API', () => {
  for (const lang of LANGS) {
    test.describe(`language: ${lang}`, () => {
      test.beforeEach(async ({ page }) => {
        await setLanguage(page, lang);
      });

      test(`valid submission posts the right payload and shows success (${lang})`, async ({
        page,
      }) => {
        let captured: Record<string, unknown> | null = null;
        await page.route('**/api/contact', async (route) => {
          captured = route.request().postDataJSON();
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ success: true, id: 'test-id' }),
          });
        });

        await page.goto('/');
        await fillValidForm(page, lang);
        await page.getByRole('button', { name: TEXTS[lang].send }).click();

        await expect(page.getByText(TEXTS[lang].success)).toBeVisible();
        await expect(page.getByText(TEXTS[lang].successMsg)).toBeVisible();

        expect(captured).toEqual({
          name: 'Juan Test',
          email: 'juan@example.com',
          company: 'TestCorp',
          type: 'contact.type.audit',
          message: 'Necesito una auditoría de seguridad OT.',
        });
      });

      test(`server error shows the error state and retry restores the form (${lang})`, async ({
        page,
      }) => {
        await page.route('**/api/contact', async (route) => {
          await route.fulfill({
            status: 500,
            contentType: 'application/json',
            body: JSON.stringify({ error: 'Error al enviar el email' }),
          });
        });

        await page.goto('/');
        await fillValidForm(page, lang);
        await page.getByRole('button', { name: TEXTS[lang].send }).click();

        await expect(page.getByText(TEXTS[lang].errTitle)).toBeVisible();
        await expect(page.getByText(TEXTS[lang].errMsg)).toBeVisible();

        await page.getByRole('button', { name: TEXTS[lang].retry }).click();
        await expect(page.getByRole('button', { name: TEXTS[lang].send })).toBeVisible();
        await expect(page.getByLabel(TEXTS[lang].nameLabel)).toBeVisible();
      });
    });
  }
});

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
