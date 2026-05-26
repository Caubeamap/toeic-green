import {
  BarChart3,
  BookOpen,
  BriefcaseBusiness,
  Clock3,
  FileText,
  Headphones,
  History,
  Mic2,
  PenLine,
  Sparkles,
  Target,
  TrendingUp
} from "lucide-react";

export const navItems = [
  { label: "Home", href: "/" },
  { label: "Practice Tests", href: "/practice" },
  { label: "Vocabulary Notes", href: "/vocabulary" },
  { label: "Study Plan", href: "/study-plan" },
  { label: "Progress", href: "/progress" }
];

export const featureTabs = [
  {
    id: "listening-reading",
    label: "Listening & Reading Test",
    icon: Headphones,
    title: "Full simulation for Part 1-7",
    description:
      "Luyện nghe và đọc theo cấu trúc TOEIC thật, có audio player, passage, question map và bộ giải thích sau test.",
    stat: "200 questions"
  },
  {
    id: "speaking-writing",
    label: "Speaking & Writing Test",
    icon: PenLine,
    title: "Record, draft, review",
    description:
      "Màn hình speaking có ghi âm câu trả lời, writing có khung soạn bài và rubric để luyện tập có định hướng.",
    stat: "11 tasks"
  },
  {
    id: "vocabulary",
    label: "Vocabulary Notes",
    icon: BookOpen,
    title: "Daily TOEIC vocabulary vault",
    description:
      "Lưu từ mới, tag chủ đề, trạng thái học và ghi chú cá nhân để ôn tập theo ngữ cảnh công việc.",
    stat: "1,240 saved"
  },
  {
    id: "history",
    label: "Test History",
    icon: History,
    title: "Every attempt stays useful",
    description:
      "Theo dõi đề đã làm, câu sai thường gặp, thời gian hoàn thành và điểm tiến bộ theo từng tuần.",
    stat: "48 tests"
  },
  {
    id: "progress",
    label: "Study Progress",
    icon: BarChart3,
    title: "A clear path to 850+",
    description:
      "Dashboard tập trung vào streak, điểm trung bình, vốn từ đã lưu và bài học tiếp theo nên luyện.",
    stat: "+45 points"
  }
];

export const tests = [
  {
    id: 1,
    name: "TOEIC Full Test 01",
    type: "Listening + Reading",
    minutes: 120,
    questions: 200,
    difficulty: "Medium",
    progress: 0,
    status: "New Test",
    image:
      "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=900&q=80"
  },
  {
    id: 2,
    name: "TOEIC Full Test 02",
    type: "Speaking + Writing",
    minutes: 80,
    questions: 11,
    difficulty: "Hard",
    progress: 0,
    status: "New Test",
    image:
      "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=900&q=80"
  },
  {
    id: 3,
    name: "TOEIC Full Test 03",
    type: "Listening + Reading",
    minutes: 120,
    questions: 200,
    difficulty: "Easy",
    progress: 100,
    status: "Completed",
    score: "890/990",
    image:
      "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=900&q=80"
  },
  {
    id: 4,
    name: "TOEIC Full Test 04",
    type: "Listening + Reading",
    minutes: 120,
    questions: 200,
    difficulty: "Medium",
    progress: 0,
    status: "New Test",
    image:
      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80"
  },
  {
    id: 5,
    name: "TOEIC Speaking Pack 05",
    type: "Speaking + Writing",
    minutes: 80,
    questions: 11,
    difficulty: "Medium",
    progress: 0,
    status: "New Test",
    image:
      "https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=900&q=80"
  }
];

export const filters = [
  "All",
  "Listening & Reading",
  "Speaking & Writing",
  "Completed",
  "New Test"
];

export const vocabWords = [
  {
    word: "Implement",
    phonetic: "/ˈɪm.plə.ment/",
    type: "Verb",
    meaning: "Thực hiện, triển khai",
    example: "The company decided to implement a new remote work policy.",
    note: "Commonly used with plan, strategy, policy.",
    tags: ["Office", "Strategy"],
    status: "Learning"
  },
  {
    word: "Conglomerate",
    phonetic: "/kənˈɡlɑː.mɚ.ət/",
    type: "Noun",
    meaning: "Tập đoàn đa ngành",
    example: "Samsung is a massive South Korean conglomerate.",
    note: "Differentiate from Corporation.",
    tags: ["Business", "Finance"],
    status: "New"
  },
  {
    word: "Negotiate",
    phonetic: "/nəˈɡoʊ.ʃi.eɪt/",
    type: "Verb",
    meaning: "Thương lượng, đàm phán",
    example: "We need to negotiate a better price for the shipment.",
    note: "Appears often in Part 7 business passages.",
    tags: ["Meeting", "Contract"],
    status: "Mastered"
  },
  {
    word: "Collaborate",
    phonetic: "/kəˈlæb.ə.reɪt/",
    type: "Verb",
    meaning: "Cộng tác, hợp tác",
    example: "The two departments must collaborate to finish the project.",
    note: "Synonym: work together.",
    tags: ["Office"],
    status: "Learning"
  }
];

export const resultCards = [
  { label: "Correct", value: "164/200", tone: "green" },
  { label: "Incorrect", value: "36", tone: "red" },
  { label: "Time Spent", value: "112m", tone: "blue" }
];

export const progressStats = [
  { label: "Tests taken", value: "48", delta: "+12%", icon: FileText },
  { label: "Average score", value: "845", delta: "+5.2", icon: Target },
  { label: "Vocabulary saved", value: "1,240", delta: "Target: 2k", icon: BookOpen },
  { label: "Learning streak", value: "14 days", delta: "Hot", icon: Sparkles }
];

export const nextLessons = [
  {
    title: "Mastering Passive Voice",
    category: "Grammar",
    duration: "15 mins",
    copy: "Patterns for Part 5 and 6 questions with high-frequency distractors.",
    image:
      "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=900&q=80"
  },
  {
    title: "Photo Description Strategies",
    category: "Listening",
    duration: "25 mins",
    copy: "Common visual distractors and keywords to listen for in Part 1.",
    image:
      "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=900&q=80"
  },
  {
    title: "Office Phrasal Verbs",
    category: "Vocabulary",
    duration: "10 mins",
    copy: "50 must-know phrasal verbs for office communication and email.",
    image:
      "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=900&q=80"
  }
];

export const heroStats = [
  { label: "Listening & Reading", value: "48 tests", icon: Headphones },
  { label: "Speaking & Writing", value: "11 tasks", icon: Mic2 },
  { label: "Vocabulary Notes", value: "1,240 words", icon: BookOpen },
  { label: "Detailed Explanation", value: "200 answers", icon: BriefcaseBusiness },
  { label: "Weekly progress", value: "+45 points", icon: TrendingUp },
  { label: "Study streak", value: "14 days", icon: Clock3 }
];
