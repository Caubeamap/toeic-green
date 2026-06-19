import { api } from "@/lib/api";

export type CommentAuthor = { id: string; displayName: string; avatarUrl: string | null };
export type CommentNode = {
  id: string;
  parentId: string | null;
  depth: number;
  content: string;
  isPinned: boolean;
  createdAt: string;
  author: CommentAuthor;
  replies: CommentNode[];
};
export type CommentFeed = {
  comments: CommentNode[];
  nextCursor: string | null;
  totalCount: number;
};

export function fetchComments(slug: string, cursor?: string, limit = 20): Promise<CommentFeed> {
  const params = new URLSearchParams();
  params.set("limit", String(limit));
  if (cursor) params.set("cursor", cursor);
  return api.get<CommentFeed>(`/practice/tests/${slug}/comments?${params.toString()}`);
}

export function postComment(slug: string, content: string, parentId?: string): Promise<CommentNode> {
  return api.post<CommentNode>(
    `/practice/tests/${slug}/comments`,
    parentId ? { content, parentId } : { content },
  );
}
