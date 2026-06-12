import type { ExploreCollection } from "./types";

const officeWords = [
  {
    id: "office-agenda",
    word: "agenda",
    phonetic: "/əˈdʒen.də/",
    partOfSpeech: "noun",
    meaning: "chương trình họp, danh sách nội dung cần bàn",
    example: "The manager sent the meeting agenda to all staff members.",
    exampleTranslation: "Quản lý đã gửi chương trình họp cho toàn bộ nhân viên.",
    imageUrl:
      "https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=640&q=80"
  },
  {
    id: "office-deadline",
    word: "deadline",
    phonetic: "/ˈded.laɪn/",
    partOfSpeech: "noun",
    meaning: "hạn chót",
    example: "The deadline for submitting the report is Friday afternoon.",
    exampleTranslation: "Hạn chót nộp báo cáo là chiều thứ Sáu.",
    imageUrl:
      "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?auto=format&fit=crop&w=640&q=80"
  },
  {
    id: "office-approve",
    word: "approve",
    phonetic: "/əˈpruːv/",
    partOfSpeech: "verb",
    meaning: "phê duyệt, chấp thuận",
    example: "The director approved the new marketing budget.",
    exampleTranslation: "Giám đốc đã phê duyệt ngân sách marketing mới.",
    imageUrl:
      "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=640&q=80"
  },
  {
    id: "office-collaborate",
    word: "collaborate",
    phonetic: "/kəˈlæb.ə.reɪt/",
    partOfSpeech: "verb",
    meaning: "hợp tác, phối hợp",
    example: "The two departments will collaborate on the product launch.",
    exampleTranslation: "Hai phòng ban sẽ phối hợp trong đợt ra mắt sản phẩm.",
    imageUrl:
      "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=640&q=80"
  }
] as const;

const businessWords = [
  {
    id: "business-invoice",
    word: "invoice",
    phonetic: "/ˈɪn.vɔɪs/",
    partOfSpeech: "noun",
    meaning: "hóa đơn",
    example: "Please forward the invoice to the accounting department.",
    exampleTranslation: "Vui lòng chuyển hóa đơn đến phòng kế toán.",
    imageUrl:
      "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=640&q=80"
  },
  {
    id: "business-refund",
    word: "refund",
    phonetic: "/ˈriː.fʌnd/",
    partOfSpeech: "noun",
    meaning: "khoản hoàn tiền",
    example: "Customers can request a refund within thirty days.",
    exampleTranslation: "Khách hàng có thể yêu cầu hoàn tiền trong vòng ba mươi ngày.",
    imageUrl:
      "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=640&q=80"
  },
  {
    id: "business-quote",
    word: "quotation",
    phonetic: "/kwoʊˈteɪ.ʃən/",
    partOfSpeech: "noun",
    meaning: "bảng báo giá",
    example: "The supplier sent a quotation for the office furniture.",
    exampleTranslation: "Nhà cung cấp đã gửi bảng báo giá cho nội thất văn phòng.",
    imageUrl:
      "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=640&q=80"
  },
  {
    id: "business-negotiate",
    word: "negotiate",
    phonetic: "/nəˈɡoʊ.ʃi.eɪt/",
    partOfSpeech: "verb",
    meaning: "đàm phán, thương lượng",
    example: "We need to negotiate better delivery terms.",
    exampleTranslation: "Chúng ta cần thương lượng điều khoản giao hàng tốt hơn.",
    imageUrl:
      "https://images.unsplash.com/photo-1556761175-4b46a572b786?auto=format&fit=crop&w=640&q=80"
  }
] as const;

const travelWords = [
  {
    id: "travel-itinerary",
    word: "itinerary",
    phonetic: "/aɪˈtɪn.ə.rer.i/",
    partOfSpeech: "noun",
    meaning: "lịch trình di chuyển",
    example: "The updated itinerary includes a morning flight to Osaka.",
    exampleTranslation: "Lịch trình cập nhật có chuyến bay buổi sáng đến Osaka.",
    imageUrl:
      "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=640&q=80"
  },
  {
    id: "travel-reservation",
    word: "reservation",
    phonetic: "/ˌrez.ɚˈveɪ.ʃən/",
    partOfSpeech: "noun",
    meaning: "sự đặt chỗ, đặt phòng",
    example: "I would like to confirm my hotel reservation.",
    exampleTranslation: "Tôi muốn xác nhận đặt phòng khách sạn của mình.",
    imageUrl:
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=640&q=80"
  },
  {
    id: "travel-departure",
    word: "departure",
    phonetic: "/dɪˈpɑːr.tʃɚ/",
    partOfSpeech: "noun",
    meaning: "sự khởi hành",
    example: "The departure gate has changed due to maintenance.",
    exampleTranslation: "Cổng khởi hành đã thay đổi do bảo trì.",
    imageUrl:
      "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=640&q=80"
  },
  {
    id: "travel-delay",
    word: "delay",
    phonetic: "/dɪˈleɪ/",
    partOfSpeech: "noun",
    meaning: "sự trì hoãn",
    example: "The train delay was caused by bad weather.",
    exampleTranslation: "Việc tàu bị trì hoãn là do thời tiết xấu.",
    imageUrl:
      "https://images.unsplash.com/photo-1474487548417-781cb71495f3?auto=format&fit=crop&w=640&q=80"
  }
] as const;

const readingWords = [
  {
    id: "reading-notice",
    word: "notice",
    phonetic: "/ˈnoʊ.tɪs/",
    partOfSpeech: "noun",
    meaning: "thông báo",
    example: "The notice explains the new parking policy.",
    exampleTranslation: "Thông báo giải thích chính sách đỗ xe mới.",
    imageUrl:
      "https://images.unsplash.com/photo-1457694587812-e8bf29a43845?auto=format&fit=crop&w=640&q=80"
  },
  {
    id: "reading-survey",
    word: "survey",
    phonetic: "/ˈsɝː.veɪ/",
    partOfSpeech: "noun",
    meaning: "cuộc khảo sát",
    example: "Employees are asked to complete the satisfaction survey.",
    exampleTranslation: "Nhân viên được yêu cầu hoàn thành khảo sát mức độ hài lòng.",
    imageUrl:
      "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=640&q=80"
  },
  {
    id: "reading-policy",
    word: "policy",
    phonetic: "/ˈpɑː.lə.si/",
    partOfSpeech: "noun",
    meaning: "chính sách, quy định",
    example: "The company updated its remote work policy.",
    exampleTranslation: "Công ty đã cập nhật chính sách làm việc từ xa.",
    imageUrl:
      "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=640&q=80"
  },
  {
    id: "reading-requirement",
    word: "requirement",
    phonetic: "/rɪˈkwaɪr.mənt/",
    partOfSpeech: "noun",
    meaning: "yêu cầu, điều kiện bắt buộc",
    example: "Experience in sales is a key requirement for this position.",
    exampleTranslation: "Kinh nghiệm bán hàng là yêu cầu quan trọng cho vị trí này.",
    imageUrl:
      "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=640&q=80"
  }
] as const;

export const exploreCollections: ExploreCollection[] = [
  {
    id: "toeic-office-core",
    title: "Từ vựng TOEIC văn phòng",
    description: "Nhóm từ xuất hiện nhiều trong email, cuộc họp và thông báo nội bộ.",
    category: "TOEIC",
    level: "Cơ bản",
    author: "TOEIC Green",
    wordCount: 536,
    learners: 43317,
    estimatedMinutes: 14,
    tags: ["Office", "Email", "Part 3"],
    words: [...officeWords]
  },
  {
    id: "business-word-list",
    title: "Business Word List",
    description: "Các từ cần thiết khi đọc hợp đồng, hóa đơn và trao đổi với khách hàng.",
    category: "Business",
    level: "Trung cấp",
    author: "TOEIC Green",
    wordCount: 1665,
    learners: 3411,
    estimatedMinutes: 16,
    tags: ["Finance", "Contract", "Part 7"],
    words: [...businessWords]
  },
  {
    id: "toeic-travel-service",
    title: "Travel & Customer Service",
    description: "Từ vựng về đặt phòng, lịch bay, dịch vụ và xử lý yêu cầu.",
    category: "TOEIC",
    level: "Cơ bản",
    author: "TOEIC Green",
    wordCount: 894,
    learners: 11241,
    estimatedMinutes: 12,
    tags: ["Travel", "Service", "Listening"],
    words: [...travelWords]
  },
  {
    id: "part-seven-reading",
    title: "Part 7 Reading Vocabulary",
    description: "Từ thường gặp trong notice, policy, survey và job posting.",
    category: "Reading",
    level: "Trung cấp",
    author: "TOEIC Green",
    wordCount: 1194,
    learners: 58557,
    estimatedMinutes: 18,
    tags: ["Reading", "Part 7", "Notice"],
    words: [...readingWords]
  },
  {
    id: "email-phrases",
    title: "Email Phrases for TOEIC",
    description: "Cụm từ ngắn giúp nhận diện mục đích email nhanh hơn.",
    category: "Email",
    level: "Cơ bản",
    author: "TOEIC Green",
    wordCount: 620,
    learners: 108348,
    estimatedMinutes: 10,
    tags: ["Email", "Office", "Part 6"],
    words: [...officeWords, ...readingWords.slice(0, 2)]
  },
  {
    id: "test-day-vocab",
    title: "600 TOEIC words",
    description: "Bộ từ tổng hợp cho giai đoạn luyện đề và rà soát trước ngày thi.",
    category: "TOEIC",
    level: "Tổng hợp",
    author: "TOEIC Green",
    wordCount: 600,
    learners: 108348,
    estimatedMinutes: 20,
    tags: ["Mock test", "Review", "Core"],
    words: [...businessWords, ...travelWords]
  },
  {
    id: "listening-common",
    title: "Most common Listening words",
    description: "Từ khóa thường xuất hiện trong mô tả tranh và hội thoại ngắn.",
    category: "Listening",
    level: "Cơ bản",
    author: "TOEIC Green",
    wordCount: 1124,
    learners: 25257,
    estimatedMinutes: 12,
    tags: ["Part 1", "Part 2", "Audio"],
    words: [...travelWords, ...officeWords.slice(0, 2)]
  },
  {
    id: "academic-bridge",
    title: "Academic Word List",
    description: "Từ học thuật hữu ích cho người muốn mở rộng sau TOEIC.",
    category: "Academic",
    level: "Nâng cao",
    author: "TOEIC Green",
    wordCount: 570,
    learners: 6033,
    estimatedMinutes: 15,
    tags: ["Academic", "Reading", "Advanced"],
    words: [...readingWords, ...businessWords.slice(0, 2)]
  }
];
