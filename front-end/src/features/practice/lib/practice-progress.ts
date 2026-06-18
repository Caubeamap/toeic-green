/**
 * Hình dạng kết quả một lượt làm bài (đáp án + thống kê) mà backend trả về trong
 * `PracticeAttemptResult.result`. Lịch sử luyện đề nay đọc thẳng từ DB
 * (`/practice/attempts/recent`, `/practice/stats/me`) — không còn lưu localStorage.
 */
export type SavedPracticeResult = {
  testId: string;
  testTitle: string;
  correct: number;
  total: number;
  answered: number;
  flagged: number;
  flaggedIds?: string[];
  duration: number;
  answers: Record<string, string>;
  timestamp: string;
  parts?: string[];
  timeLimit?: number;
};
