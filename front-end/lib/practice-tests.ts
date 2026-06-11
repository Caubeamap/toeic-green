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
  attemptedAt: string;
  mode: "Practice" | "Full test";
  scopeLabels: string[];
  correct: number;
  total: number;
  durationSeconds: number;
  detailHref: string;
  scaledScore?: number;
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

export const listeningReadingParts: TestPart[] = [
  { id: "part-1", label: "Part 1", description: "Photographs", questions: 6 },
  { id: "part-2", label: "Part 2", description: "Question-Response", questions: 25 },
  { id: "part-3", label: "Part 3", description: "Conversations", questions: 39 },
  { id: "part-4", label: "Part 4", description: "Short Talks", questions: 30 },
  { id: "part-5", label: "Part 5", description: "Incomplete Sentences", questions: 30 },
  { id: "part-6", label: "Part 6", description: "Text Completion", questions: 16 },
  { id: "part-7", label: "Part 7", description: "Reading Comprehension", questions: 54 }
];

export const speakingParts: TestPart[] = [
  { id: "speak-1", label: "Questions 1-2", description: "Read a text aloud", questions: 2 },
  { id: "speak-2", label: "Questions 3-4", description: "Describe a picture", questions: 2 },
  { id: "speak-3", label: "Questions 5-7", description: "Respond to questions", questions: 3 }
];

export const writingParts: TestPart[] = [
  { id: "write-1", label: "Questions 1-5", description: "Write a sentence based on a picture", questions: 5 },
  { id: "write-2", label: "Questions 6-7", description: "Respond to written requests", questions: 2 },
  { id: "write-3", label: "Question 8", description: "Write an opinion essay", questions: 1 }
];

export const study4Tests: PracticeTest[] = Array.from({ length: 10 }, (_, index) => {
  const testNum = index + 1;
  const id = `practice-toeic-test-${testNum}`;

  return {
    id,
    title: `Practice Toeic Test ${testNum}`,
    subtitle: `Toeic Green Practice`,
    type: "Listening & Reading",
    shortType: "L & R",
    minutes: 120,
    questions: 200,
    access: "Free",
    status: "New",
    attempts: 15420 - index * 650,
    parts: listeningReadingParts
  } satisfies PracticeTest;
});

export const listeningReadingTests: PracticeTest[] = [
  ...study4Tests
];


export const speakingWritingTests: PracticeTest[] = Array.from({ length: 8 }, (_, index) => {
  const testNumber = index + 1;

  return [
    {
      section: "SPEAKING",
      subtitle: "Speaking Practice",
      minutes: 20,
      questions: 7,
      parts: speakingParts
    },
    {
      section: "WRITING",
      subtitle: "Writing Practice",
      minutes: 60,
      questions: 8,
      parts: writingParts
    }
  ].map<PracticeTest>((part, partIndex) => {
    const id = `sw-${testNumber}-${part.section.toLowerCase()}`;

    return {
      id,
      title: `TOEIC SW TEST ${testNumber} ${part.section}`,
      subtitle: part.subtitle,
      type: "Speaking & Writing",
      shortType: part.section === "SPEAKING" ? "Speaking" : "Writing",
      minutes: part.minutes,
      questions: part.questions,
      access: testNumber <= 3 ? "Free" : "Pro",
      status: "New",
      attempts: 6200 - testNumber * 215 - partIndex * 78,
      parts: part.parts
    };
  });
}).flat();

export const allPracticeTests = [...listeningReadingTests, ...speakingWritingTests];

export function getPracticeTestById(testId: string) {
  return allPracticeTests.find((test) => test.id === testId);
}

export function getPracticeAttemptById(testId: string, attemptId: string) {
  const test = getPracticeTestById(testId);
  const attempt = test?.recentAttempts?.find((item) => item.id === attemptId);

  return test && attempt ? { test, attempt } : undefined;
}
