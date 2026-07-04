import { api } from "@/lib/api";

type CommentAuthor = { id: string; displayName: string; avatarUrl: string | null };
export type CommentNode = {
  id: string;
  parentId: string | null;
  depth: number;
  content: string;
  isPinned: boolean;
  createdAt: string;
  author: CommentAuthor;
  replyCount: number;
  repliesNextCursor: string | null;
  replies: CommentNode[];
};
export type CommentFeed = {
  comments: CommentNode[];
  nextCursor: string | null;
  totalCount: number;
};
export type CommentRepliesPage = {
  replies: CommentNode[];
  nextCursor: string | null;
  totalCount: number;
};

export function fetchComments(
  slug: string,
  cursor?: string,
  limit = 20,
  replyPreviewLimit = 3,
): Promise<CommentFeed> {
  const params = new URLSearchParams();
  params.set("limit", String(limit));
  params.set("replyPreviewLimit", String(replyPreviewLimit));
  if (cursor) params.set("cursor", cursor);
  return api.get<CommentFeed>(`/practice/tests/${slug}/comments?${params.toString()}`);
}

export function fetchCommentReplies(
  slug: string,
  parentId: string,
  cursor?: string | null,
  limit = 10,
): Promise<CommentRepliesPage> {
  const params = new URLSearchParams();
  params.set("limit", String(limit));
  if (cursor) params.set("cursor", cursor);
  return api.get<CommentRepliesPage>(
    `/practice/tests/${slug}/comments/${parentId}/replies?${params.toString()}`,
  );
}

export function postComment(slug: string, content: string, parentId?: string): Promise<CommentNode> {
  return api.post<CommentNode>(
    `/practice/tests/${slug}/comments`,
    parentId ? { content, parentId } : { content },
  );
}
