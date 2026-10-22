export type ApiErrorDetail = { path: string; message: string };

export class ApiError extends Error {
  status: number;
  code: string;
  details?: ApiErrorDetail[];
  headers?: Record<string, string>;

  constructor(
    status: number,
    code: string,
    message: string,
    options?: { details?: ApiErrorDetail[]; headers?: Record<string, string> }
  ) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = options?.details;
    this.headers = options?.headers;
  }
}

export class ValidationError extends ApiError {
  constructor(details: ApiErrorDetail[]) {
    super(422, "VALIDATION_ERROR", "Validation failed", { details });
  }
}
