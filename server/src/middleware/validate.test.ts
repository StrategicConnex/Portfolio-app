import type { RequestHandler } from 'express';
import { describe, expect, it } from 'vitest';
import { loginSchema, refreshSchema, registerSchema } from '../schemas/auth.schema.js';
import type { ValidatedRequest } from './validate.js';

type RegisterReq = ValidatedRequest<typeof registerSchema>;
type LoginReq = ValidatedRequest<typeof loginSchema>;
type RefreshReq = ValidatedRequest<typeof refreshSchema>;

// Runtime is not the point of this file — `npm run typecheck` is what guards
// the @ts-expect-error assertions below. These tests simply give the compile
// time checks a home and a visible outcome, so the request objects are only
// stubbed enough to keep the runtime from throwing.
describe('ValidatedRequest type-level guarantees', () => {
  it('infers the exact body shape from the schema', () => {
    const req = { body: {} } as RegisterReq;

    // Every field is known at compile time — no casts anywhere.
    const name: string = req.body.name;
    const email: string = req.body.email;
    const password: string = req.body.password;

    expect([name, email, password]).toBeDefined();
  });

  it('rejects access to fields the schema does not declare', () => {
    const req = { body: {}, query: {} } as RegisterReq;

    // @ts-expect-error — registerSchema validates no `query`, so it is `unknown`
    req.query.page;
    // @ts-expect-error — body is fully typed; `age` is not part of the schema
    req.body.age;
  });

  it('rejects a wrong-typed body field', () => {
    const req = { body: { email: '' } } as LoginReq;

    // @ts-expect-error — email is a string, not a number
    const bad: number = req.body.email;
    void bad;
  });

  it('keeps the typed handler assignable to Express RequestHandler', () => {
    // If ValidatedRequest ever diverges from Express's Request, this fails to
    // compile — exactly what keeps route wiring safe.
    const handler: RequestHandler = async (req: RefreshReq) => {
      const token: string = req.body.refreshToken;
      void token;
    };
    expect(typeof handler).toBe('function');
  });
});
