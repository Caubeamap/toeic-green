import {
  BarChart3,
  BookOpen,
  Headphones,
  History
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

export const resultCards = [
  { label: "Correct", value: "164/200", tone: "green" },
  { label: "Incorrect", value: "36", tone: "red" },
  { label: "Time Spent", value: "112m", tone: "blue" }
];
