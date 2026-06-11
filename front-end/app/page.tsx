import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { HeroSection } from "@/components/home/HeroSection";
import { MaterialIcon } from "@/components/common/MaterialIcon";

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
    role: "Final Score: 910",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBDo7iTVkUJzMXHD2VFK-Ly0gbsrv8jE8OFXqBVO7mEx3ZQIXJXO3dwJqxZUWT1_ms3Ullo_n3vMkiZ684yGB_hw_yysMEjpw75lROwS5SDKgkzYdKE2J3rK9t4VieGrsgwBNRTpbRstVxiUcPpYlQqacpE9o7-jca46on6SMtQEZ49hgq_JCNTzOQlBlmlWn7i6PMHv2RNI3y0qARj5sKR3D70NDPtkPJVEeSvWotsduGx_dyy4aor426ruLnvC3qakl-lV57jbVw",
    quote:
      "Vocabulary Notes là tính năng mình thích nhất. Việc lưu từ vựng và được nhắc nhở ôn tập giúp mình nhớ từ rất lâu mà không tốn sức."
  },
  {
    name: "Thanh Thảo",
    role: "Corporate English Learner",
    image: roadmapImage,
    quote:
      "Công cụ học Speaking & Writing chấm điểm AI cực kỳ chính xác. Nó chỉ ra lỗi sai ngữ pháp mà trước đây mình chẳng bao giờ nhận ra."
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
    copy: "Luyện đề như thi thật để rèn luyện tâm lý và đạt điểm số mơ ước."
  }
];

export default function Home() {
  return (
    <>
      <Header />
      <main className="relative pt-32">
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
        <h2 className="text-headline-lg font-bold text-on-surface">Tính Năng Ưu Việt</h2>
        <p className="mx-auto max-w-2xl text-body-md text-on-surface-variant">
          Mọi công cụ bạn cần để đạt điểm TOEIC tối đa trong tầm tay.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
        <Link
          href="/practice"
          className="glass-card interactive-surface group relative overflow-hidden rounded-[28px] p-8 md:col-span-8"
        >
          <div className="relative z-10 flex min-h-[230px] flex-col justify-between">
            <div className="space-y-4">
              <IconTile tone="primary">
                <MaterialIcon name="headphones" className="h-6 w-6" />
              </IconTile>
              <h3 className="text-headline-md font-bold">Listening & Reading</h3>
              <p className="max-w-md text-body-md text-on-surface-variant">
                Kho bài thi phong phú, sát với đề thi thật giúp bạn làm quen với
                cấu trúc và áp lực thời gian.
              </p>
            </div>
            <div className="mt-8 flex flex-wrap gap-2">
              {["Part 1-7", "Mock Test 2024", "Audio HD"].map((chip) => (
                <span
                  key={chip}
                  className="rounded-full bg-surface-container px-3 py-1 text-label-sm text-primary"
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
            className="absolute -right-10 bottom-0 hidden h-64 w-64 rounded-tl-[100px] object-cover opacity-35 md:block"
          />
        </Link>

        <Link
          href="/practice"
          className="glass-card interactive-surface rounded-[28px] p-8 md:col-span-4"
        >
          <div className="space-y-4">
            <IconTile tone="secondary">
              <MaterialIcon name="edit_note" className="h-6 w-6" />
            </IconTile>
            <h3 className="text-headline-md font-bold">Speaking & Writing</h3>
            <p className="text-body-md text-on-surface-variant">
              Chấm điểm AI và hướng dẫn sửa lỗi ngữ pháp, phát âm chi tiết ngay lập tức.
            </p>
          </div>
        </Link>

        <Link
          href="/practice"
          className="glass-card interactive-surface rounded-[28px] p-8 md:col-span-4"
        >
          <div className="space-y-4">
            <IconTile tone="tertiary">
              <MaterialIcon name="menu_book" className="h-6 w-6" />
            </IconTile>
            <h3 className="text-headline-md font-bold">Detailed Explanation</h3>
            <p className="text-body-md text-on-surface-variant">
              Tại sao đúng? Tại sao sai? Giải thích cặn kẽ từng câu hỏi bằng tiếng Việt.
            </p>
          </div>
        </Link>

        <Link
          href="/vocabulary"
          className="glass-card interactive-surface flex flex-col gap-8 rounded-[28px] p-8 md:col-span-8 md:flex-row md:items-center"
        >
          <div className="flex-1 space-y-4">
            <IconTile tone="fixed">
              <MaterialIcon name="history_edu" className="h-6 w-6" />
            </IconTile>
            <h3 className="text-headline-md font-bold">Vocabulary Notes</h3>
            <p className="text-body-md text-on-surface-variant">
              Lưu từ vựng mới chỉ với 1 cú click. Hệ thống Spaced Repetition giúp bạn
              nhớ từ vựng mãi mãi.
            </p>
          </div>
          <div className="w-full flex-1 rounded-xl border border-white/40 bg-white/60 p-4">
            {[
              ["Collaborate", "Luyện tập: 3/5"],
              ["Innovative", "Luyện tập: 1/5"],
              ["Efficiency", "Luyện tập: 5/5"]
            ].map(([word, status], index) => (
              <div
                key={word}
                className={`flex items-center justify-between py-2 ${
                  index < 2 ? "border-b border-surface-container-highest pb-2" : ""
                }`}
              >
                <span className="font-bold text-primary">{word}</span>
                <span className="text-[12px] text-on-surface-variant">{status}</span>
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
    <section className="relative overflow-hidden py-24">
      <div
        className="pointer-events-none absolute inset-0 opacity-5"
        style={{
          backgroundImage: "radial-gradient(#006e19 1px, transparent 1px)",
          backgroundSize: "32px 32px"
        }}
      />
      <div className="container-shell relative">
        <div className="flex flex-col items-center gap-16 md:flex-row">
          <div className="space-y-6 md:w-1/2">
            <div className="inline-block rounded-full bg-primary-fixed-dim/30 px-4 py-1 text-label-sm font-bold uppercase tracking-widest text-primary">
              Lộ trình cá nhân hóa
            </div>
            <h2 className="text-display-lg-mobile font-extrabold leading-tight text-on-surface md:text-display-lg">
              Hành trình chinh phục <span className="text-primary">990 TOEIC</span>
            </h2>
            <p className="max-w-xl text-body-lg text-on-surface-variant">
              Hệ thống AI của chúng tôi phân tích trình độ hiện tại và mục tiêu của
              bạn để xây dựng một lộ trình học tập hiệu quả nhất.
            </p>

            <div className="mt-10 space-y-0">
              {steps.map((step, index) => (
                <div key={step.title} className="relative flex gap-6">
                  <div className="flex flex-col items-center">
                    <span className="z-10 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-on-primary">
                      {index + 1}
                    </span>
                    {index < steps.length - 1 ? (
                      <span className="step-line mt-2 h-full min-h-12 w-0.5" />
                    ) : null}
                  </div>
                  <div className={index < steps.length - 1 ? "pb-10" : ""}>
                    <h3 className="text-headline-md font-bold text-primary">{step.title}</h3>
                    <p className="mt-1 text-body-md text-on-surface-variant">{step.copy}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative md:w-1/2">
            <div className="glass-card interactive-surface rounded-[32px] p-4 shadow-soft">
              <Image
                src={roadmapImage}
                alt="Study Roadmap Interface"
                width={720}
                height={540}
                className="aspect-[4/4] w-full rounded-[24px] object-cover grayscale-[0.2]"
              />
              <div className="glass-card interactive-surface absolute -bottom-6 -right-6 max-w-[240px] rounded-2xl border-primary/20 p-6 shadow-soft">
                <div className="mb-3 flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary-container text-secondary">
                    <MaterialIcon name="verified" className="h-6 w-6" />
                  </div>
                  <div className="text-label-md font-semibold text-on-surface">
                    Lộ trình được AI duyệt
                  </div>
                </div>
                <p className="text-[12px] text-on-surface-variant">
                  Tối ưu hóa thời gian học tập lên đến 40%.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Testimonials() {
  return (
    <section className="bg-surface-container-low/50 py-24">
      <div className="container-shell">
        <div className="mb-16 space-y-4 text-center">
          <h2 className="text-headline-lg font-bold text-on-surface">
            Học viên nói gì về <span className="text-primary">TOEIC Green</span>
          </h2>
          <p className="text-body-md text-on-surface-variant">
            Câu chuyện thành công từ những người đã thay đổi tương lai nhờ TOEIC.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {avatars.map((testimonial) => (
            <article
              key={testimonial.name}
              className="glass-card interactive-surface flex flex-col justify-between rounded-3xl p-8"
            >
              <div className="space-y-4">
                <div className="flex text-primary">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <MaterialIcon key={index} name="star" filled className="h-5 w-5" />
                  ))}
                </div>
                <p className="min-h-36 text-body-md italic text-on-surface-variant">
                  &ldquo;{testimonial.quote}&rdquo;
                </p>
              </div>
              <div className="mt-8 flex items-center gap-4">
                <Image
                  src={testimonial.image}
                  alt={`${testimonial.name} avatar`}
                  width={48}
                  height={48}
                  className="h-12 w-12 rounded-full object-cover"
                />
                <div>
                  <div className="text-label-md font-semibold text-on-surface">
                    {testimonial.name}
                  </div>
                  <div className="text-[12px] text-primary">{testimonial.role}</div>
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
    <section className="container-shell my-32">
      <div className="relative overflow-hidden rounded-[40px] bg-primary p-12 text-center shadow-soft md:p-24">
        <div className="absolute -right-32 -top-32 h-80 w-80 rounded-full bg-white/10" />
        <div className="absolute -bottom-32 -left-32 h-80 w-80 rounded-full bg-primary-fixed/15" />
        <div className="relative z-10 mx-auto max-w-3xl space-y-8">
          <h2 className="text-display-lg-mobile font-extrabold leading-tight text-on-primary md:text-display-lg">
            Sẵn sàng để chinh phục chứng chỉ TOEIC?
          </h2>
          <p className="text-body-lg text-white/80">
            Gia nhập cộng đồng hơn 12.000 học viên và nâng cao điểm số của bạn ngay
            hôm nay với phương pháp học hiện đại nhất.
          </p>
          <Link
            href="/practice"
            className="button-sheen inline-flex min-h-14 items-center justify-center rounded-full bg-white px-12 py-5 text-headline-md font-bold text-primary shadow-soft hover:bg-primary-container"
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
  tone: "primary" | "secondary" | "tertiary" | "fixed";
}) {
  const toneClass =
    tone === "primary"
      ? "bg-primary-container text-on-primary-container"
      : tone === "secondary"
        ? "bg-secondary-container text-on-secondary-container"
        : tone === "tertiary"
          ? "bg-tertiary-container text-on-tertiary-container"
          : "bg-primary-fixed text-on-primary-fixed-variant";

  return (
    <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${toneClass}`}>
      {children}
    </div>
  );
}
