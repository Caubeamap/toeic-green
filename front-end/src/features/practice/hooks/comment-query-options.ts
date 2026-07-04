import type { CommentFeed } from "../services/comments-api";

const COMMENT_STALE_TIME_MS = 60_000;
const COMMENT_GC_TIME_MS = 10 * 60_000;
const COMMENT_MAX_CACHED_PAGES = 3;

export const commentKeys = {
  feed: (slug: string) => ["test-comments", slug] as const,
};

type FetchComments = (
  slug: string,
  cursor?: string,
) => Promise<CommentFeed>;

export function getTestCommentsInfiniteQueryOptions(
  slug: string,
  fetcher: FetchComments,
) {
  return {
    queryKey: commentKeys.feed(slug),
    queryFn: ({ pageParam }: { pageParam: string | undefined }) =>
      fetcher(slug, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage: CommentFeed) =>
      lastPage.nextCursor ?? undefined,
    staleTime: COMMENT_STALE_TIME_MS,
    gcTime: COMMENT_GC_TIME_MS,
    maxPages: COMMENT_MAX_CACHED_PAGES,
  };
}
