"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/features/auth";
import { useTestComments, usePostComment } from "../../hooks/useTestComments";
import { CommentItem } from "./CommentItem";

const REPLY_EXIT_MS = 340;

export function DiscussionPanel({ slug }: { slug: string }) {
  const { isAuthenticated } = useAuth();
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError } =
    useTestComments(slug);
  const post = usePostComment(slug);

  const [rootContent, setRootContent] = useState("");
  const [replyContent, setReplyContent] = useState("");
  const [replyTo, setReplyTo] = useState<{ id: string; name: string } | null>(null);
  const [closingReplyId, setClosingReplyId] = useState<string | null>(null);
  const [rootError, setRootError] = useState<string | null>(null);
  const [replyError, setReplyError] = useState<string | null>(null);
  const closingTimerRef = useRef<number | null>(null);

  const comments = (data?.pages ?? []).flatMap((p) => p.comments);
  const total = data?.pages[0]?.totalCount ?? 0;

  useEffect(() => {
    return () => {
      if (closingTimerRef.current !== null) {
        window.clearTimeout(closingTimerRef.current);
      }
    };
  }, []);

  function clearClosingTimer() {
    if (closingTimerRef.current !== null) {
      window.clearTimeout(closingTimerRef.current);
      closingTimerRef.current = null;
    }
  }

  function animateReplyClose(id: string) {
    clearClosingTimer();
    setClosingReplyId(id);
    closingTimerRef.current = window.setTimeout(() => {
      setClosingReplyId((current) => (current === id ? null : current));
      closingTimerRef.current = null;
    }, REPLY_EXIT_MS);
  }

  function toggleReply(id: string, name: string) {
    setReplyError(null);
    if (replyTo?.id === id) {
      animateReplyClose(id);
      setReplyTo(null);
      setReplyContent("");
      return;
    }

    if (replyTo) {
      animateReplyClose(replyTo.id);
    } else {
      clearClosingTimer();
      setClosingReplyId(null);
    }

    setReplyTo({ id, name });
    setReplyContent("");
  }

  async function submitRoot() {
    const text = rootContent.trim();
    if (!text || post.isPending) return;
    setRootError(null);
    try {
      await post.mutateAsync({ content: text });
      setRootContent("");
    } catch {
      setRootError("Gửi bình luận thất bại. Vui lòng thử lại.");
    }
  }

  async function submitReply(parentId: string) {
    const text = replyContent.trim();
    if (!text || post.isPending) return;
    setReplyError(null);
    try {
      await post.mutateAsync({ content: text, parentId });
      setReplyContent("");
      setReplyTo(null);
      animateReplyClose(parentId);
    } catch {
      setReplyError("Gửi trả lời thất bại. Vui lòng thử lại.");
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-on-surface">
        Thảo luận ({total})
      </h2>

      {isAuthenticated ? (
        <div className="space-y-2">
          <div className="flex overflow-hidden rounded-lg border border-outline-variant bg-white transition focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
            <textarea
              aria-label="Nội dung bình luận"
              value={rootContent}
              onChange={(e) => setRootContent(e.target.value)}
              maxLength={2000}
              placeholder="Chia sẻ cảm nghĩ của bạn ..."
              rows={1}
              className="min-h-10 flex-1 resize-none bg-transparent px-3 py-2.5 text-sm leading-5 text-on-surface outline-none placeholder:text-on-surface-variant/60 sm:min-h-11"
            />
            <button
              type="button"
              disabled={!rootContent.trim() || post.isPending}
              onClick={() => void submitRoot()}
              className="inline-flex min-h-10 shrink-0 items-center justify-center border-l border-primary/20 bg-primary px-4 text-sm font-extrabold text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-primary/45 sm:min-h-11"
            >
              {post.isPending ? "Đang gửi…" : "Gửi"}
            </button>
          </div>

          {rootError ? (
            <p className="text-xs font-semibold text-red-600">{rootError}</p>
          ) : null}
        </div>
      ) : (
        <Link
          href={`/login?next=${encodeURIComponent(`/practice/${slug}/start?tab=discussion`)}`}
          className="flex min-h-10 items-center justify-center rounded-lg border border-dashed border-primary/40 bg-primary-container/10 px-4 text-sm font-bold text-primary transition hover:bg-primary-container/20"
        >
          Đăng nhập để tham gia thảo luận
        </Link>
      )}

      {isError ? (
        <p className="py-4 text-center text-sm text-red-600">Không thể tải bình luận. Vui lòng thử lại.</p>
      ) : isLoading ? (
        <p className="py-4 text-center text-sm text-on-surface-variant">Đang tải bình luận…</p>
      ) : comments.length === 0 ? (
        <p className="py-3 text-center text-sm text-on-surface-variant">
          Chưa có bình luận nào. Hãy là người đầu tiên!
        </p>
      ) : (
        <div className="space-y-0.5">
          {comments.map((c) => (
            <CommentItem
              key={c.id}
              node={c}
              activeReplyId={replyTo?.id ?? null}
              closingReplyId={closingReplyId}
              isPosting={post.isPending}
              replyContent={replyContent}
              replyError={replyError}
              onReplyContentChange={setReplyContent}
              onSubmitReply={(parentId) => void submitReply(parentId)}
              onToggleReply={toggleReply}
            />
          ))}
        </div>
      )}

      {hasNextPage ? (
        <div className="flex justify-center">
          <button
            type="button"
            disabled={isFetchingNextPage}
            onClick={() => void fetchNextPage()}
            className="inline-flex min-h-10 items-center justify-center rounded-xl border border-outline-variant/70 bg-white/55 px-5 text-sm font-bold text-on-surface transition hover:bg-white/80 disabled:opacity-50"
          >
            {isFetchingNextPage ? "Đang tải…" : "Xem thêm"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
