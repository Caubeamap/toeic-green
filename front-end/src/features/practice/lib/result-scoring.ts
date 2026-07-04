import type { ToeicQuestion } from "./toeic-questions";

function roundToNearestFive(value: number) {
  return Math.round(value / 5) * 5;
}

function estimateSectionScore(correct: number): number {
  const rawScoreAnchors = [
    { raw: 0, scaled: 5 },
    { raw: 10, scaled: 35 },
    { raw: 20, scaled: 80 },
    { raw: 30, scaled: 130 },
    { raw: 40, scaled: 185 },
    { raw: 50, scaled: 250 },
    { raw: 60, scaled: 310 },
    { raw: 70, scaled: 365 },
    { raw: 80, scaled: 420 },
    { raw: 90, scaled: 465 },
    { raw: 100, scaled: 495 },
  ];

  const boundedCorrect = Math.max(0, Math.min(100, correct));
  const nextAnchorIndex = rawScoreAnchors.findIndex(
    (anchor) => boundedCorrect <= anchor.raw
  );

  if (nextAnchorIndex <= 0) {
    return rawScoreAnchors[0].scaled;
  }

  const previous = rawScoreAnchors[nextAnchorIndex - 1];
  const next = rawScoreAnchors[nextAnchorIndex];
  const progress = (boundedCorrect - previous.raw) / (next.raw - previous.raw);
  const scaled = previous.scaled + (next.scaled - previous.scaled) * progress;

  return Math.max(5, Math.min(495, roundToNearestFive(scaled)));
}

export function calculateScore(questions: ToeicQuestion[], answers: Record<string, string>) {
  let lcCorrect = 0;
  let rcCorrect = 0;
  let lcTotal = 0;
  let rcTotal = 0;

  questions.forEach((q) => {
    const isListening = ["part-1", "part-2", "part-3", "part-4"].includes(q.partId);
    if (isListening) {
      lcTotal++;
      if (answers[q.id] === q.correctAnswer) lcCorrect++;
    } else {
      rcTotal++;
      if (answers[q.id] === q.correctAnswer) rcCorrect++;
    }
  });

  const hasFullListeningSection = lcTotal === 100;
  const hasFullReadingSection = rcTotal === 100;
  const lcScaled = hasFullListeningSection ? estimateSectionScore(lcCorrect) : null;
  const rcScaled = hasFullReadingSection ? estimateSectionScore(rcCorrect) : null;
  const totalScore =
    lcScaled !== null && rcScaled !== null ? lcScaled + rcScaled : null;

  return {
    lcCorrect,
    rcCorrect,
    lcTotal,
    rcTotal,
    lcScaled,
    rcScaled,
    totalScore
  };
}

export function getPartsFromAnswers(answers: Record<string, string>): string[] {
  if (!answers) return [];
  const partIds = new Set<string>();
  
  Object.keys(answers).forEach((qId) => {
    const match = qId.match(/-q(\d+)$/i);
    if (match) {
      const qNum = parseInt(match[1], 10);
      if (qNum >= 1 && qNum <= 6) partIds.add("part-1");
      else if (qNum >= 7 && qNum <= 31) partIds.add("part-2");
      else if (qNum >= 32 && qNum <= 70) partIds.add("part-3");
      else if (qNum >= 71 && qNum <= 100) partIds.add("part-4");
      else if (qNum >= 101 && qNum <= 130) partIds.add("part-5");
      else if (qNum >= 131 && qNum <= 146) partIds.add("part-6");
      else if (qNum >= 147 && qNum <= 200) partIds.add("part-7");
    }
  });
  
  return Array.from(partIds);
}
