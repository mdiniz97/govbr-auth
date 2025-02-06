export class GovBRAuthError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode?: number,
    public readonly originalError?: Error
  ) {
    super(message);
    this.name = 'GovBRAuthError';
    Error.captureStackTrace(this, this.constructor);
  }
}