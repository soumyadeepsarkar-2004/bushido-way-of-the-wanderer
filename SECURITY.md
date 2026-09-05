# Security Policy

## Reporting a Vulnerability

Please report security vulnerabilities by opening a private issue on GitHub.

## Current Status

- No known vulnerabilities
- CSP headers configured in `index.html` and `vercel.json`
- All dependencies audited via `npm audit`
- No secrets in client-side code
- Service worker served from same origin
- Input validation on all game systems

## Security Headers

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- `Content-Security-Policy` — strict default

## Dependencies

- `three` — 3D rendering (well-maintained, audited)
- `simplex-noise` — Procedural noise (minimal attack surface)
- `vite` — Build tool (no runtime)
- `vite-plugin-checker` — Type checking only (build-time)

## Notes

This is a client-side game — no server, no database, no API calls. All game state is local. External services (GA4, Sentry) are optional and configured via environment variables.
