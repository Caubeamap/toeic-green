import { cookies } from "next/headers";
import type { ToeicQuestion } from "../lib/toeic-questions";
import type { PracticeTest } from "../lib/practice-tests";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:2409/api";

export async function fetchPracticeTestsForCurrentUser(): Promise<
  PracticeTest[] | undefined
> {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get("refresh_token")?.value;

  if (!refreshToken) {
    return undefined;
  }

  try {
    const response = await fetch(`${API_URL}/practice/tests/bootstrap`, {
      cache: "no-store",
      headers: {
        Cookie: `refresh_token=${encodeURIComponent(refreshToken)}`
      }
    });

    if (!response.ok) {
      return undefined;
    }

    return (await response.json()) as PracticeTest[];
  } catch {
    return undefined;
  }
}

export async function fetchPracticeQuestionsForCurrentUser(
  slug: string
): Promise<ToeicQuestion[] | undefined> {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get("refresh_token")?.value;

  if (!refreshToken) {
    return undefined;
  }

  try {
    const response = await fetch(
      `${API_URL}/practice/tests/${encodeURIComponent(slug)}/questions/bootstrap`,
      {
        cache: "no-store",
        headers: {
          Cookie: `refresh_token=${encodeURIComponent(refreshToken)}`
        }
      }
    );

    if (!response.ok) {
      return undefined;
    }

    return (await response.json()) as ToeicQuestion[];
  } catch {
    return undefined;
  }
}
