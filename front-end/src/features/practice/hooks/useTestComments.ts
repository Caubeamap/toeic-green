"use client";

import { useCallback } from "react";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  type InfiniteData,
} from "@tanstack/react-query";
import {
  fetchCommentReplies,
  fetchComments,
  postComment,
  type CommentFeed,
  type CommentNode,
} from "../services/comments-api";
import {
  commentKeys,
  getTestCommentsInfiniteQueryOptions,
} from "./comment-query-options";

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
      return {
        ...n,
        replyCount: n.replyCount + 1,
        replies: [...n.replies, node],
      };
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

function mergeRepliesIntoTree(
  nodes: CommentNode[],
  parentId: string,
  replies: CommentNode[],
  nextCursor: string | null,
  totalCount: number,
): { nodes: CommentNode[]; merged: boolean } {
  let merged = false;
  const next = nodes.map((node) => {
    if (merged) return node;
    if (node.id === parentId) {
      merged = true;
      const existingIds = new Set(node.replies.map((reply) => reply.id));
      const nextReplies = [
        ...node.replies,
        ...replies.filter((reply) => !existingIds.has(reply.id)),
      ];
      return {
        ...node,
        replies: nextReplies,
        repliesNextCursor: nextCursor,
        replyCount: totalCount,
      };
    }

    const result = mergeRepliesIntoTree(
      node.replies,
      parentId,
      replies,
      nextCursor,
      totalCount,
    );
    if (result.merged) {
      merged = true;
      return { ...node, replies: result.nodes };
    }
    return node;
  });

  return { nodes: next, merged };
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
// Hooks
// ---------------------------------------------------------------------------

export function useTestComments(slug: string) {
  return useInfiniteQuery<
    CommentFeed,
    Error,
    InfiniteData<CommentFeed>,
    ReturnType<typeof commentKeys.feed>,
    string | undefined
  >(getTestCommentsInfiniteQueryOptions(slug, fetchComments));
}

export function usePrefetchTestComments(slug: string) {
  const queryClient = useQueryClient();

  return useCallback(() => {
    void queryClient.prefetchInfiniteQuery(
      getTestCommentsInfiniteQueryOptions(slug, fetchComments),
    );
  }, [queryClient, slug]);
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

export function useLoadCommentReplies(slug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      parentId,
      cursor,
    }: {
      parentId: string;
      cursor?: string | null;
    }) => fetchCommentReplies(slug, parentId, cursor),
    onSuccess: (page, variables) => {
      queryClient.setQueryData<InfiniteData<CommentFeed>>(
        commentKeys.feed(slug),
        (prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            pages: prev.pages.map((feedPage) => {
              const result = mergeRepliesIntoTree(
                feedPage.comments,
                variables.parentId,
                page.replies,
                page.nextCursor,
                page.totalCount,
              );
              return result.merged
                ? { ...feedPage, comments: result.nodes }
                : feedPage;
            }),
          };
        },
      );
    },
  });
}
