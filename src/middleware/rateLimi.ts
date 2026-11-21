import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { Request } from 'express';
import { createHash } from 'crypto';

const WINDOW_MS = 15 * 60 * 1000;
const AUTH_LIMIT_MESSAGE = {
  error: 'Too many authentication attempts. Please try again later.',
};

function normalizedEmail(req: Request): string {
  const email = req.body?.email;
  if (typeof email !== 'string') {
    return 'missing-email';
  }

  // Bound attacker-controlled key size before using it in a rate-limit key.
  return email.trim().toLowerCase().slice(0, 320) || 'empty-email';
}

function ipKey(req: Request): string {
  return ipKeyGenerator(req.ip ?? 'unknown');
}

function ipAndEmailKey(req: Request): string {
  return `${ipKey(req)}:${emailKey(req)}`;
}

function emailKey(req: Request): string {
  return createHash('sha256')
    .update(normalizedEmail(req))
    .digest('hex');
}

const authLimiterDefaults = {
  windowMs: WINDOW_MS,
  standardHeaders: 'draft-7' as const,
  legacyHeaders: false,
  message: AUTH_LIMIT_MESSAGE,
};

/** Limits total authentication traffic from one client address. */
export const authIpLimiter = rateLimit({
  ...authLimiterDefaults,
  limit: 30,
  keyGenerator: ipKey,
});

function identityLimiter(limit: number) {
  return rateLimit({
    ...authLimiterDefaults,
    limit,
    keyGenerator: emailKey,
    skipSuccessfulRequests: true,
  });
}

function ipIdentityLimiter(limit: number) {
  return rateLimit({
    ...authLimiterDefaults,
    limit,
    keyGenerator: ipAndEmailKey,
    skipSuccessfulRequests: true,
  });
}

// Each flow has its own identity quota so OTP traffic cannot consume login quota.
export const loginIdentityLimiter = identityLimiter(8);
export const loginIpIdentityLimiter = ipIdentityLimiter(5);
export const registrationIdentityLimiter = identityLimiter(3);
export const registrationIpIdentityLimiter = ipIdentityLimiter(3);
export const otpIdentityLimiter = identityLimiter(5);
export const otpIpIdentityLimiter = ipIdentityLimiter(5);

export const refreshLimiter = rateLimit({
  ...authLimiterDefaults,
  limit: 20,
  keyGenerator: ipKey,
});

export const passwordChangeLimiter = rateLimit({
  ...authLimiterDefaults,
  limit: 5,
  keyGenerator: (req) => {
    const userId = typeof req.user?.id === 'string' ? req.user.id : 'anonymous';
    return `${ipKey(req)}:${userId}`;
  },
  skipSuccessfulRequests: true,
});

/**
 * The in-memory store is suitable for local development and one process.
 * Production deployments with multiple instances should provide a shared
 * store such as Redis so limits apply consistently across instances.
 */
export const apiLimiter = rateLimit({
  windowMs: WINDOW_MS,
  limit: 50,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again later.' },
});