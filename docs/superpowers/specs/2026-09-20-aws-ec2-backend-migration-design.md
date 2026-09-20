# AWS EC2 Backend Migration Design

## Objective

Restore `https://api.toeicgreen.com` by moving only the NestJS backend from Google Cloud Run to an always-running AWS EC2 instance. Keep the Vercel frontend, Supabase PostgreSQL database, Upstash Redis, Cloudflare R2 assets, Resend email delivery, OAuth configuration, API contract, and production data unchanged.

This deployment is a temporary bridge for the six-month AWS Free Plan period. It must avoid cold starts, prevent unplanned paid AWS resources, and remain easy to migrate again later.

## Constraints

- Use a new AWS Free Plan account with the initial promotional credits.
- Run one instance only in `ap-northeast-1` (Tokyo), close to the current Supabase region.
- Do not create RDS, ElastiCache, a NAT Gateway, an Application Load Balancer, Route 53 hosted zones, or other unnecessary recurring resources.
- Do not copy or migrate production data.
- Do not put secrets, generated `.env` files, private keys, or AWS credentials in Git.
- Preserve the public API origin `https://api.toeicgreen.com` so the Vercel build and refresh-token cookie contract do not change.
- Keep the existing Cloud Run service and its configuration untouched during migration.

## Chosen Architecture

```text
Vercel frontend
       |
https://api.toeicgreen.com
       |
Hostinger DNS A record
       |
AWS Elastic IPv4
       |
EC2 t4g.small, ap-northeast-1
  |-- Caddy container: HTTPS and reverse proxy
  |-- NestJS API container: port 2409, private Docker network
  `-- Docker restart policies and bounded JSON logs
       |
       |-- Supabase PostgreSQL
       |-- Upstash Redis
       |-- Cloudflare R2
       `-- Resend and Google OAuth
```

The instance uses an ARM64 image and builds the existing multi-stage Dockerfile natively on the EC2 host. The repository is public, so the host can clone and update it without storing GitHub credentials.

## AWS Resources

Create only these resources:

- One `t4g.small` EC2 instance in Tokyo, configured with T-class CPU credits in `standard` mode so surplus CPU cannot create unexpected unlimited-mode charges.
- Amazon Linux 2023 ARM64, with Docker, Git, AWS CLI, and the SSM agent.
- One 30 GB `gp3` root volume using baseline IOPS and throughput.
- One Elastic IPv4 associated with the running instance.
- One security group allowing inbound TCP 80 and 443 from the internet. Do not open SSH port 22.
- One EC2 IAM role with `AmazonSSMManagedInstanceCore` plus a custom policy that can read only the TOEIC Green Parameter Store path.
- Standard AWS Systems Manager Parameter Store values under `/toeic-green/prod/`.
- One AWS Budget with notifications at low credit-usage thresholds. No automated action may delete or stop production resources.

Administration uses AWS Systems Manager Session Manager instead of public SSH. This removes the need to store an SSH private key or expose port 22.

## Application Deployment

Add a production-specific Compose definition that contains two services:

1. `api` builds the existing `back-end/Dockerfile`, loads runtime values from a generated root-owned environment file, exposes port 2409 only to the private Compose network, and uses `restart: unless-stopped`.
2. `caddy` exposes ports 80 and 443, obtains and renews the certificate for `api.toeicgreen.com`, proxies requests to `api:2409`, persists certificate state in named volumes, and uses `restart: unless-stopped`.

Docker logging must use size and file-count limits so application output cannot fill the root volume.

Add two backend health endpoints:

- `/api/health/live`: process-only liveness response; it must not query external dependencies.
- `/api/health/ready`: checks PostgreSQL and Redis with short timeouts and returns a generic readiness result without exposing credentials or connection details.

The API container health check uses the liveness endpoint. Deployment verification uses both endpoints.

## Secret Handling

Production values currently stored in Google Secret Manager are copied once into encrypted SSM SecureString parameters. Non-secret production configuration is also stored in Parameter Store or in the checked-in deployment defaults when it is already public and non-sensitive.

An instance-side script reads only `/toeic-green/prod/`, writes `/opt/toeic-green/runtime/backend.env` with mode `0600`, and then starts Compose. The script must never print parameter values. The environment file is outside the Git checkout and is ignored by Docker build context.

The following values remain secret:

- JWT access and refresh secrets
- Supabase pooled and direct database URLs
- Upstash Redis URL
- Cloudflare R2 account and access credentials
- Resend API key
- Google OAuth client secret

## DNS and TLS Cutover

The current `api.toeicgreen.com` record is a CNAME to `ghs.googlehosted.com`. Migration uses this sequence:

1. Create a temporary `aws-api.toeicgreen.com` A record pointing to the Elastic IPv4.
2. Start Caddy and obtain a certificate for the temporary hostname.
3. Verify health, CORS, database reads, authentication, token refresh, cookie flags, practice flows, vocabulary flows, R2 access, and email configuration against the temporary hostname.
4. Reduce the production DNS TTL before the final change when the DNS provider permits it.
5. Replace the production CNAME with an A record pointing to the Elastic IPv4 and configure Caddy for both the temporary and production hostnames during propagation.
6. Re-test production through `https://api.toeicgreen.com` from the deployed Vercel frontend.
7. Remove the temporary DNS record only after production has remained healthy.

The frontend environment variable and cookie domain remain unchanged because the production API hostname is preserved.

## Deployment Safety and Rollback

Deployment is staged before DNS changes. A release is considered eligible for cutover only when all automated checks and the manual authentication flow pass on the temporary hostname.

Each application update builds a commit-tagged image. The deployment script records the previously running tag, starts the candidate, waits for liveness and readiness, and restores the previous tag if the candidate fails. Database migrations run explicitly before switching the running container and must be backward-compatible with the previous application version.

The previous DNS value, `ghs.googlehosted.com`, is recorded for recovery. Returning traffic to Cloud Run also requires Google Cloud billing to be active, so DNS rollback alone is not treated as an immediately available recovery path while GCP billing remains disabled.

EC2 stores no authoritative application data. If the VM is lost, the service can be rebuilt from Git, Parameter Store, and the external data services.

## Cost Controls

- Select AWS Free Plan during account creation.
- Use exactly one `t4g.small` instance and no secondary instances.
- Keep cumulative T4g usage below 750 instance-hours per calendar month.
- Set CPU credits to `standard`, not `unlimited`.
- Use one public IPv4 and one 30 GB `gp3` volume.
- Do not allocate unattached Elastic IPs, snapshots beyond the free allowance, load balancers, NAT gateways, or managed databases.
- Enable Free Tier usage notifications and AWS Budget email alerts.
- Review the AWS Cost and Usage widget after provisioning, after the first 24 hours, and weekly.
- Treat the account as a six-month bridge. Decide whether to pay, migrate, or shut down before the Free Plan expiration date.

## Verification

Verification must cover:

- ARM64 Docker image builds successfully.
- The container starts after a clean reboot without manual intervention.
- Liveness and readiness return success over HTTPS.
- CORS permits `https://toeicgreen.com` and `https://www.toeicgreen.com` only as configured.
- Registration, password login, Google login, access-token refresh, logout, and secure refresh cookies work.
- Public explore and practice endpoints return expected data.
- Authenticated practice submission, vocabulary mutations, and progress updates persist in Supabase.
- R2 media URLs and uploads continue working.
- Resend email verification and password-reset delivery work.
- Rate limiting uses the forwarded client IP correctly behind Caddy.
- Docker logs rotate and disk usage remains bounded.
- No unexpected AWS resources or charges appear in Billing and Cost Management.

## Success Criteria

- `https://toeicgreen.com` operates normally with the backend served from AWS.
- `https://api.toeicgreen.com` has valid TLS and no routine cold start.
- Existing users, data, cookies, OAuth, media, and API contracts continue to work.
- The service recovers automatically after an EC2 reboot.
- Only the explicitly listed AWS resources exist.
- The AWS Free Plan and promotional credits cover the temporary deployment without charging the payment method.
