import { z } from "zod";

// ============================================
// Query Parameters for Metrics Endpoints
// ============================================

// Dynamic bucket configuration
export const BucketConfigSchema = z.object({
  bucketSize: z.coerce.number().min(1).optional(),
  maxBuckets: z.coerce.number().min(1).max(20).default(10),
  minBucketsToShow: z.coerce.number().min(1).max(20).default(5), // Minimum buckets to display (fills with empty if needed)
});

// Kilometers metrics query
export const KilometersMetricsQuerySchema = BucketConfigSchema.extend({
  bucketSize: z.coerce.number().min(1000).default(20000), // Default: 20,000 km buckets
});

// Age metrics query
export const AgeMetricsQuerySchema = BucketConfigSchema.extend({
  bucketSize: z.coerce.number().min(1).default(1), // Default: 1 year buckets
});

// Timeline metrics query (for reservations, maintenance, etc.)
export const TimelineMetricsQuerySchema = z.object({
  months: z.coerce.number().min(1).max(36).default(12),
});

// Quarterly control status query
export const QuarterlyControlMetricsQuerySchema = z.object({
  periods: z.coerce.number().min(1).max(20).default(8), // Default: last 8 quarters (2 years)
});

// Distribution metrics query (for fuel type, brand, etc.)
export const DistributionMetricsQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(50).optional(), // Optional limit for top N results
});

// ============================================
// Response Types
// ============================================

// Generic bucket response
export const BucketSchema = z.object({
  label: z.string(),
  min: z.number(),
  max: z.number().nullable(), // null for "X or more" bucket
  count: z.number(),
});

export const BucketListSchema = z.array(BucketSchema);

// Distribution response (for fuel type, brand, etc.)
export const DistributionItemSchema = z.object({
  id: z.string().nullable(), // null for "unspecified"
  name: z.string(),
  count: z.number(),
});

export const DistributionListSchema = z.array(DistributionItemSchema);

// Timeline response
export const TimelineItemSchema = z.object({
  month: z.string(), // "YYYY-MM"
  count: z.number(),
});

export const TimelineSchema = z.array(TimelineItemSchema);

// Quarterly control aggregation
export const QuarterlyControlMetricSchema = z.object({
  year: z.number(),
  quarter: z.number(),
  label: z.string(), // "2025-Q1"
  total: z.number(),
  aprobados: z.number(),
  pendientes: z.number(),
  rechazados: z.number(),
  vencidos: z.number(),
});

export const QuarterlyControlMetricsSchema = z.array(
  QuarterlyControlMetricSchema,
);

// Personnel metrics
export const PersonnelMetricSchema = z.object({
  totalActual: z.number(),
  timeline: TimelineSchema,
});

// ============================================
// Type Exports
// ============================================

export type BucketConfig = z.infer<typeof BucketConfigSchema>;
export type KilometersMetricsQuery = z.infer<
  typeof KilometersMetricsQuerySchema
>;
export type AgeMetricsQuery = z.infer<typeof AgeMetricsQuerySchema>;
export type TimelineMetricsQuery = z.infer<typeof TimelineMetricsQuerySchema>;
export type QuarterlyControlMetricsQuery = z.infer<
  typeof QuarterlyControlMetricsQuerySchema
>;

export type Bucket = z.infer<typeof BucketSchema>;
export type BucketList = z.infer<typeof BucketListSchema>;
export type DistributionItem = z.infer<typeof DistributionItemSchema>;
export type DistributionList = z.infer<typeof DistributionListSchema>;
export type TimelineItem = z.infer<typeof TimelineItemSchema>;
export type Timeline = z.infer<typeof TimelineSchema>;
export type QuarterlyControlMetric = z.infer<
  typeof QuarterlyControlMetricSchema
>;
export type QuarterlyControlMetrics = z.infer<
  typeof QuarterlyControlMetricsSchema
>;
export type PersonnelMetric = z.infer<typeof PersonnelMetricSchema>;
