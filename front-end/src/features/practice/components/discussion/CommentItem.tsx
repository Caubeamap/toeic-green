"use client";

import { UserAvatar } from "@/components/common/UserAvatar";
import { cn } from "@/lib/utils";
import { getUserInitials, normalizeAvatarUrl } from "@/lib/user-avatar";
import type { CommentNode } from "../../services/comments-api";

const MAX_INDENT = 3;

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "vừa xong";
  if (m < 60) return `${m} phút trước`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} giờ trước`;
  return new Date(iso).toLocaleDateString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });
}

export function CommentItem({
  node,
  onReply,
}: {
  node: CommentNode;
  onReply: (parentId: string, authorName: string) => void;
}) {
  const indent = Math.min(node.depth, MAX_INDENT);
  return (
    <div
      style={{ marginLeft: indent > 0 ? 14 : 0 }}
      className={cn(
        indent > 0 ? "border-l border-outline-variant/45 pl-3" : "pl-0",
      )}
    >
      <div className="flex gap-2.5 py-1.5">
        <UserAvatar
          alt={node.author.displayName}
          avatarUrl={normalizeAvatarUrl(node.author.avatarUrl)}
          initials={getUserInitials(node.author.displayName)}
          className="h-8 w-8 text-[11px]"
        />
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-sm">
            <span className="font-bold text-on-surface">{node.author.displayName}</span>
            <span className="text-xs text-on-surface-variant">{timeAgo(node.createdAt)}</span>
          </div>
          <p className="mt-0.5 whitespace-pre-wrap break-words text-sm text-on-surface">
            {node.content}
          </p>
          <button
            type="button"
            onClick={() => onReply(node.id, node.author.displayName)}
            className="mt-0.5 text-xs font-bold text-primary hover:underline"
          >
            Trả lời
          </button>
        </div>
      </div>
      {node.replies.map((child) => (
        <CommentItem key={child.id} node={child} onReply={onReply} />
      ))}
    </div>
  );
}
