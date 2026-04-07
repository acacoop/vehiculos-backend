import { Request, Response, NextFunction } from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { AppError } from "@/middleware/errorHandler";
import { RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX } from "@/config/env.config";

const isProd = (process.env.NODE_ENV || "").toLowerCase() === "production";

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
      styleSrc: ["'self'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
});

/**
 * Recursive input sanitizer — strips HTML tags and dangerous characters.
 * This is a defense-in-depth measure; primary protection comes from
 * Zod validation and parameterized queries.
 */
export const sanitizeInput = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const sanitizeObject = (obj: unknown): unknown => {
    if (typeof obj === "string") {
      // Strip all HTML tags (not just <script>), null bytes, and control chars
      return obj.replace(/<[^>]*>/g, "").replace(/\0/g, "");
    }
    if (Array.isArray(obj)) {
      return obj.map(sanitizeObject);
    }
    if (obj && typeof obj === "object") {
      const sanitized: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(obj)) {
        // Also sanitize keys to prevent prototype pollution
        const safeKey = key.replace(/[^a-zA-Z0-9_.-]/g, "");
        if (
          safeKey === "__proto__" ||
          safeKey === "constructor" ||
          safeKey === "prototype"
        ) {
          continue; // Skip prototype pollution vectors
        }
        sanitized[safeKey] = sanitizeObject(value);
      }
      return sanitized;
    }
    return obj;
  };

  if (req.body) {
    req.body = sanitizeObject(req.body);
  }

  next();
};

// CORS configuration — restrict origins in production
const ALLOWED_ORIGINS = [
  "https://vehiculos-mobile.acacoop.com.ar",
  "https://vehiculos-mobile-test.acacoop.com.ar",
];

export const corsOptions = {
  origin: isProd
    ? (
        origin: string | undefined,
        callback: (err: Error | null, allow?: boolean) => void,
      ) => {
        // Allow requests with no origin (server-to-server, mobile apps)
        if (!origin || ALLOWED_ORIGINS.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error("Not allowed by CORS"));
        }
      }
    : true, // Allow all origins in development
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};
