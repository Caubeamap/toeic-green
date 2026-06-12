import {
  BarChart3,
  BookOpen,
  BriefcaseBusiness,
  Clock3,
  Compass,
  FileText,
  Headphones,
  History,
  Sparkles,
  Target
} from "lucide-react";

export const navItems = [
  { label: "Home", href: "/" },
  { label: "Practice Tests", href: "/practice" },
  { label: "Explore", href: "/explore" },
  { label: "Vocabulary Notes", href: "/vocabulary" },
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
    id: "vocabulary",
    label: "Vocabulary Notes",
    icon: BookOpen,
    title: "Sổ ghi chú từ vựng",
    description:
      "Lưu từ mới khi làm đề, ghi chú và ôn tập theo danh sách cá nhân.",
    stat: "—"
  },
  {
    id: "history",
    label: "Test History",
    icon: History,
    title: "Xem lại bài đã làm",
    description:
      "Theo dõi đề đã làm, câu sai thường gặp và thời gian hoàn thành.",
    stat: "—"
  },
  {
    id: "progress",
    label: "Study Progress",
    icon: BarChart3,
    title: "Tổng quan tiến trình",
    description:
      "Xem điểm trung bình, vốn từ đã lưu và bài tập tiếp theo.",
    stat: "—"
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
    id: 3,
    name: "TOEIC Full Test 03",
    type: "Listening + Reading",
    minutes: 120,
    questions: 200,
    difficulty: "Easy",
    progress: 0,
    status: "New Test",
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

];

export const filters = [
  "All",
  "Listening & Reading",
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
  { label: "Tests taken", value: "—", delta: "", icon: FileText },
  { label: "Average score", value: "—", delta: "", icon: Target },
  { label: "Vocabulary saved", value: "—", delta: "", icon: BookOpen },
  { label: "Learning streak", value: "—", delta: "", icon: Sparkles }
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
  { label: "Listening & Reading", value: "Đề mô phỏng", icon: Headphones },
  { label: "Vocabulary Notes", value: "Ghi chú từ vựng", icon: BookOpen },
  { label: "Detailed Explanation", value: "Giải thích đáp án", icon: BriefcaseBusiness },
  { label: "Explore", value: "Flashcards theo bộ", icon: Compass },
  { label: "Study streak", value: "Theo dõi tiến trình", icon: Clock3 }
];
