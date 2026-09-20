# Runbook vận hành backend TOEIC Green trên AWS

Tài liệu này là quy trình bootstrap, triển khai, chuyển DNS, rollback và vận hành backend production. Mọi lệnh phải được chạy từ repository root, trừ khi một bước ghi rõ đang chạy trong phiên Session Manager trên EC2.

Các file triển khai có thẩm quyền là [cloudformation.yml](./cloudformation.yml), [deploy.sh](./deploy.sh), [render-env.sh](./render-env.sh), [compose.yml](./compose.yml) và [Caddyfile](./Caddyfile). Nếu runbook và code khác nhau, dừng triển khai và sửa runbook/code qua review; không ứng biến trực tiếp trên host.

## 1. Kiến trúc và giới hạn

Luồng production sau cutover:

```text
Vercel (toeicgreen.com / www.toeicgreen.com)
  -> https://api.toeicgreen.com
  -> Elastic IPv4 của AWS
  -> Caddy trên EC2 (TLS, reverse proxy)
  -> NestJS :2409 trong Docker Compose
```

- Region cố định: `ap-northeast-1`.
- Một EC2 ARM64 `t4g.small`, CPU credit `standard`, root EBS `gp3` 30 GB được mã hóa.
- Chỉ mở inbound TCP 80/443. Quản trị bằng AWS Systems Manager Session Manager; không mở SSH/22.
- Supabase PostgreSQL, Upstash Redis, Cloudflare R2 và Resend vẫn là dịch vụ ngoài AWS. Vercel vẫn host frontend.
- Một EC2 luôn chạy loại bỏ cold start của Cloud Run, nhưng **không phải high availability**. Host hỏng, reboot hoặc bị thay thế sẽ gây gián đoạn ngắn cho đến khi host và container phục hồi.
- AWS Budget chỉ gửi thông báo; không phải hard spending cap và không tự dừng/xóa tài nguyên.
- CloudFormation chỉ bootstrap host, Docker/Compose/SSM agent, swap và clone repository. Stack `CREATE_COMPLETE` không có nghĩa ứng dụng đã chạy. Chỉ deploy ứng dụng thủ công sau khi secret và staging DNS đã sẵn sàng.

## 2. Điều kiện tài khoản AWS

Trước khi tạo tài nguyên:

- Tạo **tài khoản AWS Free Plan mới** dành cho migration này.
- Mở Billing and Cost Management và ghi lại đúng số credit còn lại cùng ngày hết hạn Free Plan mà AWS hiển thị. Không suy ra từ ngày tạo account và không điền số/ngày ước đoán.
- Bật MFA cho root, không tạo root access key, và không dùng root cho thao tác hằng ngày.
- Tạo principal quản trị không phải root, bật MFA và chỉ dùng quyền admin trong thời gian migration. Sau khi ổn định, lập kế hoạch giảm quyền theo least privilege.
- Chọn region `ap-northeast-1` trên console và AWS CLI.
- Kiểm tra trực tiếp trong account rằng `t4g.small` và các tài nguyên dự kiến có đủ điều kiện Free Plan/free trial **trước** khi provision. Không giả định eligibility giống account khác.
- Xác nhận email nhận cảnh báo Budget chính xác, truy cập được và không bị lọc spam. Sau provision, đối chiếu email này với parameter `AlertEmail` của stack.

## 3. Preflight repository và release

Host chỉ deploy commit đã được audit, merge và push lên `origin/main`. Không deploy một commit chỉ tồn tại ở máy local.

Yêu cầu công cụ/quyền truy cập:

- Git và quyền push/đọc repository GitHub public được cấu hình trong stack.
- AWS CLI đã đăng nhập, hoặc AWS CloudShell, với quyền CloudFormation/EC2/IAM/SSM/Budgets cần thiết.
- Quyền sửa DNS của `toeicgreen.com` tại Hostinger.
- Quyền đọc giá trị secret hiện tại ở GCP Secret Manager, Supabase, Upstash, R2, Resend và Google OAuth.
- `dig`, `curl` và trình duyệt để xác minh DNS/TLS/luồng người dùng.

Sau khi thay đổi đã merge/push, trên checkout sạch của `main`:

```bash
git fetch --prune origin main
git switch main
git status --short
git rev-parse --verify 'HEAD^{commit}'
git merge-base --is-ancestor HEAD origin/main
```

Điều kiện go:

- `git status --short` không có output.
- `git merge-base` trả exit code 0.
- `git rev-parse` trả đúng SHA-1 40 ký tự. Ghi nguyên SHA này vào evidence record dưới tên `DEPLOY_SHA`.

`deploy.sh` kiểm tra lại các điều kiện release trên host: working tree phải sạch, `DEPLOY_SHA` phải là đúng 40 ký tự, script tự fetch `origin/main`, commit phải resolve chính xác và phải reachable từ `origin/main`. Sau đó script checkout detached commit đó. Không cập nhật checkout thủ công trên host.

## 4. Validate và tạo CloudFormation stack

Các lệnh sau chạy từ repository root trong Bash/CloudShell. Thay email bằng địa chỉ vận hành thật; email không phải secret nhưng phải đúng người nhận.

```bash
export AWS_REGION=ap-northeast-1
export STACK_NAME=toeic-green-backend
export ALERT_EMAIL='operator@example.com'
export REPOSITORY_URL='https://github.com/Caubeamap/toeic-green.git'

aws cloudformation validate-template \
  --template-body file://back-end/deploy/aws/cloudformation.yml \
  --region "$AWS_REGION"

aws cloudformation deploy \
  --template-file back-end/deploy/aws/cloudformation.yml \
  --stack-name "$STACK_NAME" \
  --region "$AWS_REGION" \
  --capabilities CAPABILITY_NAMED_IAM \
  --parameter-overrides \
    AlertEmail="$ALERT_EMAIL" \
    RepositoryUrl="$REPOSITORY_URL" \
    RepositoryBranch=main

aws cloudformation wait stack-create-complete \
  --stack-name "$STACK_NAME" \
  --region "$AWS_REGION"

aws cloudformation describe-stacks \
  --stack-name "$STACK_NAME" \
  --region "$AWS_REGION" \
  --query 'Stacks[0].[StackStatus,Parameters,Outputs]' \
  --output json
```

`aws cloudformation deploy` vốn đã chờ changeset hoàn tất; lệnh `wait stack-create-complete` là gate tường minh cho lần tạo đầu tiên. Với lần update stack sau này, dùng `aws cloudformation wait stack-update-complete` thay thế.

Lấy và ghi lại hai output bắt buộc:

```bash
export INSTANCE_ID="$(aws cloudformation describe-stacks \
  --stack-name "$STACK_NAME" --region "$AWS_REGION" \
  --query "Stacks[0].Outputs[?OutputKey=='InstanceId'].OutputValue | [0]" \
  --output text)"

export ELASTIC_IP="$(aws cloudformation describe-stacks \
  --stack-name "$STACK_NAME" --region "$AWS_REGION" \
  --query "Stacks[0].Outputs[?OutputKey=='ElasticIp'].OutputValue | [0]" \
  --output text)"

printf 'InstanceId=%s\nElasticIp=%s\n' "$INSTANCE_ID" "$ELASTIC_IP"
```

### Ý nghĩa `CreationPolicy`

`ApiInstance` chỉ hoàn thành khi user-data gọi `cfn-signal` thành công trong tối đa 15 phút. Signal chỉ chứng minh host đã cài và kiểm tra Docker, Docker Compose `2.39.4`, SSM agent, swap và repository clone. Nó không đọc secret, không chạy migration, không start NestJS/Caddy và không chứng minh DNS/TLS hoạt động.

Nếu stack fail/rollback, xem event và bootstrap log trước khi retry:

```bash
aws cloudformation describe-stack-events \
  --stack-name "$STACK_NAME" \
  --region "$AWS_REGION" \
  --max-items 50
```

### Xác minh host bootstrap

Chờ SSM báo `Online`:

```bash
aws ssm describe-instance-information \
  --region "$AWS_REGION" \
  --filters "Key=InstanceIds,Values=$INSTANCE_ID" \
  --query 'InstanceInformationList[0].[InstanceId,PingStatus,PlatformName,AgentVersion]' \
  --output table
```

Kết nối theo một trong hai cách:

- Console: **EC2 > Instances > chọn instance > Connect > Session Manager > Connect**.
- AWS CLI:

```bash
aws ssm start-session --target "$INSTANCE_ID" --region "$AWS_REGION"
```

Trong phiên Session Manager:

```bash
sudo -i
systemctl is-active docker
systemctl is-active amazon-ssm-agent
docker info >/dev/null && echo 'docker: ok'
docker compose version
swapon --show
git -C /opt/toeic-green/repo status --short
cloud-init status --long
journalctl -u cloud-final -b --no-pager -n 200
tail -n 200 /var/log/cloud-init-output.log
```

Không tiếp tục nếu Docker hoặc SSM agent không active, Compose không đúng `2.39.4`, cloud-init báo lỗi, hoặc repository không sạch.

## 5. Tạo và xác minh secret trong SSM Parameter Store

`render-env.sh` yêu cầu chính xác 10 parameter sau:

| GCP Secret Manager hiện tại | AWS SSM Parameter Store |
|---|---|
| `JWT_SECRET` | `/toeic-green/prod/JWT_SECRET` |
| `JWT_REFRESH_SECRET` | `/toeic-green/prod/JWT_REFRESH_SECRET` |
| `DATABASE_URL` | `/toeic-green/prod/DATABASE_URL` |
| `DIRECT_URL` | `/toeic-green/prod/DIRECT_URL` |
| `REDIS_URL` | `/toeic-green/prod/REDIS_URL` |
| `R2_ACCOUNT_ID` | `/toeic-green/prod/R2_ACCOUNT_ID` |
| `R2_ACCESS_KEY` | `/toeic-green/prod/R2_ACCESS_KEY` |
| `R2_SECRET_KEY` | `/toeic-green/prod/R2_SECRET_KEY` |
| `RESEND_API_KEY` | `/toeic-green/prod/RESEND_API_KEY` |
| `GOOGLE_CLIENT_SECRET` | `/toeic-green/prod/GOOGLE_CLIENT_SECRET` |

Đây là ánh xạ 1:1 đã được khai báo trong `deploy-cloudrun.sh` và `create-secrets.sh`; không đổi tên và không tạo thêm suffix như `_AWS` hay `_PROD`.

### Cách nhập an toàn

Ưu tiên AWS Console: **Systems Manager > Parameter Store > Create parameter**. Với từng parameter:

- Name: đúng full path trong bảng.
- Tier: `Standard`.
- Type: `SecureString`.
- KMS key source: key mặc định do AWS quản lý, `alias/aws/ssm`.
- Value: copy trực tiếp từ nguồn bí mật được ủy quyền vào trường được che trên console.

Không đặt plaintext secret trong command line, shell history, Git, CloudFormation parameter, ticket, screenshot hoặc transcript. Không echo/log giá trị. Không mở, `cat`, copy hoặc đính kèm `/opt/toeic-green/runtime/backend.env`; file này chứa plaintext đã giải mã trên host và được giữ mode `0600`.

### Xác minh metadata, không giải mã value

Chạy bên ngoài host bằng principal vận hành. `describe-parameters` không trả value:

```bash
aws ssm describe-parameters \
  --region ap-northeast-1 \
  --parameter-filters \
    'Key=Name,Option=BeginsWith,Values=/toeic-green/prod/' \
  --query 'sort_by(Parameters,&Name)[].[Name,Type,Tier,KeyId]' \
  --output table

aws ssm describe-parameters \
  --region ap-northeast-1 \
  --parameter-filters \
    'Key=Name,Option=BeginsWith,Values=/toeic-green/prod/' \
  --query 'length(Parameters)' \
  --output text
```

Gate: count bằng `10`; danh sách tên khớp chính xác bảng; mọi row là `SecureString`, `Standard`, dùng `alias/aws/ssm`. Không dùng `get-parameter --with-decryption` để kiểm tra thủ công.

## 6. Staging DNS và deploy đầu tiên

### Tạo DNS staging

Tại Hostinger tạo:

- Type: `A`
- Name: `aws-api`
- Value: output `ElasticIp`
- TTL: `300`

Chờ authoritative DNS và resolver công cộng cùng trả đúng EIP:

```bash
export EXPECTED_IP='<ElasticIp-output>'
export AUTH_NS="$(dig +short NS toeicgreen.com | head -n 1)"

dig +noall +answer @"$AUTH_NS" aws-api.toeicgreen.com A
dig +short @1.1.1.1 aws-api.toeicgreen.com A
dig +short @8.8.8.8 aws-api.toeicgreen.com A
```

Không deploy trước khi cả ba kết quả là `$EXPECTED_IP`.

### Deploy SHA đã audit

Mở Session Manager, sau đó chạy trên EC2:

```bash
sudo -i
cd /opt/toeic-green/repo
DEPLOY_SHA=<40-char-audited-commit-sha> REPOSITORY_BRANCH=main API_HOSTS=aws-api.toeicgreen.com back-end/deploy/aws/deploy.sh
```

Interface hiện tại là `API_HOSTS` số nhiều. Script giữ host-wide non-blocking lock tại `/opt/toeic-green/runtime/deploy.lock`; một deploy thứ hai sẽ bị từ chối thay vì chạy chồng. Release là immutable theo SHA, checkout detached, image API được tag bằng 12 ký tự đầu của SHA.

Script sẽ render secret từ SSM, build API/migrator, chạy `prisma migrate deploy`, chỉ thay API sau health gate, validate/recreate Caddy rồi kiểm tra live/ready qua từng hostname trong `API_HOSTS`.

Các lệnh inspect không hiển thị secret:

```bash
cd /opt/toeic-green/repo
git rev-parse HEAD
git status --short
docker ps --format 'table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}'
docker inspect --format '{{.Name}} image={{.Config.Image}} health={{if .State.Health}}{{.State.Health.Status}}{{else}}n/a{{end}} restart={{.HostConfig.RestartPolicy.Name}}' toeic-green-api toeic-green-caddy
docker logs --tail 100 toeic-green-api
docker logs --tail 100 toeic-green-caddy
docker stats --no-stream
df -h /
docker system df
```

Review log tại chỗ trước khi chia sẻ vì dữ liệu request/application có thể nhạy cảm. Tuyệt đối không dùng `docker inspect` để in `.Config.Env` và không đọc `backend.env`.

## 7. Gate staging bắt buộc

Không cut over production nếu bất kỳ mục nào fail hoặc chưa có evidence.

### Health, TLS và CORS

```bash
curl --fail --silent --show-error https://aws-api.toeicgreen.com/api/health/live
curl --fail --silent --show-error https://aws-api.toeicgreen.com/api/health/ready

curl --silent --show-error --dump-header - --output /dev/null \
  --request OPTIONS \
  --header 'Origin: https://toeicgreen.com' \
  --header 'Access-Control-Request-Method: GET' \
  https://aws-api.toeicgreen.com/api/health/live

curl --silent --show-error --dump-header - --output /dev/null \
  --request OPTIONS \
  --header 'Origin: https://www.toeicgreen.com' \
  --header 'Access-Control-Request-Method: GET' \
  https://aws-api.toeicgreen.com/api/health/live
```

Hai preflight phải trả `access-control-allow-origin` đúng origin gửi vào và `access-control-allow-credentials: true`; không chấp nhận wildcard.

### Luồng người dùng và external providers

Dùng một test account riêng, dữ liệu nhận diện giả và kế hoạch cleanup rõ ràng:

- Đăng ký, nhận email xác minh qua Resend, xác minh email, đăng nhập bằng mật khẩu, refresh token và logout.
- Trong DevTools, xác nhận cookie `refresh_token` có `Secure`, `HttpOnly`, `SameSite=Strict`, `Domain=.toeicgreen.com`, `Path=/`; logout phải xóa đúng cookie.
- Kiểm tra Google login bằng **luồng Google Identity Services authorization code hiện tại**: frontend nhận `code`, backend `POST /api/auth/google` đổi code và tạo session. Không giả định hoặc thêm OAuth callback route không có trong ứng dụng.
- Đọc và ghi Supabase bằng test account; kiểm tra dữ liệu được giữ sau refresh/login lại, rồi cleanup dữ liệu test theo quy trình ứng dụng.
- Hoàn thành một thao tác practice và một thao tác vocabulary; refresh/re-login và xác nhận persistence.
- Đọc ít nhất một media R2 đã tồn tại. Thực hiện một upload/delete có kiểm soát hoặc avatar flow, xác nhận URL đọc được và cleanup object test.
- Chạy cả email verification và forgot/reset password qua Resend, kiểm tra link/OTP và hoàn tất flow.
- Kiểm tra throttling có kiểm soát trên test account/IP: vượt limit của endpoint test phải nhận `429`; thử từ client/network thứ hai phải không bị gom nhầm. Xác minh qua Caddy rằng client IP/forwarded IP hoạt động với `TRUST_PROXY=1`, không dùng spoofed header làm bằng chứng duy nhất.
- Kiểm tra log API/Caddy không có exception lặp, `docker stats --no-stream`, `free -h`, `swapon --show`, `df -h /` và `docker system df`.

### Reboot/recovery bắt buộc

Trên host:

```bash
sudo reboot
```

Session sẽ ngắt. Từ CloudShell/local chờ EC2 status checks và SSM:

```bash
aws ec2 wait instance-status-ok \
  --instance-ids "$INSTANCE_ID" \
  --region ap-northeast-1

aws ssm describe-instance-information \
  --region ap-northeast-1 \
  --filters "Key=InstanceIds,Values=$INSTANCE_ID" \
  --query 'InstanceInformationList[0].[PingStatus,AgentVersion]' \
  --output table
```

Kết nối lại bằng Session Manager và xác minh Docker cùng hai container runtime:

```bash
sudo -i
systemctl is-active docker
systemctl is-active amazon-ssm-agent
docker inspect --format '{{.Name}} running={{.State.Running}} health={{if .State.Health}}{{.State.Health.Status}}{{else}}n/a{{end}}' toeic-green-api toeic-green-caddy
curl --fail --silent --show-error https://aws-api.toeicgreen.com/api/health/live
curl --fail --silent --show-error https://aws-api.toeicgreen.com/api/health/ready
```

TLS, SSM, API và Caddy đều phải tự phục hồi sau reboot.

## 8. Cutover DNS/TLS với dual hosts

### Chuẩn bị TTL và rollback value

Giá trị rollback đang biết là CNAME `ghs.googlehosted.com`, nhưng operator phải query authoritative DNS và xác nhận lại ngay trước cutover:

```bash
export AUTH_NS="$(dig +short NS toeicgreen.com | head -n 1)"
date -u
dig +noall +answer @"$AUTH_NS" api.toeicgreen.com CNAME
```

Ghi cả value, TTL và timestamp vào evidence record. TTL từng quan sát là `14400` giây (4 giờ), nhưng phải dùng TTL vừa query, không mặc định 4 giờ.

Tại Hostinger hạ TTL của record hiện tại xuống `300`, sau đó chờ ít nhất **một toàn bộ OLD TTL interval** trước khi đổi record. Việc thấy authoritative TTL mới không làm hết hạn cache CNAME cũ đang nằm ở resolver khác.

### Nạp dual-host Caddy trước khi đổi DNS

Trên EC2, chạy cùng release SHA đã audit:

```bash
sudo -i
cd /opt/toeic-green/repo
DEPLOY_SHA=<40-char-audited-commit-sha> REPOSITORY_BRANCH=main API_HOSTS=aws-api.toeicgreen.com,api.toeicgreen.com back-end/deploy/aws/deploy.sh

docker exec toeic-green-caddy caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile
curl --fail --silent --show-error https://aws-api.toeicgreen.com/api/health/live
curl --fail --silent --show-error https://aws-api.toeicgreen.com/api/health/ready
```

Ở thời điểm này `api.toeicgreen.com` vẫn trỏ Cloud Run. Public health check cho hostname production chỉ chứng minh endpoint cũ còn khỏe; nó chưa chứng minh request đi qua EC2. Caddy có thể load cấu hình dual hosts, nhưng certificate cho `api.toeicgreen.com` chỉ có thể issue sau khi DNS hostname đó trỏ đến EC2 và CA truy cập được cổng 80/443.

### Đổi production DNS

Tại Hostinger, xóa CNAME `api -> ghs.googlehosted.com` và tạo:

- Type: `A`
- Name: `api`
- Value: output `ElasticIp`
- TTL: `300`

Không để CNAME và A cùng tồn tại ở cùng hostname. Theo dõi authoritative và resolver công cộng đến khi cùng trả EIP và không còn CNAME:

```bash
dig +noall +answer @"$AUTH_NS" api.toeicgreen.com A
dig +noall +answer @"$AUTH_NS" api.toeicgreen.com CNAME
dig +short @1.1.1.1 api.toeicgreen.com A
dig +short @8.8.8.8 api.toeicgreen.com A

curl --fail --silent --show-error https://api.toeicgreen.com/api/health/live
curl --fail --silent --show-error https://api.toeicgreen.com/api/health/ready

openssl s_client -connect api.toeicgreen.com:443 -servername api.toeicgreen.com </dev/null 2>/dev/null \
  | openssl x509 -noout -subject -issuer -dates
```

Mở frontend Vercel tại cả apex và `www`, xác nhận request thực tế đi tới `https://api.toeicgreen.com`, rồi lặp lại login, refresh, logout và một read/write flow end-to-end.

Theo dõi tối thiểu 30 phút trước khi xóa staging DNS. Lệnh sau tạo 7 mốc cách nhau 5 phút:

```bash
for i in $(seq 1 7); do
  date -u
  curl --fail --silent --show-error https://api.toeicgreen.com/api/health/live
  curl --fail --silent --show-error https://api.toeicgreen.com/api/health/ready
  if [ "$i" -lt 7 ]; then sleep 300; fi
done
```

Trong cửa sổ đó, kiểm tra Vercel end-to-end, `docker stats --no-stream`, disk và log API/Caddy. Chỉ xóa A record `aws-api` khi production ổn định và evidence hoàn tất.

## 9. Rollback và recovery

### Transaction của application deploy

Trước khi thay đổi, `deploy.sh` tạo snapshot mode `0700` dạng `/opt/toeic-green/runtime/rollback.XXXXXX`. Snapshot có previous HEAD, previous image, previous Compose/Caddy và bản sao `backend.env` mode `0600`.

- Lỗi lúc checkout/render/build/migration/candidate chưa healthy: script cố phục hồi environment, repository checkout và API image trước. Khi phục hồi hoàn tất, snapshot được xóa.
- Nếu API candidate đã healthy nhưng Caddy validation/start hoặc public routing check fail: script **giữ candidate khỏe**, giữ recovery snapshot và in path để chẩn đoán routing. Đây là routing-only failure; không tự thay một API khỏe bằng image cũ.
- Nếu automatic recovery không hoàn tất: snapshot được giữ. Dừng thao tác và điều tra trước khi deploy tiếp.

Inspect an toàn, không đọc secret:

```bash
sudo find /opt/toeic-green/runtime -maxdepth 1 -type d -name 'rollback.*' -printf '%M %u:%g %p\n'
export RECOVERY_DIR='/opt/toeic-green/runtime/rollback.REPLACE_ME'
sudo find "$RECOVERY_DIR" -maxdepth 1 -type f ! -name backend.env -printf '%M %u:%g %f\n'
sudo awk 'FNR==1 { print FILENAME ": " $0 }' \
  "$RECOVERY_DIR/previous-head" \
  "$RECOVERY_DIR/previous-image" \
  "$RECOVERY_DIR/had-previous-env"
docker inspect --format '{{.Config.Image}} {{if .State.Health}}{{.State.Health.Status}}{{end}}' toeic-green-api
docker logs --tail 100 toeic-green-api
docker logs --tail 100 toeic-green-caddy
```

Không in, `cat` hoặc copy `$RECOVERY_DIR/backend.env`. Không tự xóa snapshot khi incident chưa kết thúc.

Nếu cần redeploy release trước và schema vẫn tương thích, dùng chính interface hiện tại:

```bash
cd /opt/toeic-green/repo
DEPLOY_SHA=<previous-40-char-sha-reachable-from-origin-main> REPOSITORY_BRANCH=main API_HOSTS=aws-api.toeicgreen.com,api.toeicgreen.com back-end/deploy/aws/deploy.sh
```

Không checkout/chạy container thủ công để “rollback”. Database migration theo quy tắc **forward-only expand/contract**: rollback image không đảo schema. Migration trong đợt chuyển hạ tầng này không được destructive (drop/rename/bắt buộc field mới theo cách làm image cũ hỏng).

### DNS rollback

Nếu cần trả traffic về Cloud Run và Cloud Run vẫn hoạt động:

1. Ghi evidence lỗi và xác nhận lại rollback target đã lưu.
2. Tại Hostinger xóa A record `api -> <ElasticIp>`.
3. Tạo lại CNAME `api -> ghs.googlehosted.com` với TTL `300`.
4. Kiểm tra authoritative DNS, `1.1.1.1`, `8.8.8.8`, TLS, live/ready và Vercel end-to-end.

Resolver có thể giữ A record đến hết TTL trước đó; DNS rollback không tức thời. `ghs.googlehosted.com` phải được operator xác nhận ngay trước cutover, và Cloud Run/billing phải còn hoạt động thì rollback DNS mới hữu dụng.

### Host hỏng hoặc bị thay thế

1. Xác nhận Supabase/Upstash/R2/Resend không bị ảnh hưởng; chúng là nguồn dữ liệu/dịch vụ ngoài host.
2. Nếu update trong cùng stack thay instance, EIP có thể được reassociate nhưng vẫn có một khoảng outage. Root EBS `DeleteOnTermination: true`; local image, log, repo và Caddy certificate cache trên host cũ không phải backup.
3. Chờ `CreationPolicy` của host mới, xác minh SSM/Docker/cloud-init.
4. SSM parameters nằm ngoài stack và phải còn đủ đúng 10 secret.
5. Xác minh EIP output hiện tại. Nếu stack bị xóa/tạo lại, EIP sẽ đổi; cập nhật staging/production DNS tương ứng.
6. Chạy staging deployment, toàn bộ staging gate và reboot gate; sau đó mới cut over/recover production.

## 10. Chi phí và vận hành định kỳ

### Inventory do stack tạo

- 1 VPC, 1 Internet Gateway, 1 public subnet, 1 route table/default route/association.
- 1 security group chỉ mở inbound 80/443.
- 1 IAM role, 1 instance profile, 1 launch template.
- 1 EC2 ARM64 `t4g.small` với CPU credit `standard`.
- 1 encrypted root EBS `gp3` 30 GB, xóa khi instance terminate.
- 1 Elastic IPv4 và association.
- 1 AWS Budget tên `toeic-green-gross-cost`, limit USD 10/tháng.

Stack không tạo NAT Gateway, load balancer, Auto Scaling Group, RDS, ElastiCache hay Route 53 hosted zone.

Budget dùng `IncludeCredit: false` và `IncludeRefund: false`; thông báo tương ứng:

- 50% actual = USD 5 actual gross cost.
- 80% actual = USD 8 actual gross cost.
- 100% forecasted = forecast tương đương USD 10.

AWS cost/budget data có độ trễ; email không phải real-time và không tự stop resource. Kiểm tra Billing, Free Tier/Free Plan và credit: ngay sau provision, sau 24 giờ, rồi hằng tuần. Mỗi lần ghi lại credit còn lại, ngày hết hạn đúng như Billing hiển thị, spend theo service và thay đổi eligibility.

### Checklist định kỳ

- Hằng tuần: `df -h /`, `docker system df`, `docker stats --no-stream`, kích thước/log rotation và build cache. Compose giới hạn log mỗi container ở `10m x 3`; deploy chỉ prune BuildKit cache cũ hơn 168 giờ.
- Hằng tuần: `systemctl is-active amazon-ssm-agent` và `aws ssm describe-instance-information` báo `Online`.
- Thiết lập lịch patch Amazon Linux và reboot có kiểm soát ít nhất hằng tháng, hoặc sớm hơn cho bản vá critical; chạy lại reboot/recovery gate sau patch.
- Thiết lập external uptime monitoring cho cả `/api/health/live` và `/api/health/ready`, từ ngoài AWS, kèm cảnh báo cho operator.
- Theo dõi Supabase connection pool, Upstash rate/usage, R2 và Resend quota độc lập với AWS.

Stop EC2 vẫn để EBS tồn tại và có thể vẫn phát sinh phí; Elastic IPv4/public IPv4 cũng có thể tính phí tùy trạng thái/account. Terminate instance xóa root EBS nhưng có thể để stack drift/EIP tiếp tục tồn tại. Chỉ xóa stack khi đã có quyết định backup/recovery, DNS rollback và chấp nhận EIP thay đổi; không dùng stack deletion như một nút “tạm dừng chi phí”.

## 11. Go/no-go và evidence record

### Go/no-go cuối

- [ ] AWS Free Plan credit/ngày hết hạn và `t4g.small` eligibility đã được xác nhận trong account.
- [ ] Root MFA bật, không có root access key; operator không phải root và có MFA.
- [ ] Budget email, alert thresholds và Billing inventory đã được kiểm tra.
- [ ] Release đã merge/push vào `origin/main`; working tree sạch; SHA 40 ký tự reachable và đã audit.
- [ ] Stack complete; `InstanceId`, `ElasticIp`, SSM `Online`, Docker/Compose/cloud-init đều đạt.
- [ ] Đủ đúng 10 SSM `SecureString` Standard dùng `alias/aws/ssm`; không lộ value.
- [ ] Staging A record authoritative/public trỏ đúng EIP; staging TLS live/ready đạt.
- [ ] CORS apex/www; password auth; refresh/logout/cookie; GIS code flow đều đạt.
- [ ] Supabase read/write/cleanup; practice/vocabulary persistence đạt.
- [ ] R2 read và controlled write/delete; Resend verification/reset đạt.
- [ ] Throttling/forwarded IP, log, memory, swap, disk và build cache đạt.
- [ ] Reboot gate: SSM, Docker, API, Caddy, TLS, live/ready tự phục hồi.
- [ ] Rollback CNAME và old TTL được query lại, ghi timestamp; đã chờ đủ old TTL.
- [ ] Caddy dual hosts valid; staging vẫn khỏe trước cutover.
- [ ] Sau cutover: authoritative/public DNS, TLS, live/ready, Vercel end-to-end đạt.
- [ ] Theo dõi ít nhất 30 phút không có regression; chỉ sau đó mới xóa staging DNS.

Chỉ **GO** khi tất cả ô đều đạt. Một ô fail hoặc thiếu evidence là **NO-GO**.

### Mẫu evidence record

```text
Migration date/time UTC:
Operator:
AWS account ID:
Region: ap-northeast-1
Free Plan credit remaining:
Free Plan expiration shown in Billing:
t4g.small eligibility evidence:
Budget alert email confirmed:

Repository URL:
Branch: main
Audited DEPLOY_SHA (40 chars):
origin/main reachability checked at:

Stack name: toeic-green-backend
Stack status:
InstanceId:
ElasticIp:
SSM PingStatus / agent version:
Docker / Compose versions:
Cloud-init result:
SSM parameter metadata result (10/10, SecureString, Standard, alias/aws/ssm):

Staging authoritative/public DNS:
Staging live / ready / TLS:
CORS apex / www:
Registration / verification / password login:
Refresh / logout / cookie attributes:
Google GIS authorization-code login:
Supabase read-write-cleanup:
Practice / vocabulary persistence:
R2 read / controlled upload-delete cleanup:
Resend verification / reset:
Throttling / forwarded IP:
Logs / memory / swap / disk / Docker storage:
Reboot recovery (SSM, Docker, API, Caddy, TLS, live, ready):

Rollback DNS value: ghs.googlehosted.com (re-confirmed value):
Rollback value checked at UTC:
OLD TTL observed:
TTL lowered to 300 at UTC:
Full OLD TTL wait completed at UTC:
Dual-host deploy/Caddy validation:
Production authoritative/public DNS:
Production TLS / live / ready:
Vercel end-to-end flows:
30-minute observation start/end:

AWS cost state immediately after provision:
AWS cost state after 24h:
Next weekly billing review:
Decision: GO / NO-GO
Open issues / owner / deadline:
```
