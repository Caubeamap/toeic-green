"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/features/auth";
import { useTestComments, usePostComment } from "../../hooks/useTestComments";
import { CommentItem } from "./CommentItem";

export function DiscussionPanel({ slug }: { slug: string }) {
  const { isAuthenticated } = useAuth();
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError } =
    useTestComments(slug);
  const post = usePostComment(slug);

  const [content, setContent] = useState("");
  const [replyTo, setReplyTo] = useState<{ id: string; name: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const comments = (data?.pages ?? []).flatMap((p) => p.comments);
  const total = data?.pages[0]?.totalCount ?? 0;

  async function submit() {
    const text = content.trim();
    if (!text || post.isPending) return;
    setError(null);
    try {
      await post.mutateAsync({ content: text, parentId: replyTo?.id });
      setContent("");
      setReplyTo(null);
    } catch {
      setError("Gửi bình luận thất bại. Vui lòng thử lại.");
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-on-surface">
        Thảo luận ({total})
      </h2>

      {isAuthenticated ? (
        <div className="space-y-2">
          {replyTo ? (
            <div className="flex min-h-9 items-center gap-2 rounded-lg border border-primary/20 bg-primary-container/20 px-3 text-xs">
              <span className="text-on-surface-variant">Đang trả lời</span>
              <span className="font-bold text-on-surface">{replyTo.name}</span>
              <button
                type="button"
                onClick={() => setReplyTo(null)}
                className="ml-auto text-xs font-bold text-primary hover:underline"
              >
                Huỷ
              </button>
            </div>
          ) : null}

          <div className="flex overflow-hidden rounded-lg border border-outline-variant bg-white transition focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
            <textarea
              aria-label="Nội dung bình luận"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              maxLength={2000}
              placeholder="Chia sẻ cảm nghĩ của bạn ..."
              rows={1}
              className="min-h-10 flex-1 resize-none bg-transparent px-3 py-2.5 text-sm leading-5 text-on-surface outline-none placeholder:text-on-surface-variant/60"
            />
            <button
              type="button"
              disabled={!content.trim() || post.isPending}
              onClick={() => void submit()}
              className="inline-flex min-h-10 shrink-0 items-center justify-center border-l border-primary/20 bg-primary px-4 text-sm font-extrabold text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-primary/45"
            >
              {post.isPending ? "Đang gửi…" : "Gửi"}
            </button>
          </div>

          {error ? (
            <p className="text-xs font-semibold text-red-600">{error}</p>
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
              onReply={(id, name) => setReplyTo({ id, name })}
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
