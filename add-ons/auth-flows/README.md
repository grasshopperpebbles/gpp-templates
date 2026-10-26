# auth-flows add-on

`gpp add auth-flows [--provider resend|sendgrid|ses]` adds email verification and
password reset to a project built from the gpp API packs (`api/fastapi`, `api/express`,
`api/express-mysql`) with a Next.js web app. A Tauri desktop app also gets keychain-backed
auth commands (see "Desktop" below).

## What stays the pack's

Registration and login are the pack's own `POST /api/v1/auth/register` and
`/auth/login`. The add-on does not replace them and adds no second `/register`. Register
still signs the user in and returns tokens. After it answers `201`, the add-on emails the
new user a verification link:

- FastAPI: `SendVerificationEmailOnRegister`, an ASGI middleware added in `app/main.py`.
  It reads the new user's id from the register response.
- Express: the add-on's router is mounted at `/auth` before the pack's router. Its
  `POST /register` handler only watches the response and then calls `next()`.

## Endpoints (under `/api/v1/auth`)

| Method | Path | Body | Answer |
| --- | --- | --- | --- |
| POST | `/verify-email` | `{ token }` | marks the email verified; 400 for an invalid, used or expired token |
| POST | `/resend-verification` | `{ email }` | the same message whether or not the account exists |
| POST | `/forgot-password` | `{ email }` | the same message whether or not the account exists |
| POST | `/reset-password` | `{ token, password }` | sets the password; 400 for an invalid, used or expired token |
| GET | `/verification-status` | Bearer access token | `{ email, email_verified, email_verified_at }` |

Responses use each pack's own format. FastAPI returns `{ message }` or
`{ detail }`. Express returns `{ success: true, data: {...} }` or
`{ success: false, error: { message } }`.

## Verification policy

Unverified users can still sign in, because the pack's login is not changed. The
add-on adds `users.email_verified_at` (FastAPI `email_verified_at`, Prisma
`emailVerifiedAt`). Routes that need a verified address use:

- FastAPI: `Depends(require_verified_email)` from `app.api.v1.endpoints.auth_flows`.
- Express: `authenticate, requireVerifiedEmail` from
  `src/middleware/verified-email.middleware.ts`.

Both answer 403 until the user has verified. The add-on has no setting that blocks
unverified logins, because that would mean rewriting the pack's login. If you want that
behaviour, add a check for `email_verified_at` / `emailVerifiedAt` to your login
handler. A successful password reset also marks the email verified, because the link
reached the user's inbox.

## Tokens and security

- A token is `<id>.<secret>`, where the secret is 32 random bytes (base64url). Only a
  SHA-256 hash of the secret is stored, in `auth_flow_tokens.token_hash`. The id finds
  the row, and the hash is compared in constant time.
- Tokens are single use. A conditional update marks the token used, so if two requests
  race, one fails. Verification links expire after `EMAIL_VERIFICATION_EXPIRE_HOURS`
  (default 24) and reset links after `PASSWORD_RESET_EXPIRE_MINUTES` (default 60).
- Issuing a new token retires the user's earlier unused tokens of the same kind. A
  successful reset retires every other outstanding reset link.
- `forgot-password` and `resend-verification` give the same answer for unknown emails,
  and the email goes out after the response.
- Express: a reset revokes all of the user's refresh tokens (`refresh_tokens.revoked_at`),
  and also `refresh_token_families` on pack versions that have that table. The user is
  signed out everywhere, although access tokens stay valid until they expire
  (`JWT_EXPIRES_IN`).
- FastAPI: the pack's refresh tokens are stateless JWTs, so a reset cannot revoke them.
  They stay valid until `REFRESH_TOKEN_EXPIRE_DAYS`. If you need sign-out-everywhere,
  add a server-side token list or a per-user token version.
- **Rate limiting is not included.** Before going live, put limits per IP and per email
  on `forgot-password`, `resend-verification`, `verify-email` and `reset-password`. You
  can do this at your proxy or CDN, or with `slowapi` (FastAPI) or `express-rate-limit`
  (Express). These endpoints send email and accept guesses.

## Email

Set `EMAIL_PROVIDER` to `console`, `resend`, `sendgrid` or `ses`. When it is unset, the
add-on uses `console` in development. Console mode logs each email, link included, to the
API's output, so the flows work without any keys. Outside development it uses the
provider you chose at install time. Development means FastAPI `ENVIRONMENT=development`
/ `dev` / `local` / `test` or `DEBUG=true`, and Express anything but
`NODE_ENV=production`. Test runs always use console. In production, console mode refuses
to log links.

- Resend: `RESEND_API_KEY`. The add-on calls the HTTP API and needs no SDK.
- SendGrid: `SENDGRID_API_KEY`. The add-on calls the HTTP API and needs no SDK.
- SES: AWS credentials (or an IAM role) and `AWS_REGION`. The installer adds `boto3`
  (FastAPI) or `@aws-sdk/client-ses` (Express).

Other settings: `EMAIL_FROM`, and `APP_URL` (the web app's base URL; links point to
`{APP_URL}/verify-email?token=…` and `/reset-password?token=…`). The installer appends
all of them to the API's `.env.example`.

## Database

- FastAPI: `alembic/versions/auth_flows_0001.py` adds `users.email_verified_at` and
  `auth_flow_tokens`. The installer points its `down_revision` at the project's current
  Alembic head(s). Run `alembic upgrade head` (in Docker:
  `docker compose exec <api> alembic upgrade head`). The installer also adds
  `email_verified_at` to `app/db/models/user.py` and imports the token model in
  `app/db/models/__init__.py`.
- Express: the installer adds `emailVerifiedAt` and `authFlowTokens` to `model User` in
  `prisma/schema.prisma`, appends `model AuthFlowToken`, and writes
  `prisma/migrations/<timestamp>_auth_flows/migration.sql`. The SQL is for PostgreSQL
  or MySQL, matching the datasource, and the migration is dated after the existing ones.
  Run `npx prisma generate && npx prisma migrate deploy`. Other Prisma providers get a
  manual step instead.

## Web (Next.js)

- Pages: `/verify-email` (verifies the token from the link), `/forgot-password` and
  `/reset-password`. Link `/forgot-password` from your login page.
- Proxy routes `src/app/api/auth/{verify-email,resend-verification,forgot-password,reset-password,verification-status}`
  call `{API_URL}/auth/...`. They use `API_URL`, `INTERNAL_API_URL` or
  `NEXT_PUBLIC_API_BASE_URL`, including `/api/v1`, like `src/lib/auth-config.ts`. Errors
  from both packs, including FastAPI's 422 lists and Express's
  `error.message`/validation details, are turned into one `{ error: string }`.
- `VerifyEmailBanner` is a server component that shows "please verify your email" with a
  resend button while the address is unverified. In `nextjs-saas-dashboard` the installer
  adds it to `src/app/(dashboard)/layout.tsx`. For other layouts it prints the line to
  add.
- The pack's own register form is not changed. After registering, it signs the user in
  and the banner takes over.

## Installer behaviour

- Files are copied only where they don't exist yet, so re-running keeps your edits and
  changes nothing.
- Each wiring edit (API router, `main.py` middleware, User column, models import,
  Prisma schema, Express router mount, `.env.example`) looks for the pack's code first.
  If the code isn't there, it changes nothing and prints the exact lines to add.
- The FastAPI part ships `tests/test_auth_flows.py`, which runs with the pack's pytest
  suite (in-memory SQLite, no services).

## Desktop

The desktop part is Tauri-only: `src-tauri/src/auth.rs` with keyring 3, `src/lib/auth.ts`,
and `LoginForm` / `RegisterForm`. They call the pack's `/auth/login` and `/auth/register`.
Electron apps are skipped.
