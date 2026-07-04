// Components
export { PracticeCatalog } from "./components/PracticeCatalog";
export { PracticeExamSession } from "./components/PracticeExamSession";
export { PracticeResultReview } from "./components/PracticeResultReview";
export { PracticeTestSetup } from "./components/PracticeTestSetup";

// Tests and types
export { practiceTimeStorageKey } from "./lib/practice-tests";
export type { PracticeAttempt, PracticeTest } from "./lib/practice-tests";

// Backend API types
export type { PracticeAttemptResult, PracticeStats } from "./services/practice-api";

// React Query hooks (cache RAM, không localStorage)
export {
  practiceKeys,
  useAttemptResult,
  useLatestAttemptResult,
  usePracticeQuestions,
  usePracticeStats,
  usePracticeTest,
  usePracticeTestDetail,
  useRecentAttempts,
} from "./hooks/usePractice";

// Questions
export type { ToeicQuestion } from "./lib/toeic-questions";
