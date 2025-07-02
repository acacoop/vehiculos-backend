import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { AppError } from './errorHandler';

// Rate limiting using express-rate-limit
export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    type: 'https://example.com/problems/rate-limit-exceeded',
    title: 'Too Many Requests',
    status: 429,
    detail: 'Rate limit exceeded. Please try again later.',
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  handler: (_req: Request, _res: Response) => {
    throw new AppError(
      'Rate limit exceeded. Please try again later.',
      429,
      'https://example.com/problems/rate-limit-exceeded',
      'Too Many Requests'
    );
  },
});

// Security headers using helmet
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

// Input sanitization
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  // Remove potential XSS characters from strings
  const sanitizeObject = (obj: unknown): unknown => {
    if (typeof obj === 'string') {
      return obj.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                .replace(/[<>]/g, '');
    }
    if (obj && typeof obj === 'object') {
      Object.keys(obj).forEach(key => {
        (obj as Record<string, unknown>)[key] = sanitizeObject((obj as Record<string, unknown>)[key]);
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
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://yourdomain.com'] // Configure your actual domains
    : ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:8081'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};
