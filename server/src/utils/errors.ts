/**
 * AppError hierarchy — the single taxonomy for every error the API can raise.
 * The global error handler maps these to HTTP responses, so controllers and
 * services only ever `throw` domain-meaningful errors.
 */
export class AppError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number = 500,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Validation failed', details?: unknown) {
    super(message, 400, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409);
  }
}

export class TooManyRequestsError extends AppError {
  constructor(
    message = 'Too many requests, please try again later.',
    public readonly retryAfterSeconds?: number,
  ) {
    super(message, 429);
  }
}
