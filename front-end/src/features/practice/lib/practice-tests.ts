export type TestType = "Listening & Reading" | "Speaking & Writing";
export type TestStatus = "New" | "Completed";
export type PracticeFilter = TestType | "Completed" | "Test History";

export type TestPart = {
  id: string;
  label: string;
  description: string;
  questions: number;
};

export type PracticeAttempt = {
  id: string;
  testId?: string;
  testTitle?: string;
  attemptedAt: string;
  mode: "Practice" | "Full test";
  scopeLabels: string[];
  correct: number;
  total: number;
  durationSeconds: number;
  detailHref: string;
  scaledScore?: number;
  timestamp?: string;
};

export type PracticeTest = {
  id: string;
  title: string;
  subtitle: string;
  type: TestType;
  shortType: string;
  minutes: number;
  questions: number;
  access: string;
  status: TestStatus;
  attempts: number;
  parts: TestPart[];
  recentAttempts?: PracticeAttempt[];
  score?: string;
  completedAt?: string;
};

export const practiceFilters: PracticeFilter[] = [
  "Listening & Reading",
  "Speaking & Writing",
  "Completed",
  "Test History"
];
