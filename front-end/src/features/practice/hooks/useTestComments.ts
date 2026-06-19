"use client";

import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  type InfiniteData,
} from "@tanstack/react-query";
import {
  fetchComments,
  postComment,
  type CommentFeed,
  type CommentNode,
} from "../services/comments-api";

// ---------------------------------------------------------------------------
// Cache helpers
// ---------------------------------------------------------------------------

/**
 * Immutably insert `node` into the fetched pages.
 *
 * - Root comment  (parentId === null): prepend to pages[0].comments, bump every
 *   page's totalCount.
 * - Reply         (parentId set):      walk the nested replies tree across ALL
 *   pages; when found push `node` into parent.replies, rebuild the path
 *   immutably, bump every page's totalCount.  If the parent lives on an
 *   unloaded page just bump totalCount so the UI count stays correct.
 */
function insertNodeIntoTree(
  nodes: CommentNode[],
  node: CommentNode,
): { nodes: CommentNode[]; inserted: boolean } {
  let inserted = false;
  const next = nodes.map((n) => {
    if (inserted) return n;
    if (n.id === node.parentId) {
      inserted = true;
      return { ...n, replies: [...n.replies, node] };
    }
    const result = insertNodeIntoTree(n.replies, node);
    if (result.inserted) {
      inserted = true;
      return { ...n, replies: result.nodes };
    }
    return n;
  });
  return { nodes: next, inserted };
}

export function insertNode(pages: CommentFeed[], node: CommentNode): CommentFeed[] {
  if (node.parentId === null) {
    // New root comment: prepend to first page, bump totalCount on every page.
    return pages.map((page, i) => ({
      ...page,
      comments: i === 0 ? [node, ...page.comments] : page.comments,
      totalCount: page.totalCount + 1,
    }));
  }

  // Reply: find parent anywhere in the tree across pages.
  let inserted = false;
  const nextPages = pages.map((page) => {
    if (inserted) return { ...page, totalCount: page.totalCount + 1 };
    const result = insertNodeIntoTree(page.comments, node);
    inserted = result.inserted;
    return {
      ...page,
      comments: result.inserted ? result.nodes : page.comments,
      totalCount: page.totalCount + 1,
    };
  });

  return nextPages;
}

// ---------------------------------------------------------------------------
// Query key
// ---------------------------------------------------------------------------

export const commentKeys = {
  feed: (slug: string) => ["test-comments", slug] as const,
};

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

export function useTestComments(slug: string) {
  return useInfiniteQuery<
    CommentFeed,
    Error,
    InfiniteData<CommentFeed>,
    ReturnType<typeof commentKeys.feed>,
    string | undefined
  >({
    queryKey: commentKeys.feed(slug),
    queryFn: ({ pageParam }) => fetchComments(slug, pageParam),
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    staleTime: 30_000,
  });
}

export function usePostComment(slug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ content, parentId }: { content: string; parentId?: string }) =>
      postComment(slug, content, parentId),
    onSuccess: (node: CommentNode) => {
      queryClient.setQueryData<InfiniteData<CommentFeed>>(
        commentKeys.feed(slug),
        (prev) =>
          prev
            ? { ...prev, pages: insertNode(prev.pages, node) }
            : prev,
      );
    },
  });
}
