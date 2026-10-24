import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { z } from 'zod';
import { ValidationError } from '../utils/errors.js';

/**
 * A `z.object` schema that validates the request's `body`, `query`, and/or
 * `params`. Fields may be omitted when the route doesn't validate them.
 */
export type RouteSchema = z.ZodType & {
  shape: {
    body?: z.ZodType;
    query?: z.ZodType;
    params?: z.ZodType;
  };
};

/**
 * Fully typed request for a handler whose route is guarded by `TSchema`.
 * Each field is inferred from the schema with `z.infer` (the parsed output,
 * including transformations like `.trim()`/`.toLowerCase()`), so controllers
 * read `req.body` with zero casts. Fields the schema doesn't validate resolve
 * to `unknown`. Intersecting with `Omit<Request, …>` keeps the rest of the
 * Express request surface (`headers`, `req.user`, …).
 */
export type ValidatedRequest<TSchema extends RouteSchema> = Omit<
  Request,
  'body' | 'query' | 'params'
> & {
  body: z.infer<TSchema['shape']['body']>;
  query: z.infer<TSchema['shape']['query']>;
  params: z.infer<TSchema['shape']['params']>;
};

/**
 * Zod validation middleware (skill: middleware/validation pattern).
 * Parses `{ body, query, params }` against the schema; on failure it raises a
 * ValidationError with flattened field errors, on success it writes the parsed
 * (and transformed) data back onto the request so handlers read typed values.
 */
export function validate<TSchema extends RouteSchema>(schema: TSchema): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    if (!result.success) {
      next(
        new ValidationError(
          'Validation failed',
          result.error.flatten().fieldErrors,
        ),
      );
      return;
    }

    // Output of an unconstrained generic is `unknown`; re-establish the typed
    // shape via z.infer, matching what handlers declare on their request.
    const data = result.data as ValidatedRequest<TSchema>;

    // zod strips keys the schema doesn't declare, so only overwrite the
    // request fields that were actually validated.
    if (Object.hasOwn(data, 'body')) req.body = data.body;
    if (Object.hasOwn(data, 'query')) (req.query as unknown) = data.query;
    if (Object.hasOwn(data, 'params')) (req.params as unknown) = data.params;

    next();
  };
}
