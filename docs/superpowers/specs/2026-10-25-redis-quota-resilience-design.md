# Redis quota resilience design

## Context

Production runs a single NestJS API container on one EC2 instance behind Caddy.
The global Nest throttler currently stores counters in Upstash Redis. Upstash has
rejected commands after the Free database reached `500002/500000` monthly
commands. Because the throttler guard runs before every controller, this also
turns the dependency-free liveness route into HTTP 500. Caddy then withdraws the
API upstream and the frontend receives HTTP 503 / `Failed to fetch`.

Upstash does not bill operational `PING` commands. The repeated health requests
still traverse the global Redis-backed throttler and therefore execute its Lua
rate-limit command before reaching the health controller. The design must remove
that coupling rather than merely replace the exhausted Redis account.

## Goals

- Restore API availability on the current single-instance EC2 deployment without
  depending on an Upstash Free command budget.
- Preserve request throttling and route-specific rate limits.
- Keep Redis-backed throttling available for a future multi-instance deployment.
- Make liveness independent of PostgreSQL, Redis, authentication, and throttling.
- Make readiness check only dependencies required by the selected runtime mode.
- Cover the outage with automated regression tests and verify locally without
  running Docker.

## Non-goals

- Moving business data, sessions, test content, or users between databases.
- Replacing PostgreSQL or R2.
- Redesigning authentication or application endpoints.
- Automatically changing AWS SSM parameters or deploying to production.

## Selected design

### Throttler storage mode

Add `THROTTLE_STORAGE` with two accepted values:

- `memory` (default): use the built-in NestJS in-process throttler storage.
- `redis`: use the existing Upstash/ioredis storage.

The current single EC2 instance will run in `memory` mode, so all requests remain
rate-limited but Redis is not a runtime dependency. Future horizontal scaling can
explicitly choose `redis` to share counters between instances.

Production environment validation will require `REDIS_URL` only when
`THROTTLE_STORAGE=redis`. Invalid storage values fail startup with a clear error.
Existing Redis credentials may remain stored in AWS, but memory mode must not
create an ioredis client or send commands.

### Health semantics

Apply `@SkipThrottle()` to `HealthController` so both health routes bypass the
global rate limiter.

- `/api/health/live` remains dependency-free and returns `{ "status": "ok" }`
  whenever the Nest process can serve HTTP.
- `/api/health/ready` always verifies PostgreSQL. It verifies Redis only in
  `redis` throttler mode, because Redis is not required in memory mode.

Docker and Caddy can continue using readiness. In memory mode the checks no
longer consume Redis rate-limit commands and still prevent routing to an API that
cannot reach its primary database.

### Configuration boundary

Create one typed configuration decision for the storage mode and reuse it in the
throttler factory and health service. Avoid parallel parsing rules that could
make the guard use memory while readiness still treats Redis as mandatory.

Document `THROTTLE_STORAGE=memory` in the example environment and AWS runbook.
The AWS environment renderer does not need a new secret because this value is
non-sensitive; the deployed environment can rely on the safe single-instance
default or later receive an explicit value through the deployment configuration.

## Error handling and security

- Memory mode is fail-operational for an Upstash outage, not fail-open: Nest's
  built-in throttler still enforces the same global and route-specific limits.
- Counters reset when the API container restarts. This is acceptable for the
  current single-instance deployment; authentication protections and endpoint
  validation remain unchanged.
- Redis mode keeps fail-closed behavior if its required URL is missing.
- No credentials or provider error details are returned by health endpoints.
- Switching modes does not touch PostgreSQL or persistent user/test data.

## Tests

Use test-driven development and observe each regression test fail before the
implementation:

1. Configuration tests accept production memory mode without `REDIS_URL`, require
   it in Redis mode, and reject unknown values.
2. Throttler factory tests prove memory mode does not construct Redis storage and
   Redis mode does.
3. Health metadata tests prove the controller is decorated to skip throttling.
4. Health service tests prove memory mode checks PostgreSQL only and Redis mode
   retains the existing Redis readiness behavior.
5. Existing unit tests, e2e tests that do not require external infrastructure,
   lint/type checks, and the production build must remain green.

## Deployment and verification gate

Local implementation does not authorize an AWS mutation. After local verification
and code review, present the exact diff and deployment command for approval.
Production success requires fresh evidence for all of the following:

1. The deployed image contains the reviewed hotfix commit.
2. `toeic-green-api` is healthy and has no Redis quota exceptions in new logs.
3. Public `/api/health/live` and `/api/health/ready` return HTTP 200.
4. The public tests/list endpoint returns HTTP 200 with expected JSON.
5. The production Practice page loads test data without a failed preflight or
   HTTP 503.

Rollback uses the deployment script's existing recovery snapshot and the prior
healthy image; it must not overwrite PostgreSQL or Redis data.
