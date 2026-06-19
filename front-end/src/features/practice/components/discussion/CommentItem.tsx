"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/features/auth";
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
  activeReplyId,
  closingReplyId,
  isPosting,
  loadingRepliesFor,
  replyContent,
  replyError,
  onReplyContentChange,
  onLoadReplies,
  onSubmitReply,
  onToggleReply,
}: {
  node: CommentNode;
  activeReplyId: string | null;
  closingReplyId: string | null;
  isPosting: boolean;
  loadingRepliesFor: string | null;
  replyContent: string;
  replyError: string | null;
  onReplyContentChange: (value: string) => void;
  onLoadReplies: (parentId: string, cursor: string | null) => void;
  onSubmitReply: (parentId: string) => void;
  onToggleReply: (parentId: string, authorName: string) => void;
}) {
  const { isAuthenticated } = useAuth();
  const indent = Math.min(node.depth, MAX_INDENT);
  const isReplyOpen = activeReplyId === node.id;
  const isReplyClosing = closingReplyId === node.id;
  const shouldRenderReplyComposer = isReplyOpen || isReplyClosing;
  const composerId = `reply-composer-${node.id}`;
  const remainingReplies = Math.max(node.replyCount - node.replies.length, 0);
  const isLoadingReplies = loadingRepliesFor === node.id;

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
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-sm">
            <span className="font-bold text-on-surface">{node.author.displayName}</span>
            <span className="text-xs text-on-surface-variant">{timeAgo(node.createdAt)}</span>
          </div>
          <p className="mt-0.5 whitespace-pre-wrap break-words text-sm text-on-surface">
            {node.content}
          </p>
          {isAuthenticated ? (
            <button
              type="button"
              aria-controls={composerId}
              aria-expanded={isReplyOpen}
              onClick={() => onToggleReply(node.id, node.author.displayName)}
              className={cn(
                "mt-0.5 text-xs font-bold text-primary transition hover:underline",
                isReplyOpen && "text-on-primary-container",
              )}
            >
              Trả lời
            </button>
          ) : null}

          {shouldRenderReplyComposer ? (
            <InlineReplyComposer
              authorName={node.author.displayName}
              composerId={composerId}
              error={isReplyOpen ? replyError : null}
              isPending={isPosting}
              isOpen={isReplyOpen}
              parentId={node.id}
              value={isReplyOpen ? replyContent : ""}
              onChange={onReplyContentChange}
              onSubmit={onSubmitReply}
            />
          ) : null}

          {remainingReplies > 0 ? (
            <button
              type="button"
              disabled={isLoadingReplies}
              onClick={() => onLoadReplies(node.id, node.repliesNextCursor)}
              className="mt-1 text-xs font-bold text-primary transition hover:underline disabled:cursor-wait disabled:text-on-surface-variant"
            >
              {isLoadingReplies
                ? "Đang tải…"
                : `Xem thêm ${remainingReplies} trả lời`}
            </button>
          ) : null}
        </div>
      </div>
      {node.replies.map((child) => (
        <CommentItem
          key={child.id}
          node={child}
          activeReplyId={activeReplyId}
          closingReplyId={closingReplyId}
          isPosting={isPosting}
          loadingRepliesFor={loadingRepliesFor}
          replyContent={replyContent}
          replyError={replyError}
          onReplyContentChange={onReplyContentChange}
          onLoadReplies={onLoadReplies}
          onSubmitReply={onSubmitReply}
          onToggleReply={onToggleReply}
        />
      ))}
    </div>
  );
}

function InlineReplyComposer({
  authorName,
  composerId,
  error,
  isOpen,
  isPending,
  parentId,
  value,
  onChange,
  onSubmit,
}: {
  authorName: string;
  composerId: string;
  error: string | null;
  isOpen: boolean;
  isPending: boolean;
  parentId: string;
  value: string;
  onChange: (value: string) => void;
  onSubmit: (parentId: string) => void;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const timer = window.setTimeout(() => textareaRef.current?.focus(), 140);
    return () => window.clearTimeout(timer);
  }, [isOpen, parentId]);

  return (
    <div
      aria-hidden={!isOpen}
      className={cn(
        "grid w-full transition-opacity",
        isOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
      )}
      data-reply-composer-for={parentId}
      id={composerId}
      style={{
        gridTemplateRows: isOpen ? "1fr" : "0fr",
        transition:
          "grid-template-rows 340ms cubic-bezier(0.16, 1, 0.3, 1), opacity 260ms cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      <div className="overflow-hidden">
        <div
          className={cn(
            "mt-2.5 pb-1 transition-transform duration-300 ease-out",
            isOpen ? "translate-y-0" : "-translate-y-2",
          )}
        >
          <div className="flex w-full overflow-hidden rounded-lg border border-outline-variant bg-white shadow-[0_5px_14px_rgba(17,24,23,0.035)] transition focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
            <textarea
              ref={textareaRef}
              aria-label={`Trả lời ${authorName}`}
              disabled={!isOpen || isPending}
              maxLength={2000}
              onChange={(event) => onChange(event.target.value)}
              placeholder="Chia sẻ cảm nghĩ của bạn ..."
              rows={1}
              value={value}
              className="min-h-10 flex-1 resize-none bg-transparent px-3 py-2.5 text-sm leading-5 text-on-surface outline-none placeholder:text-on-surface-variant/60 sm:min-h-11"
            />
            <button
              type="button"
              disabled={!value.trim() || isPending || !isOpen}
              onClick={() => onSubmit(parentId)}
              className="inline-flex min-h-10 shrink-0 items-center justify-center border-l border-primary/20 bg-primary px-4 text-sm font-extrabold text-white transition hover:bg-primary/90 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-primary/45 sm:min-h-11"
            >
              {isPending ? "Đang gửi…" : "Gửi"}
            </button>
          </div>
          {error ? <p className="mt-1 text-xs font-semibold text-red-600">{error}</p> : null}
        </div>
      </div>
    </div>
  );
}
