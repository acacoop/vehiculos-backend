import { Request, Response, NextFunction } from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { AppError } from "./errorHandler";
import { RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX } from "../config/env.config";

export const rateLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: RATE_LIMIT_MAX,
  message: {
    type: "https://example.com/problems/rate-limit-exceeded",
    title: "Too Many Requests",
    status: 429,
    detail: "Rate limit exceeded. Please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req: Request, _res: Response) => {
    throw new AppError(
      "Rate limit exceeded. Please try again later.",
      429,
      "https://example.com/problems/rate-limit-exceeded",
      "Too Many Requests",
    );
  },
});

export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
});

export const sanitizeInput = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const sanitizeObject = (obj: unknown): unknown => {
    if (typeof obj === "string") {
      return obj
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
        .replace(/[<>]/g, "");
    }
    if (obj && typeof obj === "object") {
      Object.keys(obj).forEach((key) => {
        (obj as Record<string, unknown>)[key] = sanitizeObject(
          (obj as Record<string, unknown>)[key],
        );
      });
    }
    return obj;
  };

  if (req.body) {
    req.body = sanitizeObject(req.body);
  }

  next();
};

// CORS configuration
export const corsOptions = {
  // origin: process.env.NODE_ENV === 'production'
  //   ? ['https://yourdomain.com'] // Configure your actual domains in production
  //   : true, // Allow all origins in development
  origin: true, // Allow all origins (adjust as needed for production)
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};
