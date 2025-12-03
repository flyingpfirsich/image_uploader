import { Request, Response, NextFunction } from 'express';

/**
 * Middleware to enforce HTTPS in production.
 * Redirects HTTP requests to HTTPS and sets HSTS header.
 */
export function httpsEnforcement(req: Request, res: Response, next: NextFunction): void {
  // Skip in development
  if (process.env.NODE_ENV !== 'production') {
    next();
    return;
  }

  // Check if request is already HTTPS
  // x-forwarded-proto is set by reverse proxies (nginx, load balancers, etc.)
  const isHttps = req.secure || req.headers['x-forwarded-proto'] === 'https';

  if (!isHttps) {
    // Redirect to HTTPS
    const httpsUrl = `https://${req.headers.host}${req.url}`;
    res.redirect(301, httpsUrl);
    return;
  }

  // Set HSTS header to enforce HTTPS for future requests
  // max-age=31536000 = 1 year
  // includeSubDomains ensures all subdomains also use HTTPS
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

  next();
}
