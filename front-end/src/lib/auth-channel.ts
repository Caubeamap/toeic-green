/**
 * Đồng bộ phiên đăng nhập giữa các tab cùng origin qua BroadcastChannel.
 *
 * - `token`: một tab vừa refresh thành công → phát access token mới để các tab
 *   khác dùng luôn, khỏi tự gọi /auth/refresh (tránh đua rotation gây logout nhầm).
 * - `logout`: một tab đăng xuất / refresh thất bại → các tab khác cũng thoát phiên
 *   (refresh token là cookie dùng chung, đã chết với tất cả).
 */
export type AuthChannelMessage =
  | { type: "token"; token: string; at: number }
  | { type: "logout" };

const CHANNEL_NAME = "toeic-green-auth";

let channel: BroadcastChannel | null | undefined;

function getChannel(): BroadcastChannel | null {
  if (channel !== undefined) return channel;

  if (
    typeof window === "undefined" ||
    typeof BroadcastChannel === "undefined"
  ) {
    channel = null;
    return channel;
  }

  channel = new BroadcastChannel(CHANNEL_NAME);
  return channel;
}

export function postAuthMessage(message: AuthChannelMessage) {
  getChannel()?.postMessage(message);
}

export function subscribeAuthMessages(
  handler: (message: AuthChannelMessage) => void
): () => void {
  const ch = getChannel();
  if (!ch) return () => {};

  const listener = (event: MessageEvent<AuthChannelMessage>) =>
    handler(event.data);
  ch.addEventListener("message", listener);
  return () => ch.removeEventListener("message", listener);
}
