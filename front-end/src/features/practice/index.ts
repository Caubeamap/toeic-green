// Components
export { PracticeCatalog } from "./components/PracticeCatalog";
export { PracticeExamSession } from "./components/PracticeExamSession";
export { PracticeResultReview } from "./components/PracticeResultReview";
export { PracticeTestSetup } from "./components/PracticeTestSetup";

// Tests and types
export {
  practiceFilters,
} from "./lib/practice-tests";
export type {
  TestType,
  TestStatus,
  PracticeFilter,
  PracticeAttempt,
  PracticeTest,
} from "./lib/practice-tests";

// Progress and results
export type {
  SavedPracticeResult,
} from "./lib/practice-progress";

// Backend API
export {
  getLatestPracticeAttemptResult,
  getPracticeAttemptResult,
  getPracticeStats,
  getPracticeTest,
  getPracticeTestWithProgress,
  listPracticeQuestions,
  listPracticeTests,
  listPracticeTestsWithProgress,
  listRecentPracticeAttempts,
  submitPracticeAttempt,
} from "./services/practice-api";
export type {
  PracticeAttemptResult,
  PracticeStats,
  SubmitPracticeAttemptInput,
} from "./services/practice-api";

// React Query hooks (cache RAM, không localStorage)
export {
  practiceKeys,
  useAttemptResult,
  useLatestAttemptResult,
  usePracticeCatalog,
  usePracticeQuestions,
  usePracticeStats,
  usePracticeTest,
  usePracticeTestDetail,
  usePrefetchQuestions,
  useRecentAttempts,
  useSubmitAttempt,
} from "./hooks/usePractice";

// Questions
export type { ToeicQuestion } from "./lib/toeic-questions";
