# Redis Quota Resilience Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep the single-instance production API available and rate-limited when Upstash is unavailable or over quota, while preserving an explicit Redis-backed mode for future horizontal scaling.

**Architecture:** A single typed resolver selects `memory` or `redis` throttler storage. The AppModule storage factory and HealthService consume that same resolved mode, health endpoints bypass the global guard, and the AWS environment renderer explicitly selects memory mode for the current EC2 deployment.

**Tech Stack:** NestJS 11, `@nestjs/throttler` 6, ioredis 5, Jest 30, Bash deployment tests.

**Spec:** `docs/superpowers/specs/2026-10-25-redis-quota-resilience-design.md`

## Global Constraints

- Use test-driven development: observe every regression test fail for the intended reason before implementing production code.
- Do not run Docker.
- Do not mutate AWS, SSM, Upstash, DNS, or production during local implementation.
- Preserve the global limit of 100 requests per 60 seconds and all existing route-specific limits.
- `memory` is the default and must not construct or contact an ioredis client.
- `redis` must remain fail-closed when `REDIS_URL` is absent in production.
- Keep all existing uncommitted work outside this isolated worktree untouched.
- `auto_commit: false`: do not stage, commit, push, merge, or otherwise write Git history.

## Review Focus

- `THROTTLE_STORAGE` unset or empty must resolve to `memory`, not Redis.
- Unknown, mixed-case, or whitespace-padded storage values must fail startup rather than silently choose a mode.
- Memory mode with a stale `REDIS_URL` present must still construct no Redis client.
- Redis mode without `REDIS_URL` must fail with a configuration error before serving traffic.
- Shutdown in memory mode must not attempt to disconnect a nonexistent Redis client.

---

### Task 1: Typed throttler mode and production validation

**Files:**
- Create: `back-end/src/config/throttle.config.ts`
- Create: `back-end/src/config/throttle.config.spec.ts`
- Modify: `back-end/src/config/env.validation.ts`
- Modify: `back-end/src/config/env.validation.spec.ts`

**Interfaces:**
- Produces: `type ThrottleStorageMode = 'memory' | 'redis'`.
- Produces: `resolveThrottleStorageMode(value: unknown): ThrottleStorageMode`.
- Produces: default Nest config namespace `throttle` with property `storageMode: ThrottleStorageMode`.
- Consumes: raw `THROTTLE_STORAGE` and `REDIS_URL` environment values.

- [x] **Step 1: Add failing resolver tests**

Add tests named:

- `defaults an absent or empty storage mode to memory`
- `accepts only exact memory and redis modes`
- `rejects unknown, mixed-case, and padded modes`

Assert exact return values and an error containing `THROTTLE_STORAGE must be either memory or redis` for every invalid value.

- [x] **Step 2: Run resolver tests and verify RED**

Run: `npx jest --runInBand --runTestsByPath src/config/throttle.config.spec.ts`

Expected: FAIL because `throttle.config.ts` and its exports do not exist.

- [x] **Step 3: Implement the typed resolver and registered config**

Implement `resolveThrottleStorageMode(value: unknown): ThrottleStorageMode` and export a `registerAs('throttle', ...)` default config that exposes `storageMode`.

- [x] **Step 4: Run resolver tests and verify GREEN**

Run: `npx jest --runInBand --runTestsByPath src/config/throttle.config.spec.ts`

Expected: PASS with all new resolver cases.

- [x] **Step 5: Add failing production validation tests**

Update `env.validation.spec.ts` to assert:

- production memory mode accepts missing `REDIS_URL`;
- production Redis mode rejects missing `REDIS_URL`;
- invalid mode is rejected in development and production;
- omitted mode behaves as memory.

- [x] **Step 6: Run validation tests and verify RED**

Run: `npx jest --runInBand --runTestsByPath src/config/env.validation.spec.ts`

Expected: FAIL because validation still always requires Redis and does not validate the new mode.

- [x] **Step 7: Make validation mode-aware**

Call `resolveThrottleStorageMode(config.THROTTLE_STORAGE)` once near the start of `validateEnvironment`. Require `REDIS_URL` in production only when the resolved mode is `redis`; leave database, cookie, R2, mail, and JWT validation unchanged.

- [x] **Step 8: Run Task 1 tests**

Run: `npx jest --runInBand --runTestsByPath src/config/throttle.config.spec.ts src/config/env.validation.spec.ts`

Expected: PASS.

### Task 2: Mode-aware throttler storage factory

**Files:**
- Create: `back-end/src/config/throttler-storage.factory.ts`
- Create: `back-end/src/config/throttler-storage.factory.spec.ts`
- Modify: `back-end/src/app.module.ts`

**Interfaces:**
- Consumes: `ThrottleStorageMode` from Task 1 and `redisUrl: string | undefined`.
- Produces: `createThrottlerStorage(mode: ThrottleStorageMode, redisUrl: string | undefined): ThrottlerStorage | undefined`.
- `undefined` means Nest uses its built-in in-memory storage.

- [x] **Step 1: Add failing factory tests**

Mock only the ioredis constructor and Redis storage adapter boundary. Assert:

- memory mode returns `undefined` and constructs neither dependency even when a Redis URL is present;
- Redis mode constructs one client and one `ThrottlerStorageRedisService`;
- Redis mode without a URL throws an error naming `REDIS_URL`.

- [x] **Step 2: Run factory tests and verify RED**

Run: `npx jest --runInBand --runTestsByPath src/config/throttler-storage.factory.spec.ts`

Expected: FAIL because the factory does not exist.

- [x] **Step 3: Implement the storage factory**

Move the existing ioredis client options and error logging from `app.module.ts` into `createThrottlerStorage`. Do not add retry or fallback behavior beyond the selected storage mode.

- [x] **Step 4: Run factory tests and verify GREEN**

Run: `npx jest --runInBand --runTestsByPath src/config/throttler-storage.factory.spec.ts`

Expected: PASS.

- [x] **Step 5: Wire the mode into AppModule**

Load the Task 1 `throttle` config namespace. In `ThrottlerModule.forRootAsync`, read `throttle.storageMode`, call `createThrottlerStorage`, and retain the exact `{ ttl: 60000, limit: 100 }`, test-only `skipIf`, global `ThrottlerGuard`, and `JwtAuthGuard` behavior.

- [x] **Step 6: Run Task 1 and Task 2 tests**

Run: `npx jest --runInBand --runTestsByPath src/config/throttle.config.spec.ts src/config/env.validation.spec.ts src/config/throttler-storage.factory.spec.ts`

Expected: PASS.

### Task 3: Health endpoints independent of optional Redis

**Files:**
- Modify: `back-end/src/modules/health/health.controller.ts`
- Modify: `back-end/src/modules/health/health.controller.spec.ts`
- Modify: `back-end/src/modules/health/health.service.ts`
- Modify: `back-end/src/modules/health/health.service.spec.ts`

**Interfaces:**
- Consumes: `throttle.storageMode` from Task 1.
- Preserves: `live(): { status: 'ok' }`.
- Preserves: `ready(): Promise<{ status: 'ready' }>` or generic HTTP 503 `{ status: 'not_ready' }`.

- [x] **Step 1: Add a failing skip-throttle metadata test**

Assert the class metadata key `THROTTLER:SKIP` on `HealthController` equals `{ default: true }` after using the public `@SkipThrottle()` decorator.

- [x] **Step 2: Run the controller test and verify RED**

Run: `npx jest --runInBand --runTestsByPath src/modules/health/health.controller.spec.ts`

Expected: FAIL because the controller is not decorated to skip throttling.

- [x] **Step 3: Decorate the health controller**

Import `SkipThrottle` from `@nestjs/throttler` and apply `@SkipThrottle()` at class scope without changing routes or response bodies.

- [x] **Step 4: Run the controller test and verify GREEN**

Run: `npx jest --runInBand --runTestsByPath src/modules/health/health.controller.spec.ts`

Expected: PASS.

- [x] **Step 5: Add failing mode-aware HealthService tests**

Refactor the ConfigService mock to return values by key. Add assertions that:

- memory mode checks PostgreSQL, constructs no Redis client, and reports ready;
- memory mode remains ready when an unused stale Redis URL is present;
- Redis mode retains PostgreSQL plus Redis checks and generic 503 behavior;
- memory-mode shutdown does not call Redis disconnect;
- Redis-mode shutdown disconnects exactly once.

- [x] **Step 6: Run HealthService tests and verify RED**

Run: `npx jest --runInBand --runTestsByPath src/modules/health/health.service.spec.ts`

Expected: FAIL because HealthService currently always constructs and pings Redis.

- [x] **Step 7: Make HealthService mode-aware**

Resolve `throttle.storageMode` in the constructor. Store Redis as optional; create it only in Redis mode, require `redis.url` in that mode, add its ping to the readiness promise list only when present, and disconnect only when present.

- [x] **Step 8: Run all health and configuration tests**

Run: `npx jest --runInBand --runTestsByPath src/config/throttle.config.spec.ts src/config/env.validation.spec.ts src/config/throttler-storage.factory.spec.ts src/modules/health/health.controller.spec.ts src/modules/health/health.service.spec.ts`

Expected: PASS.

### Task 4: Explicit AWS runtime mode and operator documentation

**Files:**
- Modify: `back-end/.env.example`
- Modify: `back-end/deploy/aws/render-env.sh`
- Modify: `back-end/deploy/aws/tests/test-render-env.sh`
- Modify: `back-end/deploy/aws/README.md`

**Interfaces:**
- Consumes: optional renderer environment variable `THROTTLE_STORAGE`.
- Produces: a quoted `THROTTLE_STORAGE=memory|redis` entry in `backend.env`, defaulting to `memory`.
- Preserves: all ten existing SSM SecureString requirements and secret serialization.

- [x] **Step 1: Add failing renderer tests**

Assert the rendered file contains `THROTTLE_STORAGE='memory'` by default, contains `redis` when the renderer environment explicitly selects it, and rejects an invalid mode without replacing the previous environment file.

- [x] **Step 2: Run the renderer test and verify RED**

Run from the repository root: `bash back-end/deploy/aws/tests/test-render-env.sh`

Expected: FAIL because the renderer does not emit or validate `THROTTLE_STORAGE`.

- [x] **Step 3: Implement renderer mode output**

In `write_env_file`, resolve `${THROTTLE_STORAGE:-memory}`, accept only exact `memory` or `redis`, and write the non-secret value through the existing Compose quoting path. Do not remove or print any secret.

- [x] **Step 4: Run the renderer test and verify GREEN**

Run: `bash back-end/deploy/aws/tests/test-render-env.sh`

Expected: PASS.

- [x] **Step 5: Document the mode**

Add `THROTTLE_STORAGE=memory` and concise mode guidance to `back-end/.env.example`. Update the AWS runbook to state that the current single EC2 deployment uses memory mode, `REDIS_URL` is retained for a future explicit Redis mode, and horizontal scaling requires shared Redis storage.

- [x] **Step 6: Run static AWS deployment tests**

Run: `bash back-end/deploy/aws/tests/test-compose.sh && bash back-end/deploy/aws/tests/test-render-env.sh && bash back-end/deploy/aws/tests/test-deploy.sh`

Expected: all scripts exit 0. Do not enable `RUN_DOCKER_RUNTIME_TESTS`.

### Task 5: Full local verification and review

**Files:**
- Review all files changed by Tasks 1-4.
- Update checkboxes and add a verification record to this plan only after commands complete.

**Interfaces:**
- Consumes: all prior task outputs.
- Produces: evidence sufficient to request deployment approval, not a production-success claim.

- [x] **Step 1: Install backend dependencies in the isolated worktree**

Run: `npm ci`

Working directory: `back-end`

Expected: exit 0 without modifying tracked dependency manifests.

- [x] **Step 2: Run the complete backend unit suite**

Run: `npx jest --runInBand && node --test prisma/*.test.cjs`

Working directory: `back-end`

Expected: all Jest and Node test suites pass with zero failures.

- [x] **Step 3: Run lint without auto-fix**

Run: `npx eslint "{src,apps,libs,test}/**/*.ts"`

Working directory: `back-end`

Expected: exit 0 with zero errors.

- [x] **Step 4: Run the production backend build**

Run: `npm run build`

Working directory: `back-end`

Expected: exit 0 and Nest TypeScript compilation succeeds.

- [x] **Step 5: Run all static AWS deployment tests again**

Run: `bash back-end/deploy/aws/tests/test-compose.sh && bash back-end/deploy/aws/tests/test-render-env.sh && bash back-end/deploy/aws/tests/test-deploy.sh`

Expected: exit 0 with no Docker execution.

- [x] **Step 6: Review the final diff and scope**

Run: `git status --short && git diff --check && git diff -- back-end/src/config back-end/src/app.module.ts back-end/src/modules/health back-end/.env.example back-end/deploy/aws docs/superpowers`

Expected: only the spec, plan, targeted backend/config/health/deploy documentation files are changed; no credentials, generated output, lockfile drift, or unrelated edits.

- [x] **Step 7: Request independent code review**

Give the reviewer the approved spec, this plan, the complete diff, and verification output. Resolve every Critical or Important finding and rerun the affected verification commands.

- [x] **Step 8: Stop at the production gate**

Present the reviewed diff, test evidence, exact candidate revision strategy, AWS deploy command, verification commands, and rollback path. Obtain explicit approval before any commit/push, SSM change, or deployment.
