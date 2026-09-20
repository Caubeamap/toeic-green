# AWS EC2 Backend Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Khôi phục `toeicgreen.com` bằng cách chạy backend NestJS liên tục trên một EC2 `t4g.small` ở Tokyo, giữ nguyên toàn bộ dữ liệu và dịch vụ ngoài backend.

**Architecture:** Vercel tiếp tục phục vụ frontend và gọi `https://api.toeicgreen.com`. Hostname API được chuyển sang một Elastic IPv4 gắn với EC2; Caddy cấp TLS và reverse proxy vào container NestJS. Supabase, Upstash, R2, Resend và Google OAuth không di chuyển; secret được lấy từ SSM Parameter Store khi deploy.

**Tech Stack:** NestJS 11, Prisma 7, Jest, Docker Compose, Caddy 2, AWS EC2/CloudFormation/SSM/Budgets, Hostinger DNS.

---

## File Map

- Create `back-end/src/modules/health/health.controller.ts`: public liveness/readiness HTTP contract.
- Create `back-end/src/modules/health/health.service.ts`: bounded PostgreSQL and Redis readiness checks.
- Create `back-end/src/modules/health/health.module.ts`: health module wiring.
- Create `back-end/src/modules/health/health.controller.spec.ts`: controller contract tests.
- Create `back-end/src/modules/health/health.service.spec.ts`: dependency readiness tests.
- Modify `back-end/src/app.module.ts`: import `HealthModule`.
- Create `back-end/deploy/aws/compose.yml`: production API and Caddy containers.
- Create `back-end/deploy/aws/Caddyfile`: TLS and reverse proxy configuration.
- Create `back-end/deploy/aws/render-env.sh`: render a root-readable Docker env file from SSM.
- Create `back-end/deploy/aws/deploy.sh`: commit-tagged deployment, migration, health gate, rollback.
- Create `back-end/deploy/aws/cloudformation.yml`: reproducible single-instance AWS infrastructure.
- Create `back-end/deploy/aws/README.md`: exact provisioning, deployment, cutover, rollback, and cost-audit runbook.

### Task 1: Add deterministic health endpoints

**Files:**
- Create: `back-end/src/modules/health/health.controller.spec.ts`
- Create: `back-end/src/modules/health/health.service.spec.ts`
- Create: `back-end/src/modules/health/health.controller.ts`
- Create: `back-end/src/modules/health/health.service.ts`
- Create: `back-end/src/modules/health/health.module.ts`
- Modify: `back-end/src/app.module.ts:1-75`

- [ ] **Step 1: Write the controller tests**

Create `back-end/src/modules/health/health.controller.spec.ts`:

```ts
import { HealthController } from './health.controller';

describe('HealthController', () => {
  const healthService = {
    ready: jest.fn(),
  };
  const controller = new HealthController(healthService as never);

  beforeEach(() => jest.clearAllMocks());

  it('returns a dependency-free liveness response', () => {
    expect(controller.live()).toEqual({ status: 'ok' });
    expect(healthService.ready).not.toHaveBeenCalled();
  });

  it('delegates readiness checks to HealthService', async () => {
    healthService.ready.mockResolvedValue({ status: 'ready' });

    await expect(controller.ready()).resolves.toEqual({ status: 'ready' });
    expect(healthService.ready).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Write the service tests**

Create `back-end/src/modules/health/health.service.spec.ts`:

```ts
import { ServiceUnavailableException } from '@nestjs/common';
import { Redis } from 'ioredis';
import { HealthService } from './health.service';

jest.mock('ioredis', () => ({ Redis: jest.fn() }));

describe('HealthService', () => {
  const prisma = { $queryRawUnsafe: jest.fn() };
  const config = { get: jest.fn().mockReturnValue('rediss://cache.example:6379') };
  const redis = {
    status: 'ready',
    on: jest.fn(),
    connect: jest.fn(),
    ping: jest.fn(),
    disconnect: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (Redis as unknown as jest.Mock).mockImplementation(() => redis);
    prisma.$queryRawUnsafe.mockResolvedValue([{ '?column?': 1 }]);
    redis.ping.mockResolvedValue('PONG');
  });

  it('reports ready when PostgreSQL and Redis respond', async () => {
    const service = new HealthService(prisma as never, config as never);

    await expect(service.ready()).resolves.toEqual({ status: 'ready' });
    expect(prisma.$queryRawUnsafe).toHaveBeenCalledWith('SELECT 1');
    expect(redis.ping).toHaveBeenCalledTimes(1);
  });

  it('returns a generic 503 when a dependency fails', async () => {
    prisma.$queryRawUnsafe.mockRejectedValue(new Error('database detail'));
    const service = new HealthService(prisma as never, config as never);

    await expect(service.ready()).rejects.toEqual(
      new ServiceUnavailableException({ status: 'not_ready' }),
    );
  });

  it('disconnects the readiness Redis client on shutdown', () => {
    const service = new HealthService(prisma as never, config as never);

    service.onModuleDestroy();
    expect(redis.disconnect).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 3: Run the focused tests and verify they fail**

Run from `back-end`:

```powershell
npm test -- --runInBand modules/health
```

Expected: FAIL because the health controller and service do not exist.

- [ ] **Step 4: Implement the health service**

Create `back-end/src/modules/health/health.service.ts`:

```ts
import {
  Injectable,
  OnModuleDestroy,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';
import { PrismaService } from '../../prisma/prisma.service';

const READINESS_TIMEOUT_MS = 2_000;

@Injectable()
export class HealthService implements OnModuleDestroy {
  private readonly redis: Redis;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService,
  ) {
    const redisUrl = config.get<string>('redis.url');
    if (!redisUrl) {
      throw new Error('REDIS_URL environment variable is not defined');
    }

    this.redis = new Redis(redisUrl, {
      lazyConnect: true,
      connectTimeout: READINESS_TIMEOUT_MS,
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
    });
    this.redis.on('error', () => undefined);
  }

  async ready() {
    try {
      await Promise.all([
        withTimeout(
          this.prisma.$queryRawUnsafe('SELECT 1'),
          READINESS_TIMEOUT_MS,
        ),
        withTimeout(this.pingRedis(), READINESS_TIMEOUT_MS),
      ]);
      return { status: 'ready' };
    } catch {
      throw new ServiceUnavailableException({ status: 'not_ready' });
    }
  }

  onModuleDestroy() {
    this.redis.disconnect();
  }

  private async pingRedis() {
    if (this.redis.status === 'wait' || this.redis.status === 'end') {
      await this.redis.connect();
    }
    await this.redis.ping();
  }
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<never>((_, reject) => {
    timeout = setTimeout(() => reject(new Error('health timeout')), timeoutMs);
  });

  return Promise.race([promise, deadline]).finally(() => {
    if (timeout) clearTimeout(timeout);
  });
}
```

- [ ] **Step 5: Implement the controller and module**

Create `back-end/src/modules/health/health.controller.ts`:

```ts
import { Controller, Get } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { HealthService } from './health.service';

@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Public()
  @Get('live')
  live() {
    return { status: 'ok' };
  }

  @Public()
  @Get('ready')
  ready() {
    return this.healthService.ready();
  }
}
```

Create `back-end/src/modules/health/health.module.ts`:

```ts
import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';

@Module({
  controllers: [HealthController],
  providers: [HealthService],
})
export class HealthModule {}
```

Import `HealthModule` in `back-end/src/app.module.ts` and add it to `imports` after `PrismaModule`:

```ts
import { HealthModule } from './modules/health/health.module';
```

```ts
    PrismaModule,
    HealthModule,
```

- [ ] **Step 6: Run tests and build**

Run from `back-end`:

```powershell
npm test -- --runInBand modules/health
npm run build
```

Expected: health tests PASS and Nest build exits with code 0.

- [ ] **Step 7: Commit Task 1 if auto-commit is enabled**

Check `.agent/config.yml`. It is currently absent, so `auto_commit` defaults to true:

```powershell
git add -- back-end/src/app.module.ts back-end/src/modules/health
git commit -m "feat: add backend health endpoints"
```

### Task 2: Add production container and deployment scripts

**Files:**
- Create: `back-end/deploy/aws/compose.yml`
- Create: `back-end/deploy/aws/Caddyfile`
- Create: `back-end/deploy/aws/render-env.sh`
- Create: `back-end/deploy/aws/deploy.sh`

- [ ] **Step 1: Add the Caddy configuration**

Create `back-end/deploy/aws/Caddyfile`:

```caddyfile
{$API_HOST} {
  encode zstd gzip

  reverse_proxy api:2409 {
    health_uri /api/health/live
    health_interval 30s
    health_timeout 3s
  }

  log {
    output stdout
    format json
  }
}
```

- [ ] **Step 2: Add production Compose**

Create `back-end/deploy/aws/compose.yml`:

```yaml
name: toeic-green

services:
  api:
    container_name: toeic-green-api
    image: toeic-green-api:${IMAGE_TAG:-local}
    build:
      context: ../..
      dockerfile: Dockerfile
      target: runner
    env_file:
      - /opt/toeic-green/runtime/backend.env
    expose:
      - "2409"
    init: true
    restart: unless-stopped
    healthcheck:
      test:
        - CMD
        - node
        - -e
        - fetch('http://127.0.0.1:2409/api/health/live').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))
      interval: 15s
      timeout: 3s
      retries: 8
      start_period: 30s
    logging:
      driver: json-file
      options:
        max-size: 10m
        max-file: "3"
    networks:
      - internal

  caddy:
    container_name: toeic-green-caddy
    image: caddy:2.10.2-alpine
    environment:
      API_HOST: ${API_HOST:?API_HOST is required}
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile:ro
      - caddy_data:/data
      - caddy_config:/config
    depends_on:
      api:
        condition: service_healthy
    restart: unless-stopped
    logging:
      driver: json-file
      options:
        max-size: 10m
        max-file: "3"
    networks:
      - internal

networks:
  internal:
    driver: bridge

volumes:
  caddy_data:
  caddy_config:
```

- [ ] **Step 3: Add the SSM environment renderer**

Create `back-end/deploy/aws/render-env.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail
umask 077

AWS_REGION="${AWS_REGION:-ap-northeast-1}"
PARAMETER_PATH="${PARAMETER_PATH:-/toeic-green/prod/}"
RUNTIME_DIR="${RUNTIME_DIR:-/opt/toeic-green/runtime}"
TARGET="$RUNTIME_DIR/backend.env"
TMP_JSON="$(mktemp)"
trap 'rm -f "$TMP_JSON"' EXIT

mkdir -p "$RUNTIME_DIR"

aws ssm get-parameters-by-path \
  --path "$PARAMETER_PATH" \
  --recursive \
  --with-decryption \
  --region "$AWS_REGION" \
  --output json > "$TMP_JSON"

required=(
  JWT_SECRET JWT_REFRESH_SECRET DATABASE_URL DIRECT_URL REDIS_URL
  R2_ACCOUNT_ID R2_ACCESS_KEY R2_SECRET_KEY RESEND_API_KEY
  GOOGLE_CLIENT_SECRET
)

for key in "${required[@]}"; do
  jq -e --arg name "${PARAMETER_PATH}${key}" \
    '.Parameters[] | select(.Name == $name)' "$TMP_JSON" >/dev/null || {
      echo "Missing SSM parameter: ${PARAMETER_PATH}${key}" >&2
      exit 1
    }
done

cat > "$TARGET" <<'ENV'
NODE_ENV=production
PORT=2409
FRONTEND_URL=https://toeicgreen.com
CORS_ALLOWED_ORIGINS=https://www.toeicgreen.com
TRUST_PROXY=1
COOKIE_SECURE=true
COOKIE_DOMAIN=.toeicgreen.com
DB_POOL_MAX=5
MAIL_PROVIDER=resend
EMAIL_FROM='TOEIC Green <no-reply@toeicgreen.com>'
EMAIL_VERIFICATION_URL=https://toeicgreen.com/verify-email
EMAIL_RESET_PASSWORD_URL=https://toeicgreen.com/forgot-password
GOOGLE_CLIENT_ID=739130230350-ett9c8812jardb9a5jaagpjuu5cdhl7n.apps.googleusercontent.com
R2_BUCKET_NAME=toeic-green-assets
R2_PUBLIC_URL=https://pub-4f8cb610d7574526affd8f9e156e874e.r2.dev
ENV

jq -r --arg prefix "$PARAMETER_PATH" \
  '.Parameters | sort_by(.Name)[] | ((.Name | sub("^" + $prefix; "")) + "=" + (.Value | @sh))' \
  "$TMP_JSON" >> "$TARGET"

chmod 600 "$TARGET"
echo "Rendered $TARGET with $(wc -l < "$TARGET") variables"
```

- [ ] **Step 4: Add commit-tagged deploy and rollback**

Create `back-end/deploy/aws/deploy.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail

REPO_DIR="${REPO_DIR:-/opt/toeic-green/repo}"
RUNTIME_DIR="${RUNTIME_DIR:-/opt/toeic-green/runtime}"
AWS_REGION="${AWS_REGION:-ap-northeast-1}"
API_HOST="${API_HOST:?Set API_HOST to aws-api.toeicgreen.com or api.toeicgreen.com}"
COMPOSE_FILE="$REPO_DIR/back-end/deploy/aws/compose.yml"
RENDER_ENV="$REPO_DIR/back-end/deploy/aws/render-env.sh"

cd "$REPO_DIR"
git pull --ff-only origin main
IMAGE_TAG="$(git rev-parse --short=12 HEAD)"
PREVIOUS_IMAGE="$(docker inspect --format '{{.Config.Image}}' toeic-green-api 2>/dev/null || true)"
PREVIOUS_TAG="${PREVIOUS_IMAGE#toeic-green-api:}"

AWS_REGION="$AWS_REGION" RUNTIME_DIR="$RUNTIME_DIR" "$RENDER_ENV"

export API_HOST IMAGE_TAG
docker compose -f "$COMPOSE_FILE" build api

docker build \
  --target builder \
  --tag "toeic-green-migrator:$IMAGE_TAG" \
  "$REPO_DIR/back-end"

docker run --rm \
  --env-file "$RUNTIME_DIR/backend.env" \
  "toeic-green-migrator:$IMAGE_TAG" \
  npx prisma migrate deploy

docker compose -f "$COMPOSE_FILE" up -d api caddy

healthy=false
for attempt in $(seq 1 24); do
  status="$(docker inspect --format '{{.State.Health.Status}}' toeic-green-api 2>/dev/null || true)"
  if [[ "$status" == "healthy" ]]; then
    healthy=true
    break
  fi
  sleep 5
done

if [[ "$healthy" != "true" ]]; then
  docker logs --tail 100 toeic-green-api >&2 || true
  if [[ -n "$PREVIOUS_TAG" && "$PREVIOUS_TAG" != "$PREVIOUS_IMAGE" ]]; then
    export IMAGE_TAG="$PREVIOUS_TAG"
    docker compose -f "$COMPOSE_FILE" up -d --no-build api caddy
  fi
  echo "Deployment failed health checks and rollback was attempted" >&2
  exit 1
fi

curl --fail --silent --show-error "https://$API_HOST/api/health/live"
curl --fail --silent --show-error "https://$API_HOST/api/health/ready"

docker image prune --force --filter 'until=168h'
echo "Deployed toeic-green-api:$IMAGE_TAG to https://$API_HOST"
```

- [ ] **Step 5: Make scripts executable and validate Compose**

Run:

```powershell
git update-index --chmod=+x back-end/deploy/aws/render-env.sh
git update-index --chmod=+x back-end/deploy/aws/deploy.sh
docker compose -f back-end/deploy/aws/compose.yml config --quiet
git diff --check
```

Expected: Compose validation and `git diff --check` exit with code 0.

- [ ] **Step 6: Build the backend for ARM64**

Run from `back-end`:

```powershell
docker buildx build --platform linux/arm64 --target runner --tag toeic-green-api:arm64-check .
```

Expected: the Prisma and NestJS build stages complete successfully for `linux/arm64`.

- [ ] **Step 7: Commit Task 2 if auto-commit is enabled**

Check `.agent/config.yml`; with the current default:

```powershell
git add -- back-end/deploy/aws
git commit -m "feat: add AWS EC2 deployment runtime"
```

### Task 3: Define cost-bounded AWS infrastructure

**Files:**
- Create: `back-end/deploy/aws/cloudformation.yml`

- [ ] **Step 1: Add the CloudFormation stack**

Create `back-end/deploy/aws/cloudformation.yml`:

```yaml
AWSTemplateFormatVersion: "2010-09-09"
Description: TOEIC Green single-instance backend in ap-northeast-1

Parameters:
  AlertEmail:
    Type: String
    Description: Email that receives AWS Budget notifications
  RepositoryUrl:
    Type: String
    Default: https://github.com/Caubeamap/toeic-green.git
  RepositoryBranch:
    Type: String
    Default: main

Resources:
  Vpc:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: 10.24.0.0/16
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: toeic-green-vpc

  InternetGateway:
    Type: AWS::EC2::InternetGateway

  GatewayAttachment:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref Vpc
      InternetGatewayId: !Ref InternetGateway

  PublicSubnet:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref Vpc
      CidrBlock: 10.24.1.0/24
      # A temporary public address lets UserData reach package and Git endpoints.
      # The Elastic IP replaces it as soon as CloudFormation associates it.
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: toeic-green-public

  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref Vpc

  DefaultRoute:
    Type: AWS::EC2::Route
    DependsOn: GatewayAttachment
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      GatewayId: !Ref InternetGateway

  PublicRouteAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnet
      RouteTableId: !Ref PublicRouteTable

  ApiSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Public HTTP and HTTPS only
      VpcId: !Ref Vpc
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
      SecurityGroupEgress:
        - IpProtocol: "-1"
          CidrIp: 0.0.0.0/0
      Tags:
        - Key: Name
          Value: toeic-green-api

  InstanceRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: "2012-10-17"
        Statement:
          - Effect: Allow
            Principal:
              Service:
                - ec2.amazonaws.com
            Action:
              - sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore
      Policies:
        - PolicyName: ReadToeicGreenParameters
          PolicyDocument:
            Version: "2012-10-17"
            Statement:
              - Effect: Allow
                Action:
                  - ssm:GetParameter
                  - ssm:GetParameters
                  - ssm:GetParametersByPath
                Resource: !Sub arn:${AWS::Partition}:ssm:${AWS::Region}:${AWS::AccountId}:parameter/toeic-green/prod/*
              - Effect: Allow
                Action:
                  - kms:Decrypt
                Resource: "*"
                Condition:
                  StringEquals:
                    kms:ViaService: !Sub ssm.${AWS::Region}.amazonaws.com

  InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      Roles:
        - !Ref InstanceRole

  ApiInstance:
    Type: AWS::EC2::Instance
    Properties:
      ImageId: "{{resolve:ssm:/aws/service/ami-amazon-linux-latest/al2023-ami-kernel-default-arm64}}"
      InstanceType: t4g.small
      CreditSpecification:
        CPUCredits: standard
      IamInstanceProfile: !Ref InstanceProfile
      SubnetId: !Ref PublicSubnet
      SecurityGroupIds:
        - !Ref ApiSecurityGroup
      MetadataOptions:
        HttpEndpoint: enabled
        HttpTokens: required
        HttpPutResponseHopLimit: 2
      BlockDeviceMappings:
        - DeviceName: /dev/xvda
          Ebs:
            DeleteOnTermination: true
            Encrypted: true
            VolumeSize: 30
            VolumeType: gp3
      UserData:
        Fn::Base64: !Sub |
          #!/usr/bin/env bash
          set -euxo pipefail
          dnf install -y docker git jq
          systemctl enable --now docker
          mkdir -p /usr/local/lib/docker/cli-plugins
          curl --fail --location \
            https://github.com/docker/compose/releases/download/v2.39.4/docker-compose-linux-aarch64 \
            --output /usr/local/lib/docker/cli-plugins/docker-compose
          chmod 0755 /usr/local/lib/docker/cli-plugins/docker-compose
          fallocate -l 2G /swapfile
          chmod 0600 /swapfile
          mkswap /swapfile
          swapon /swapfile
          echo '/swapfile none swap sw 0 0' >> /etc/fstab
          mkdir -p /opt/toeic-green/runtime
          chmod 0700 /opt/toeic-green/runtime
          git clone --branch ${RepositoryBranch} --single-branch ${RepositoryUrl} /opt/toeic-green/repo
      Tags:
        - Key: Name
          Value: toeic-green-api

  ApiElasticIp:
    Type: AWS::EC2::EIP
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: toeic-green-api

  ApiElasticIpAssociation:
    Type: AWS::EC2::EIPAssociation
    Properties:
      AllocationId: !GetAtt ApiElasticIp.AllocationId
      InstanceId: !Ref ApiInstance

  GrossCostBudget:
    Type: AWS::Budgets::Budget
    Properties:
      Budget:
        BudgetName: toeic-green-gross-cost
        BudgetLimit:
          Amount: 10
          Unit: USD
        BudgetType: COST
        TimeUnit: MONTHLY
        CostTypes:
          IncludeCredit: false
      NotificationsWithSubscribers:
        - Notification:
            ComparisonOperator: GREATER_THAN
            NotificationType: ACTUAL
            Threshold: 50
            ThresholdType: PERCENTAGE
          Subscribers:
            - Address: !Ref AlertEmail
              SubscriptionType: EMAIL
        - Notification:
            ComparisonOperator: GREATER_THAN
            NotificationType: ACTUAL
            Threshold: 80
            ThresholdType: PERCENTAGE
          Subscribers:
            - Address: !Ref AlertEmail
              SubscriptionType: EMAIL
        - Notification:
            ComparisonOperator: GREATER_THAN
            NotificationType: FORECASTED
            Threshold: 100
            ThresholdType: PERCENTAGE
          Subscribers:
            - Address: !Ref AlertEmail
              SubscriptionType: EMAIL

Outputs:
  InstanceId:
    Value: !Ref ApiInstance
  ElasticIp:
    Value: !Ref ApiElasticIp
  SsmParameterPath:
    Value: /toeic-green/prod/
```

- [ ] **Step 2: Validate the template with AWS**

After AWS access exists, run the authoritative validation:

```powershell
aws cloudformation validate-template `
  --region ap-northeast-1 `
  --template-body file://back-end/deploy/aws/cloudformation.yml
```

Expected: a response listing `AlertEmail`, `RepositoryUrl`, and `RepositoryBranch`, with no validation error.

- [ ] **Step 3: Commit Task 3 if auto-commit is enabled**

Check `.agent/config.yml`; with the current default:

```powershell
git add -- back-end/deploy/aws/cloudformation.yml
git commit -m "infra: define cost-bounded AWS backend stack"
```

### Task 4: Add the operator runbook

**Files:**
- Create: `back-end/deploy/aws/README.md`

- [ ] **Step 1: Document the exact operating sequence**

Create `back-end/deploy/aws/README.md` with these sections and commands:

````markdown
# TOEIC Green AWS EC2 deployment

## Fixed architecture

- Region: `ap-northeast-1`
- Instance: one `t4g.small`, CPU credits `standard`
- Disk: one encrypted 30 GB `gp3` root volume
- Inbound ports: 80 and 443 only
- Administration: Systems Manager Session Manager; SSH is closed
- Runtime: Docker Compose with NestJS and Caddy
- Data: Supabase, Upstash, and R2 remain external

## Required SSM SecureString parameters

Create these under `/toeic-green/prod/`:

`JWT_SECRET`, `JWT_REFRESH_SECRET`, `DATABASE_URL`, `DIRECT_URL`, `REDIS_URL`,
`R2_ACCOUNT_ID`, `R2_ACCESS_KEY`, `R2_SECRET_KEY`, `RESEND_API_KEY`, and
`GOOGLE_CLIENT_SECRET`.

Use SecureString and the AWS managed SSM KMS key. Never paste values into a
shell command, Git file, CloudFormation parameter, or terminal transcript.

## First staging deployment

1. Create DNS A record `aws-api.toeicgreen.com` pointing to the stack Elastic IP.
2. Wait until public DNS returns that address.
3. Open an SSM Session Manager shell on the instance.
4. Run:

```bash
sudo -i
cd /opt/toeic-green/repo
API_HOST=aws-api.toeicgreen.com back-end/deploy/aws/deploy.sh
```

5. Verify:

```bash
curl --fail https://aws-api.toeicgreen.com/api/health/live
curl --fail https://aws-api.toeicgreen.com/api/health/ready
docker compose -f back-end/deploy/aws/compose.yml ps
docker stats --no-stream
df -h /
```

## Production cutover

1. Lower the TTL of `api.toeicgreen.com` to 300 seconds at Hostinger DNS.
2. Record the old value: `ghs.googlehosted.com`.
3. Replace the CNAME with an A record pointing to the Elastic IP.
4. In the instance session, run:

```bash
sudo -i
cd /opt/toeic-green/repo
API_HOST=api.toeicgreen.com back-end/deploy/aws/deploy.sh
```

5. Verify the API and frontend authentication flows before removing the temporary DNS record.

## Application rollback

`deploy.sh` automatically restores the previously running image when the new
container fails its health gate. Inspect the result with:

```bash
docker inspect --format '{{.Config.Image}} {{.State.Health.Status}}' toeic-green-api
docker logs --tail 100 toeic-green-api
```

## Infrastructure recovery

The EC2 host contains no authoritative application data. Recreate the stack,
restore the SSM parameters, point DNS to the new Elastic IP, and run the staging
deployment sequence.

## Cost audit

Check AWS Billing and Cost Management after provisioning, after 24 hours, and
weekly. The account must contain one running `t4g.small`, one 30 GB volume, one
associated Elastic IPv4, no load balancer, no NAT Gateway, no RDS, and no
ElastiCache resource.
````

- [ ] **Step 2: Review the runbook against the design**

Confirm the runbook preserves the production hostname, contains the old DNS value, avoids SSH, never prints secrets, and gives both application rollback and host recovery procedures.

- [ ] **Step 3: Commit Task 4 if auto-commit is enabled**

Check `.agent/config.yml`; with the current default:

```powershell
git add -- back-end/deploy/aws/README.md
git commit -m "docs: add AWS backend operations runbook"
```

### Task 5: Create and secure the AWS Free Plan account

**Files:** None.

- [ ] **Step 1: Create the account using Free Plan**

Open the official AWS signup flow, select **Free account plan**, use the owner's real billing identity, and complete payment-method verification. Pause for explicit user confirmation immediately before the final account-creation action because it is a financial-account action.

- [ ] **Step 2: Secure the root identity**

Enable MFA on the root user, verify the account email, and do not create root access keys.

- [ ] **Step 3: Create a non-root administrator**

Create `toeic-green-admin` with AWS Management Console access, attach `AdministratorAccess` for the migration period, require a password reset, and enable MFA. Sign out of root and continue using this administrator. After migration, replace broad access with a narrower operations policy.

- [ ] **Step 4: Confirm Free Plan state**

In Billing and Cost Management, record the plan expiration date, initial credit balance, and Free Tier status. Stop if the console does not show Free Plan and promotional credits.

- [ ] **Step 5: Commit Task 5 if auto-commit is enabled**

Check `.agent/config.yml`. This task changes no repository file, so there is nothing to stage or commit.

### Task 6: Provision AWS and transfer secrets without exposing values

**Files:** None.

- [ ] **Step 1: Create the CloudFormation stack**

In `ap-northeast-1`, create stack `toeic-green-backend` from `back-end/deploy/aws/cloudformation.yml`, supply the user's alert email, acknowledge IAM resource creation, and pause for explicit user confirmation immediately before submitting the stack because it creates billable cloud resources covered by the Free Plan.

Expected stack state: `CREATE_COMPLETE` with `InstanceId`, `ElasticIp`, and `/toeic-green/prod/` outputs.

- [ ] **Step 2: Confirm the budget subscription**

Open the AWS Budget subscription email and confirm it. Verify the budget excludes credits so it tracks gross resource usage.

- [ ] **Step 3: Create the ten SecureString parameters**

For each name listed in the runbook, read the latest value from the corresponding Google Secret Manager secret without printing it, place the value on the local clipboard, paste it into an SSM SecureString parameter, and clear the clipboard immediately. Use the default AWS managed SSM KMS key.

Mapping is one-to-one:

```text
JWT_SECRET          -> /toeic-green/prod/JWT_SECRET
JWT_REFRESH_SECRET  -> /toeic-green/prod/JWT_REFRESH_SECRET
DATABASE_URL        -> /toeic-green/prod/DATABASE_URL
DIRECT_URL          -> /toeic-green/prod/DIRECT_URL
REDIS_URL           -> /toeic-green/prod/REDIS_URL
R2_ACCOUNT_ID       -> /toeic-green/prod/R2_ACCOUNT_ID
R2_ACCESS_KEY       -> /toeic-green/prod/R2_ACCESS_KEY
R2_SECRET_KEY       -> /toeic-green/prod/R2_SECRET_KEY
RESEND_API_KEY      -> /toeic-green/prod/RESEND_API_KEY
GOOGLE_CLIENT_SECRET -> /toeic-green/prod/GOOGLE_CLIENT_SECRET
```

- [ ] **Step 4: Verify names and IAM access without reading values**

In Session Manager, run:

```bash
aws ssm get-parameters-by-path \
  --path /toeic-green/prod/ \
  --recursive \
  --region ap-northeast-1 \
  --query 'sort_by(Parameters,&Name)[].Name' \
  --output text
```

Expected: exactly the ten parameter names above; the output contains no secret values.

- [ ] **Step 5: Audit created AWS resources**

Confirm there is one EC2 instance, one EBS volume, one associated Elastic IPv4, one VPC, one public subnet, one security group, one instance role/profile, ten SSM parameters, and one budget. Confirm there is no NAT Gateway, load balancer, RDS, ElastiCache, or second EC2 instance.

- [ ] **Step 6: Commit Task 6 if auto-commit is enabled**

Check `.agent/config.yml`. This task changes external AWS state only, so there is nothing to stage or commit.

### Task 7: Deploy to the temporary hostname and validate production dependencies

**Files:** None.

- [ ] **Step 1: Create temporary DNS**

At the authoritative Hostinger DNS zone, create an A record:

```text
Name: aws-api
Value: CloudFormation ElasticIp output
TTL: 300
```

Do not change `api.toeicgreen.com` yet.

- [ ] **Step 2: Wait for authoritative DNS convergence**

Run until the result equals the Elastic IP:

```powershell
Resolve-DnsName aws-api.toeicgreen.com -Type A
```

- [ ] **Step 3: Deploy through Session Manager**

Run as root on EC2:

```bash
cd /opt/toeic-green/repo
chmod 0755 back-end/deploy/aws/render-env.sh back-end/deploy/aws/deploy.sh
API_HOST=aws-api.toeicgreen.com back-end/deploy/aws/deploy.sh
```

Expected: migration exits successfully, both containers are healthy, and both HTTPS health endpoints return HTTP 200.

- [ ] **Step 4: Run unauthenticated smoke tests**

Run:

```bash
curl --fail --silent --show-error https://aws-api.toeicgreen.com/api/health/live
curl --fail --silent --show-error https://aws-api.toeicgreen.com/api/health/ready
curl --fail --silent --show-error https://aws-api.toeicgreen.com/api/explore/collections >/dev/null
curl --fail --silent --show-error https://aws-api.toeicgreen.com/api/practice/tests >/dev/null
curl --include --request OPTIONS \
  --header 'Origin: https://toeicgreen.com' \
  --header 'Access-Control-Request-Method: GET' \
  https://aws-api.toeicgreen.com/api/explore/collections
```

Expected: health and public endpoints return 2xx; the preflight response allows `https://toeicgreen.com` and credentials.

- [ ] **Step 5: Exercise authenticated flows without changing existing data unexpectedly**

Use a dedicated test account to verify password login, Google login, access-token refresh, logout, one practice submission, one temporary vocabulary entry create/update/delete cycle, one progress update, and one avatar/media operation. Verify the temporary vocabulary entry is deleted at the end.

- [ ] **Step 6: Verify host recovery**

Reboot the EC2 instance from the console, wait for SSM availability, and verify that Docker, the API container, Caddy, TLS, liveness, readiness, and public endpoints recover without manually running deploy again.

- [ ] **Step 7: Commit Task 7 if auto-commit is enabled**

Check `.agent/config.yml`. This task changes DNS staging and AWS runtime state only, so there is nothing to stage or commit.

### Task 8: Cut production DNS over and verify the website

**Files:** None.

- [ ] **Step 1: Capture pre-cutover evidence**

Record the current production DNS value `ghs.googlehosted.com`, the Elastic IP, the temporary-host smoke-test results, the currently running image tag, and the CloudFormation stack state.

- [ ] **Step 2: Change the production record**

At Hostinger DNS, remove the `api.toeicgreen.com` CNAME and create:

```text
Type: A
Name: api
Value: CloudFormation ElasticIp output
TTL: 300
```

Pause for explicit user confirmation immediately before saving this DNS change because it redirects production traffic.

- [ ] **Step 3: Reconfigure Caddy for the production hostname**

On EC2:

```bash
cd /opt/toeic-green/repo
API_HOST=api.toeicgreen.com back-end/deploy/aws/deploy.sh
```

- [ ] **Step 4: Verify DNS and TLS**

Run locally:

```powershell
Resolve-DnsName api.toeicgreen.com -Type A
curl.exe --fail --silent --show-error https://api.toeicgreen.com/api/health/live
curl.exe --fail --silent --show-error https://api.toeicgreen.com/api/health/ready
curl.exe --fail --silent --show-error https://api.toeicgreen.com/api/explore/collections > $null
```

Expected: DNS returns the Elastic IP and all HTTPS requests succeed with a valid certificate.

- [ ] **Step 5: Verify the deployed Vercel frontend end to end**

Using `https://toeicgreen.com`, verify homepage rendering, explore collections, practice catalog, registration/login, Google login, refresh across a page reload, logout, practice submission, vocabulary mutation, R2 media, verification email, and password reset email.

- [ ] **Step 6: Observe stability before removing staging DNS**

For at least one normal usage window, review container health, restart counts, memory, disk, application errors, and AWS costs:

```bash
docker compose -f /opt/toeic-green/repo/back-end/deploy/aws/compose.yml ps
docker stats --no-stream
docker inspect --format '{{.RestartCount}}' toeic-green-api
df -h /
```

Remove `aws-api.toeicgreen.com` only after production remains healthy.

- [ ] **Step 7: Commit Task 8 if auto-commit is enabled**

Check `.agent/config.yml`. This task changes external production state only, so there is nothing to stage or commit.

### Task 9: Final verification and handoff

**Files:**
- Modify only if observed commands differ: `back-end/deploy/aws/README.md`

- [ ] **Step 1: Run the complete backend test suite**

Run from `back-end`:

```powershell
npm test -- --runInBand
npm run build
```

Expected: all tests PASS and the production build exits with code 0.

- [ ] **Step 2: Re-run repository and deployment validation**

Run:

```powershell
docker compose -f back-end/deploy/aws/compose.yml config --quiet
git diff --check
git status --short
```

Expected: Compose and diff checks pass; Git shows only intentional changes, if any.

- [ ] **Step 3: Verify AWS cost boundaries**

Confirm the Billing and Cost Management inventory contains only the planned resources, the budget subscription is confirmed, CPU credits are `standard`, the instance type is `t4g.small`, and the Free Plan/credit widgets remain active.

- [ ] **Step 4: Update the runbook only from observed reality**

If the actual AWS console labels or commands differ, edit `back-end/deploy/aws/README.md` to match the verified deployment. Do not document an untested command as working.

- [ ] **Step 5: Commit Task 9 if auto-commit is enabled**

Check `.agent/config.yml`. If the runbook changed:

```powershell
git add -- back-end/deploy/aws/README.md
git commit -m "docs: align AWS runbook with production"
```

If the runbook did not change, skip the commit.

- [ ] **Step 6: Deliver the handoff**

Report the production hostname, EC2 instance type and region, deployed Git commit, health-check results, test results, AWS resource inventory, cost controls, Free Plan expiration date, remaining credit, DNS rollback value, and the exact next review date. Do not report migration success until the public frontend and authenticated workflows have been exercised against AWS.
