# Production Status

> Last verified: **2026-10-26 (Asia/Saigon)**
> This document is the current production-state summary. Operational procedures
> remain in [`back-end/deploy/aws/README.md`](../back-end/deploy/aws/README.md).

## Current topology

```text
Browser
  -> Vercel (toeicgreen.com)
  -> https://api.toeicgreen.com
  -> Hostinger DNS A record
  -> AWS Elastic IPv4
  -> Caddy on one EC2 t4g.small in ap-northeast-1
  -> NestJS API container on the private Compose network
  -> Supabase PostgreSQL / Cloudflare R2 / Resend
```

- The production frontend is hosted by Vercel.
- The production backend is hosted on a single AWS EC2 instance and managed
  through AWS Systems Manager Session Manager. SSH port 22 is not exposed.
- Caddy terminates TLS and proxies both `api.toeicgreen.com` and the retained
  operational hostname `aws-api.toeicgreen.com` to the API container.
- Supabase remains the authoritative PostgreSQL database. Cloudflare R2 stores
  media and Resend delivers application email.
- The single API process uses `THROTTLE_STORAGE=memory`. Upstash/Redis is not a
  runtime dependency in this mode; `REDIS_URL` is retained only for an explicit
  future `THROTTLE_STORAGE=redis` deployment when shared counters are required.
- Production secrets are rendered from AWS SSM Parameter Store into a
  root-readable runtime environment file during deployment. Secrets must never
  be printed or committed.

## Deployed release and verification

The release verified on 2026-10-26 is:

```text
dd5999e7c46b9bc40c56b1644a7c8e21cf01eccb
```

Fresh post-deployment checks confirmed:

- `toeic-green-api` was `healthy` with zero container restarts;
- the API and Caddy containers were running;
- `/api/health/live` returned HTTP 200 with `{"status":"ok"}` on both API
  hostnames;
- `/api/health/ready` returned HTTP 200 with `{"status":"ready"}` on both API
  hostnames;
- the public practice catalog and Practice TOEIC Test 2 detail endpoints
  returned HTTP 200 JSON;
- the production CORS preflight returned HTTP 204 and allowed
  `https://toeicgreen.com`;
- the Practice page and Practice TOEIC Test 2 start page rendered in a real
  browser without console errors;
- new API logs contained no Upstash quota exception or runtime error.

These checks cover infrastructure, public API reads, CORS, and the anonymous
practice flow. They do not replace periodic authenticated end-to-end checks for
registration, login, token refresh, test submission, history, vocabulary,
email, OAuth, or controlled R2 writes.

## Resolved production incidents

### Redis quota outage

The previous Redis-backed global throttler exhausted the Upstash Free command
quota. Because the global guard executed before every controller, the failure
also affected health routes and caused Caddy to return HTTP 503.

The deployed fix makes the throttler storage explicit:

- `memory` is the safe default for the current single-process deployment;
- `redis` remains available for future horizontal scaling;
- health routes bypass throttling;
- readiness checks PostgreSQL in memory mode and adds Redis only in Redis mode.

### Supabase pause during deployment

The Supabase project was paused and reported `INACTIVE`, which removed the
direct database hostname and made the pooler reject the tenant during Prisma
migration. The existing project was restored in place and returned to
`ACTIVE_HEALTHY`; no database migration to a new project was performed.

Free Supabase projects can be paused again after insufficient activity. Treat
`NXDOMAIN`, `tenant not found`, or an `INACTIVE` project status as a provider
state check before rotating credentials or changing connection strings.

## Sources of truth

| Topic | Authoritative file |
|---|---|
| Current production state | This document |
| AWS deploy, verification, rollback, and maintenance | [`back-end/deploy/aws/README.md`](../back-end/deploy/aws/README.md) |
| AWS runtime definitions | [`back-end/deploy/aws/`](../back-end/deploy/aws/) |
| Backend environment contract | [`back-end/.env.example`](../back-end/.env.example) and backend config validation |

## Updating this document

Do not mark production healthy from a successful build or deploy command alone.
Update the date, release SHA, and evidence above only after fresh checks of the
deployed image, container health/restarts, internal and public health routes,
logs, CORS, representative API reads, and browser rendering.
