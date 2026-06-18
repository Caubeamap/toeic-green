export type TransactionalEmailTemplate = {
  subject: string;
  html: string;
  text: string;
};

type VerificationTemplateParams = {
  verificationUrl: string;
};

type PasswordResetTemplateParams = {
  otp: string;
};

const brandName = 'TOEIC Green';

export function buildEmailVerificationTemplate({
  verificationUrl,
}: VerificationTemplateParams): TransactionalEmailTemplate {
  const subject = 'Xác minh email để bắt đầu học trên TOEIC Green';
  const preheader =
    'Hoàn tất bước cuối cùng để kích hoạt tài khoản TOEIC Green của bạn.';

  const content = `
    ${heroBlock({
      label: 'Tài khoản mới',
      title: 'Chỉ còn một bước nữa',
      lead: 'Chào bạn, cảm ơn bạn đã tạo tài khoản TOEIC Green. Hãy xác minh email này để tài khoản được kích hoạt đầy đủ và sẵn sàng lưu tiến độ học của bạn.',
    })}
    ${buttonBlock('Xác minh email', verificationUrl)}
    ${infoPanel(`
      <strong>Liên kết có hiệu lực trong 24 giờ.</strong><br />
      Sau khi xác minh, bạn có thể đăng nhập và tiếp tục học với tài khoản vừa tạo.
    `)}
    ${securityNote(
      'Nếu bạn không đăng ký tài khoản TOEIC Green, bạn có thể bỏ qua email này. Không có thay đổi nào được thực hiện nếu email chưa được xác minh.',
    )}
  `;

  return {
    subject,
    html: renderShell({ preheader, content }),
    text: [
      'Chào bạn,',
      '',
      'Cảm ơn bạn đã tạo tài khoản TOEIC Green. Hãy mở email này ở chế độ HTML và bấm nút xác minh email để kích hoạt tài khoản.',
      '',
      'Liên kết có hiệu lực trong 24 giờ.',
      '',
      'Nếu bạn không đăng ký tài khoản TOEIC Green, bạn có thể bỏ qua email này.',
      '',
      'TOEIC Green',
    ].join('\n'),
  };
}

export function buildPasswordResetTemplate({
  otp,
}: PasswordResetTemplateParams): TransactionalEmailTemplate {
  const subject = 'Mã đặt lại mật khẩu TOEIC Green của bạn';
  const preheader = `Mã xác nhận ${otp} có hiệu lực trong 10 phút.`;

  const content = `
    ${heroBlock({
      label: 'Bảo mật tài khoản',
      title: 'Mã xác nhận của bạn',
      lead: 'Bạn vừa yêu cầu đặt lại mật khẩu cho tài khoản TOEIC Green. Nhập mã 6 số bên dưới vào màn hình quên mật khẩu để tiếp tục.',
    })}
    ${otpBlock(otp)}
    ${infoPanel(`
      Mã này có hiệu lực trong <strong>10 phút</strong> và chỉ dùng được một lần.
      Hãy quay lại trang quên mật khẩu đang mở trên trình duyệt và nhập mã OTP này để tiếp tục.
      <br />
      Vì lý do bảo mật, TOEIC Green sẽ không bao giờ hỏi mật khẩu hiện tại của bạn qua email.
    `)}
    ${securityNote(
      'Nếu không phải bạn yêu cầu đặt lại mật khẩu, cứ bỏ qua email này. Mật khẩu hiện tại của bạn vẫn chưa bị thay đổi.',
    )}
  `;

  return {
    subject,
    html: renderShell({ preheader, content }),
    text: [
      'Chào bạn,',
      '',
      'Bạn vừa yêu cầu đặt lại mật khẩu cho tài khoản TOEIC Green.',
      `Mã xác nhận của bạn là: ${otp}`,
      '',
      'Mã có hiệu lực trong 10 phút và chỉ dùng được một lần.',
      'Hãy quay lại trang quên mật khẩu đang mở trên trình duyệt và nhập mã OTP này để tiếp tục.',
      '',
      'Nếu không phải bạn yêu cầu đặt lại mật khẩu, hãy bỏ qua email này. Mật khẩu hiện tại của bạn vẫn chưa bị thay đổi.',
      '',
      'TOEIC Green',
    ].join('\n'),
  };
}

function renderShell({
  preheader,
  content,
}: {
  preheader: string;
  content: string;
}) {
  return `<!doctype html>
<html lang="vi">
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="color-scheme" content="light" />
    <meta name="supported-color-schemes" content="light" />
    <title>${brandName}</title>
  </head>
  <body style="margin:0;padding:0;background:#f4faf6;color:#18352a;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;line-height:1px;">
      ${escapeHtml(preheader)}
    </div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f4faf6;padding:32px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:620px;">
            <tr>
              <td style="padding:0 0 18px 0;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                  <tr>
                    <td style="padding-right:10px;">
                      <div style="width:36px;height:36px;border-radius:11px;background:#148a4f;color:#ffffff;font-size:13px;line-height:36px;font-weight:700;text-align:center;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
                        TG
                      </div>
                    </td>
                    <td style="font-size:20px;line-height:24px;font-weight:700;color:#148a4f;letter-spacing:0;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
                      TOEIC Green
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="border:1px solid #dcebe2;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 18px 50px rgba(18,78,48,0.10);">
                <div style="height:8px;background:#148a4f;background:linear-gradient(90deg,#148a4f 0%,#41b883 55%,#8fd26c 100%);font-size:1px;line-height:1px;">&nbsp;</div>
                <div style="padding:32px 30px 30px 30px;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
                  ${content}
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:18px 4px 0 4px;text-align:center;font-size:12px;line-height:18px;color:#6a7c71;">
                Email này được gửi tự động từ TOEIC Green. Bạn không cần trả lời email này.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function heroBlock({
  label,
  title,
  lead,
}: {
  label: string;
  title: string;
  lead: string;
}) {
  return `
    <div style="margin:0 0 24px 0;">
      <div style="display:inline-block;margin:0 0 14px 0;padding:7px 12px;border-radius:999px;background:#e8f7ed;color:#148a4f;font-size:12px;line-height:16px;font-weight:700;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
        ${escapeHtml(label)}
      </div>
      <h1 style="margin:0;color:#18352a;font-size:26px;line-height:32px;font-weight:700;letter-spacing:0;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
        ${escapeHtml(title)}
      </h1>
      <p style="margin:14px 0 0 0;color:#40564a;font-size:15px;line-height:24px;font-weight:400;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
        ${escapeHtml(lead)}
      </p>
    </div>
  `;
}

function buttonBlock(label: string, href: string) {
  return `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 24px 0;">
      <tr>
        <td bgcolor="#148a4f" style="border-radius:14px;">
          <a href="${escapeAttribute(href)}" style="display:inline-block;padding:14px 24px;border-radius:14px;background:#148a4f;color:#ffffff;font-size:15px;line-height:18px;font-weight:700;text-decoration:none;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
            ${escapeHtml(label)}
          </a>
        </td>
      </tr>
    </table>
  `;
}

function otpBlock(otp: string) {
  return `
    <div style="margin:0 0 24px 0;padding:20px 18px;border-radius:18px;border:1px solid #cfe9d8;background:#f6fbf8;text-align:center;">
      <div style="font-size:13px;line-height:18px;color:#5f7468;font-weight:700;margin-bottom:10px;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">Mã OTP</div>
      <div style="font-size:34px;line-height:42px;color:#18352a;font-weight:700;letter-spacing:8px;font-family:Consolas,'Courier New',monospace;">
        ${escapeHtml(otp)}
      </div>
    </div>
  `;
}

function infoPanel(innerHtml: string) {
  return `
    <div style="margin:0 0 18px 0;padding:16px 18px;border-radius:16px;background:#f8faf8;border:1px solid #e5eee8;color:#40564a;font-size:14px;line-height:22px;font-weight:400;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
      ${innerHtml}
    </div>
  `;
}

function securityNote(text: string) {
  return `
    <p style="margin:0;color:#6a7c71;font-size:13px;line-height:21px;font-weight:400;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
      ${escapeHtml(text)}
    </p>
  `;
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function escapeAttribute(value: string) {
  return escapeHtml(value);
}
