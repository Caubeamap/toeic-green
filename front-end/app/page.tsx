import Image from "next/image";
import Link from "next/link";
import {
  BookOpen,
  BrainCircuit,
  Headphones,
  MessageSquareText,
  PenLine,
  Route,
  Star
} from "lucide-react";
import type { ReactNode } from "react";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { HeroSection } from "@/components/HeroSection";

const listeningImage =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCMHV78H5eQKd9Po-Zu8VqTG_r8xA5VALXx0N_Qoov4TMyhsNZ4depEEYjeneNmBGiG7tfzpjXfudOwNJ2DyOvx60C3N9v3t1tdXH8Vn6BWW7i3e6noY9Quk0urq8dw5rAXVTNvAw1CueGaEImG7aUjCeVpLMhTIEcIWsIqi1JFCjFtc2l8I9B3xBwu6eC7h4xwXDgKGdrCKW6_gDW3ICt9hCQhKAK6ijvlXE9pJNwMeaph4elRhP48bbSYWwZnR_ZwVy5fPxguvJQ";

const roadmapImage =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAdYvtyELgSmiENQC0E96w9tLo66bwNWygDUpf-Z6is3RsjNuJnZN7lcfGVdZPcPPqxZpr03p6hfU0Whr-4v2eInrpCNxBE-yb0sN-Yk-Ts9mxA5-AGgBywhBy8UW6qeYq5ntx9hTPxeROOurKS0qHxVhSdymcUs9vxdAbP0vdgcxhVNq5C8_vaqUkiKcs9C7QK95ywFokZdz2j7x_bTmCUI3ITey3qMDA-6Qcdtx91ulvrc8A6pCscevD-jojUc5bFjSJCIZ4BNmw";

const avatars = [
  {
    name: "Minh Anh",
    role: "Target 800+ achieved",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBEfsG3-W9GuZnB-lSVeHtzUVCq2ov-iionH0rc0cBMDP4wTmjUPnRSYcDISvkXKBG9ZKual8nKY840ObJc4ZekzMK-47okepuhPLlz1JPAHow8qXsIWZqCJ962UU0KKkNlsGv3r5CzO-5VTOPotUGQUWqWcSXLBN2wJ6FSBBmsHyD3bcKbjZGVjuFifsFo04AtUlxxVhWP_5AKJRYrZah_sa9LjE-zk9uZSGoQ-rZ2CvI5liTm3kQxCa1zyYlM_A2pEAfOdemT7lU",
    quote:
      "Giao diện rất dễ dùng, đặc biệt là phần giải thích chi tiết. Mình đã tăng từ 550 lên 820 chỉ sau 2 tháng luyện tập hằng ngày trên đây."
  },
  {
    name: "Hoàng Nam",
    role: "Final Score: 905",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBDo7iTVkUJzMXHD2VFK-Ly0gbsrv8jE8OFXqBVO7mEx3ZQIXJXO3dwJqxZUWT1_ms3Ullo_n3vMkiZ684yGB_hw_yysMEjpw75lROwS5SDKgkzYdKE2J3rK9t4VieGrsgwBNRTpbRstVxiUcPpYlQqacpE9o7-jca46on6SMtQEZ49hgq_JCNTzOQlBlmlWn7i6PMHv2RNI3y0qARj5sKR3D70NDPtkPJVEeSvWotsduGx_dyy4aor426ruLnvC3qakl-lV57jbVw",
    quote:
      "Vocabulary Notes là tính năng mình thích nhất. Việc lưu từ vựng và được nhắc nhở ôn tập giúp mình nhớ từ rất lâu mà không tốn sức."
  },
  {
    name: "Thanh Thảo",
    role: "Corporate English learner",
    image: roadmapImage,
    quote:
      "Công cụ học Speaking & Writing chấm điểm AI cực kỳ chính xác. Nó chỉ ra lỗi sai ngữ pháp mà trước đây mình không nhận ra."
  }
];

const steps = [
  {
    title: "Đánh giá năng lực",
    copy: "Làm bài test đầu vào ngắn gọn để xác định điểm yếu và điểm mạnh của bạn."
  },
  {
    title: "Học & Luyện tập mục tiêu",
    copy: "Tập trung vào các phần Part bạn còn yếu với kho bài tập chuyên sâu."
  },
  {
    title: "Mock Test & Bứt phá",
    copy: "Luyện đề như thi thật để rèn luyện tâm lý và đo điểm số mỗi mốc."
  }
];

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <HeroSection />
        <FeatureBento />
        <PersonalizedPath />
        <Testimonials />
        <HomeCta />
      </main>
      <Footer />
    </>
  );
}

function FeatureBento() {
  return (
    <section className="container-shell mb-32">
      <div className="mb-16 space-y-4 text-center">
        <h2 className="text-3xl font-black text-ink md:text-4xl">Tính Năng Ưu Việt</h2>
        <p className="mx-auto max-w-2xl text-base leading-7 text-muted">
          Mọi công cụ bạn cần để đạt điểm TOEIC tối đa trong tầm tay.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
        <Link
          href="/practice"
          className="glass-panel group relative overflow-hidden rounded-[28px] p-8 transition duration-300 hover:shadow-glass md:col-span-8"
        >
          <div className="relative z-10 flex min-h-[230px] flex-col justify-between">
            <div className="space-y-4">
              <IconTile tone="green">
                <Headphones size={24} />
              </IconTile>
              <h3 className="text-2xl font-black text-ink">Listening & Reading</h3>
              <p className="max-w-md leading-7 text-muted">
                Kho bài thi phong phú, sát với đề thi thật giúp bạn làm quen với
                cấu trúc và áp lực thời gian.
              </p>
            </div>
            <div className="mt-8 flex flex-wrap gap-2">
              {["Part 1-7", "Mock Test 2024", "Audio HD"].map((chip) => (
                <span
                  key={chip}
                  className="rounded-full bg-white/72 px-3 py-1 text-xs font-black text-growth-dark"
                >
                  {chip}
                </span>
              ))}
            </div>
          </div>
          <Image
            src={listeningImage}
            alt="Listening focus"
            width={360}
            height={360}
            className="absolute -right-10 bottom-0 hidden h-64 w-64 rounded-tl-[100px] object-cover opacity-20 transition duration-500 group-hover:opacity-100 md:block"
          />
        </Link>

        <Link
          href="/practice"
          className="glass-panel rounded-[28px] p-8 transition duration-300 hover:shadow-glass md:col-span-4"
        >
          <div className="space-y-4">
            <IconTile tone="blue">
              <PenLine size={24} />
            </IconTile>
            <h3 className="text-2xl font-black text-ink">Speaking & Writing</h3>
            <p className="leading-7 text-muted">
              Chấm điểm AI và hướng dẫn sửa lỗi ngữ pháp, phát âm chi tiết ngay lập tức.
            </p>
          </div>
        </Link>

        <Link
          href="/practice"
          className="glass-panel rounded-[28px] p-8 transition duration-300 hover:shadow-glass md:col-span-4"
        >
          <div className="space-y-4">
            <IconTile tone="gray">
              <MessageSquareText size={24} />
            </IconTile>
            <h3 className="text-2xl font-black text-ink">Detailed Explanation</h3>
            <p className="leading-7 text-muted">
              Tại sao đúng? Tại sao sai? Giải thích cặn kẽ từng câu hỏi bằng tiếng Việt.
            </p>
          </div>
        </Link>

        <Link
          href="/vocabulary"
          className="glass-panel flex flex-col gap-8 rounded-[28px] p-8 transition duration-300 hover:shadow-glass md:col-span-8 md:flex-row md:items-center"
        >
          <div className="flex-1 space-y-4">
            <IconTile tone="green">
              <BookOpen size={24} />
            </IconTile>
            <h3 className="text-2xl font-black text-ink">Vocabulary Notes</h3>
            <p className="leading-7 text-muted">
              Lưu từ vựng mới chỉ với 1 cú click. Hệ thống Spaced Repetition
              giúp bạn nhớ từ vựng mãi mãi.
            </p>
          </div>
          <div className="flex-1 rounded-2xl border border-white/50 bg-white/60 p-4">
            {[
              ["Collaborate", "Luyện tập: 3/5"],
              ["Innovative", "Luyện tập: 1/5"],
              ["Efficiency", "Luyện tập: 5/5"]
            ].map(([word, status], index) => (
              <div
                key={word}
                className={`flex items-center justify-between py-3 ${
                  index < 2 ? "border-b border-emerald-100" : ""
                }`}
              >
                <span className="font-black text-growth-dark">{word}</span>
                <span className="text-xs font-bold text-muted">{status}</span>
              </div>
            ))}
          </div>
        </Link>
      </div>
    </section>
  );
}

function PersonalizedPath() {
  return (
    <section className="container-shell mb-32 grid gap-12 lg:grid-cols-2 lg:items-center">
      <div className="space-y-6">
        <div className="inline-flex items-center gap-2 rounded-full bg-growth/22 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-growth-dark">
          <Route size={16} /> Lộ trình cá nhân hóa
        </div>
        <h2 className="text-4xl font-black leading-tight text-ink md:text-5xl">
          Hành trình chinh phục <span className="text-growth-dark">990 TOEIC</span>
        </h2>
        <p className="max-w-xl text-lg leading-8 text-muted">
          Hệ thống AI của chúng tôi phân tích trình độ hiện tại và mục tiêu của
          bạn để xây dựng một lộ trình học tập hiệu quả nhất.
        </p>

        <div className="mt-10 space-y-8">
          {steps.map((step, index) => (
            <div key={step.title} className="flex gap-5">
              <div className="flex flex-col items-center">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-growth-dark text-sm font-black text-white">
                  {index + 1}
                </span>
                {index < steps.length - 1 ? (
                  <span className="mt-2 h-full min-h-12 border-l border-dashed border-growth-dark/60" />
                ) : null}
              </div>
              <div>
                <h3 className="font-black text-growth-dark">{step.title}</h3>
                <p className="mt-1 max-w-lg leading-7 text-muted">{step.copy}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="relative">
        <div className="glass-panel overflow-hidden rounded-[32px] p-3">
          <Image
            src={roadmapImage}
            alt="Study Roadmap Interface"
            width={720}
            height={540}
            className="aspect-[4/3] w-full rounded-[25px] object-cover grayscale-[0.2]"
          />
        </div>
        <div className="glass-panel absolute -bottom-6 -right-4 max-w-[240px] rounded-2xl border-growth/20 p-5 shadow-glass md:-right-6">
          <div className="mb-3 flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-full bg-secondary-container text-academic-blue">
              <BrainCircuit size={22} />
            </div>
            <div className="font-black text-ink">Lộ trình được AI duyệt</div>
          </div>
          <p className="text-xs leading-5 text-muted">
            Tối ưu hóa thời gian học tập lên đến 40%.
          </p>
        </div>
      </div>
    </section>
  );
}

function Testimonials() {
  return (
    <section className="bg-white/60 py-24">
      <div className="container-shell">
        <div className="mb-14 space-y-4 text-center">
          <h2 className="text-3xl font-black text-ink md:text-4xl">
            Học viên nói gì về <span className="text-growth-dark">TOEIC Green</span>
          </h2>
          <p className="text-muted">
            Câu chuyện thành công từ những người đã thay đổi tương lai nhờ TOEIC.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {avatars.map((testimonial) => (
            <article
              key={testimonial.name}
              className="glass-panel rounded-[28px] p-8 transition duration-300 hover:shadow-glass"
            >
              <div className="mb-6 flex gap-1 text-growth-dark">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Star key={index} size={17} />
                ))}
              </div>
              <p className="min-h-36 italic leading-7 text-muted">
                “{testimonial.quote}”
              </p>
              <div className="mt-8 flex items-center gap-4">
                <Image
                  src={testimonial.image}
                  alt={`${testimonial.name} avatar`}
                  width={48}
                  height={48}
                  className="h-12 w-12 rounded-full object-cover"
                />
                <div>
                  <div className="font-black text-ink">{testimonial.name}</div>
                  <div className="text-xs font-bold text-growth-dark">
                    {testimonial.role}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function HomeCta() {
  return (
    <section className="container-shell py-24">
      <div className="relative overflow-hidden rounded-[32px] bg-growth-dark p-12 text-center text-white shadow-glass md:p-20">
        <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-growth/20 blur-3xl" />
        <div className="relative z-10 mx-auto max-w-3xl space-y-8">
          <h2 className="text-4xl font-black leading-tight md:text-5xl">
            Sẵn sàng để chinh phục chứng chỉ TOEIC?
          </h2>
          <p className="text-lg leading-8 text-white/80">
            Gia nhập cộng đồng hơn 12.000 học viên và nâng cao điểm số của bạn
            ngay hôm nay với phương pháp học hiện đại nhất.
          </p>
          <Link
            href="/practice"
            className="inline-flex min-h-14 items-center justify-center rounded-full bg-white px-10 py-4 font-black text-growth-dark shadow-soft transition hover:-translate-y-0.5"
          >
            Bắt đầu hoàn toàn miễn phí
          </Link>
        </div>
      </div>
    </section>
  );
}

function IconTile({
  children,
  tone
}: {
  children: ReactNode;
  tone: "green" | "blue" | "gray";
}) {
  const toneClass =
    tone === "green"
      ? "bg-growth text-academic-blue"
      : tone === "blue"
        ? "bg-secondary-container text-academic-blue"
        : "bg-zinc-200 text-zinc-600";

  return (
    <div className={`grid h-12 w-12 place-items-center rounded-xl ${toneClass}`}>
      {children}
    </div>
  );
}
