Critical Security Assessment of Auth Setup
Overview
Your auth setup follows common patterns but has several critical and medium severity issues that should be addressed, especially for a production deployment.
🔴 CRITICAL Issues

1. Hardcoded Default JWT Secret
   config.tsLine 15
   jwtSecret: process.env.JWT_SECRET || 'druzi-secret-change-in-production',
   Problem: If JWT_SECRET env var is not set, anyone can forge valid tokens using this known default.
   Fix: Fail to start if JWT_SECRET is not set in production:
   jwtSecret: process.env.JWT_SECRET || (process.env.NODE_ENV === 'production' ? (() => { throw new Error('JWT_SECRET must be set in production'); })() : 'dev-only-secret'),
2. Hardcoded Default Admin Invite Code
   config.tsLine 31
   initialInviteCode: process.env.INITIAL_INVITE_CODE || 'DRUZI2025',
   Problem: Anyone knowing this code can register as the first user. Combined with hardcoded admin username, this is exploitable.
3. No Rate Limiting on Auth Endpoints
   Your /login and /register endpoints have no rate limiting, enabling:
   Brute force password attacks
   Credential stuffing
   Denial of service
   Fix: Add rate limiting middleware (e.g., express-rate-limit):
   import rateLimit from 'express-rate-limit';const authLimiter = rateLimit({ windowMs: 15 _ 60 _ 1000, // 15 minutes max: 5, // 5 attempts per window message: { error: 'Too many attempts, try again later' },});router.post('/login', authLimiter, async (req, res) => { ... });
4. Token in localStorage (XSS Vulnerable)
   AuthContext.tsxLine 52
   localStorage.setItem(AUTH_TOKEN_KEY, token);
   Problem: Any XSS vulnerability allows attackers to steal tokens. localStorage is accessible to any JavaScript on the page.
   Better: Use HTTP-only cookies (not accessible via JavaScript).
   🟠 Medium Severity Issues
5. No Token Revocation/Blacklist
   Problem: If a token is compromised, there's no way to invalidate it before expiry (30 days!). Users can't "log out everywhere."
   Fix: Either:
   Store a token version/generation in the database, increment on password change
   Maintain a blacklist of revoked tokens
   Use shorter token expiry with refresh tokens
6. 30-Day Token Expiry is Too Long
   config.tsLine 16
   jwtExpiresIn: '30d',
   Problem: Stolen tokens remain valid for a month.
   Better: Use short-lived access tokens (15 min - 1 hour) + refresh tokens.
7. Username-Based Admin Check
   admin.tsLine 14
   if (req.user.username !== config.adminUsername) {
   Problem: Admin is determined by username string match, not a database flag. If someone registers as "admin" before the intended admin, they get admin access.
   Better: Add an isAdmin boolean column to the users table.
8. Weak Password Policy
   auth.tsLines 29-30
   if (password.length < 6) { res.status(400).json({ error: 'Password must be at least 6 characters' });
   Problem: 6 characters is weak by modern standards.
   Better: Require 8+ characters, or better yet, check against common password lists (e.g., zxcvbn library).
9. No Account Lockout
   After failed login attempts, there's no lockout mechanism. Combined with no rate limiting, this enables unlimited brute force attacks.
   🟡 Minor Issues / Improvements
10. Timing Attack on Login
    auth.service.tsLines 99-107
    if (!user) { throw new Error('Invalid username or password'); } const valid = await verifyPassword(password, user.passwordHash); if (!valid) { throw new Error('Invalid username or password');
    Problem: If user doesn't exist, response is faster (no bcrypt comparison). Attackers can enumerate valid usernames.
    Fix: Always run bcrypt comparison:
    const user = await db.query.users.findFirst({ ... });const dummyHash = '$2b$12$dummy.hash.for.timing.attack.prevention';const valid = await verifyPassword(password, user?.passwordHash || dummyHash);if (!user || !valid) { throw new Error('Invalid username or password');}
11. No HTTPS Enforcement
    Token transmission over HTTP would expose credentials in transit.
12. Missing Security Headers
    No helmet middleware for security headers (CSP, X-Frame-Options, etc.).
    ✅ What You're Doing Right
    Good Practice Implementation
    bcrypt with 12 rounds ✅ Solid password hashing
    JWT for stateless auth ✅ Standard approach
    Password hash excluded from responses ✅ { passwordHash: \_, ...safeUser }
    Username case normalization ✅ username.toLowerCase()
    Invite-only registration ✅ Good for private apps
    Input validation ✅ Username format/length checks
    Priority Fixes (in order)
    Require JWT_SECRET in production - Trivial fix, critical impact
    Add rate limiting - Install express-rate-limit
    Switch to HTTP-only cookies - Eliminates XSS token theft
    Add admin flag to database - Not username-based
    Implement token refresh - Shorter access token life
    Add helmet middleware - Security headers
    Would you like me to help implement any of these fixes?
