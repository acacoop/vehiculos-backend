import { Request, Response, NextFunction } from "express";
import { ZodError, ZodSchema } from "zod";

// RFC 7807 Problem Details interface
interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  detail?: string;
  instance?: string;
  // Additional extension members
  [key: string]:
    | string
    | number
    | boolean
    | undefined
    | Record<string, unknown>
    | Array<unknown>;
}

// Custom error class with RFC 7807 support
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;
  public type?: string;
  public title?: string;

  constructor(
    message: string,
    statusCode: number,
    type?: string,
    title?: string,
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.type = type;
    this.title = title;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Helper function to create RFC 7807 compliant problem details
const createProblemDetails = (
  status: number,
  title: string,
  detail?: string,
  type?: string,
  instance?: string,
  extensions?: Record<string, unknown>,
): ProblemDetails => {
  const problem: ProblemDetails = {
    type: type || `https://httpstatuses.com/${status}`,
    title,
    status,
  };

  if (detail) problem.detail = detail;
  if (instance) problem.instance = instance;
  if (extensions) Object.assign(problem, extensions);

  return problem;
};

export const globalErrorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  res.set("Content-Type", "application/problem+json");

  // Handle JSON parsing errors (from body-parser)
  if (
    err instanceof SyntaxError &&
    req.headers["content-type"]?.includes("application/json")
  ) {
    const problem = createProblemDetails(
      400,
      "Invalid JSON",
      "The request body contains invalid JSON. Please ensure your JSON is properly formatted without trailing commas or syntax errors.",
      "https://example.com/problems/invalid-json",
      req.originalUrl,
      {
        hint: "Common issues: trailing commas, missing quotes, invalid escape sequences",
        contentType: req.headers["content-type"],
      },
    );
    res.status(400).json(problem);
    return;
  }

  if (err instanceof AppError) {
    const problem = createProblemDetails(
      err.statusCode,
      err.title || getDefaultTitle(err.statusCode),
      err.message,
      err.type,
      req.originalUrl,
    );
    res.status(err.statusCode).json(problem);
    return;
  }

  if (err instanceof ZodError) {
    const problem = createProblemDetails(
      400,
      "Validation Failed",
      "The request contains invalid data",
      "https://example.com/problems/validation-error",
      req.originalUrl,
      {
        errors: err.errors.map((e) => ({
          field: e.path.join("."),
          message: e.message,
          code: e.code,
        })),
      },
    );
    res.status(400).json(problem);
    return;
  }

  console.error("Unexpected error:", err);
  const problem = createProblemDetails(
    500,
    "Internal Server Error",
    "An unexpected error occurred while processing your request",
    "https://example.com/problems/internal-server-error",
    req.originalUrl,
  );
  res.status(500).json(problem);
};

const getDefaultTitle = (statusCode: number): string => {
  const titles: Record<number, string> = {
    400: "Bad Request",
    401: "Unauthorized",
    403: "Forbidden",
    404: "Not Found",
    409: "Conflict",
    422: "Unprocessable Entity",
    429: "Too Many Requests",
    500: "Internal Server Error",
  };
  return titles[statusCode] || "Error";
};

type AsyncFunction = (
  req: Request,
  res: Response,
  next: NextFunction,
) => Promise<void>;

export const asyncHandler = (fn: AsyncFunction) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Validation middleware factory
export const validateSchema = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      next(error);
    }
  };
};
