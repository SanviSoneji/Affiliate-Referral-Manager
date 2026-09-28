# Architecture

## Data model

```
users 1───* campaigns 1───* referral_links 1───* clicks
                                   │
                                   └──────────* signups   (UNIQUE link_id + email)
```

- `campaigns.reward_amount` is copied onto each `signups.reward_amount` at signup time, so
  changing a campaign's reward later does not rewrite history.
- Foreign keys use `ON DELETE CASCADE`; indexes exist on every foreign key used in lookups.
- `referral_links.code` is UNIQUE; generation retries on collision.

## Referral flow

1. Owner creates a campaign and generates a link: `GET {API}/r/{code}`.
2. A visitor opens the link. The API checks the campaign is `active`, inserts a row in
   `clicks`, and redirects (302) to `{CLIENT}/join?ref={code}`.
3. The join page loads the campaign name, then submits `POST /api/public/signup`.
4. The API inserts into `signups` with the campaign reward. A duplicate email on the same link
   returns 409.
5. The dashboard aggregates clicks and signups with correlated `COUNT(*)` subqueries;
   conversion rate = signups / clicks, total reward = signups x reward.

## Backend design

- `routes/campaigns.ts`: authenticated CRUD; every query filters by `user_id`, so users cannot
  read or modify each other's data (404 rather than 403 to avoid leaking existence).
- `routes/public.ts`: unauthenticated tracking and signup endpoints.
- `auth.ts`: bcrypt (10 rounds) password hashing, JWT (7 day expiry), `requireAuth` middleware.
- `http.ts`: central error handler mapping `HttpError` and Zod validation errors to JSON responses.
- All SQL uses parameterised queries (no string concatenation of user input).
- `utils.ts` holds pure functions (code generation, conversion maths) covered by unit tests.

## Security notes

- Passwords are never stored in plain text; login returns the same message for unknown email and
  wrong password.
- Set a long random `JWT_SECRET` in production; CORS is restricted to `CLIENT_URL`.
- Known gaps (see README improvements): no rate limiting, no per-visitor click de-duplication.
