# Back-End

NestJS API for TOEIC Green, including authentication, profiles, database
access, and server-side learning features.

The current production architecture and last verified release are documented in
[`../docs/production-status.md`](../docs/production-status.md). The authoritative
AWS deployment, verification, rollback, and maintenance runbook is
[`deploy/aws/README.md`](deploy/aws/README.md).

Production currently runs one API process on AWS EC2 with
`THROTTLE_STORAGE=memory`. Redis-backed throttling is an explicit opt-in mode for
future horizontal scaling, not a required dependency of the current runtime.
