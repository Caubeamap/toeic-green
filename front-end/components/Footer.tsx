import Image from "next/image";
import Link from "next/link";
import { MaterialIcon } from "@/components/MaterialIcon";

const columns = [
  {
    title: "Học tập",
    links: [
      ["Practice Tests", "/practice"],
      ["Full Mock Test", "/practice"],
      ["Vocabulary Master", "/vocabulary"],
      ["Grammar Guide", "/study-plan"]
    ]
  },
  {
    title: "Công cụ",
    links: [
      ["AI Speaking Coach", "/practice"],
      ["Writing Assistant", "/practice"],
      ["Study Plan Generator", "/study-plan"],
      ["Progress Analytics", "/progress"]
    ]
  },
  {
    title: "Hỗ trợ",
    links: [
      ["Trung tâm trợ giúp", "#"],
      ["Điều khoản sử dụng", "#"],
      ["Chính sách bảo mật", "#"],
      ["Liên hệ quảng cáo", "#"]
    ]
  }
];

const socialIcons = ["public", "alternate_email", "share"] as const;

export function Footer() {
  return (
    <footer className="border-t border-outline-variant bg-white py-12">
      <div className="container-shell">
        <div className="mb-12 grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-stretch">
          <div className="glass-card rounded-[28px] bg-white/70 p-8">
            <div className="text-2xl font-bold text-primary">TOEIC Green</div>
            <p className="mt-4 max-w-xl text-body-md leading-relaxed text-on-surface-variant">
              Nền tảng luyện thi TOEIC thông minh, giúp bạn luyện tập đều đặn,
              theo dõi tiến độ và cải thiện điểm số với trải nghiệm học tập hiện đại.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <span className="rounded-full bg-primary-container px-4 py-2 text-label-sm font-bold text-on-primary-container">
                16+ ETS tests
              </span>
              <span className="rounded-full bg-secondary-container px-4 py-2 text-label-sm font-bold text-on-secondary-container">
                SW practice
              </span>
              <span className="rounded-full bg-surface-container px-4 py-2 text-label-sm font-bold text-on-surface-variant">
                Progress history
              </span>
            </div>

            <div className="mt-6 flex gap-3">
              {socialIcons.map((icon) => (
                <a
                  key={icon}
                  href="#"
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-container text-primary transition hover:bg-primary hover:text-on-primary"
                  aria-label={icon}
                >
                  <MaterialIcon name={icon} className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          <div className="relative min-h-[240px] overflow-hidden rounded-[28px] border border-white/70 shadow-soft">
            <Image
              src="/images/footer-study-visual.png"
              alt="TOEIC Green study workspace"
              fill
              sizes="(min-width: 1024px) 48vw, 100vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 via-transparent to-secondary/10" />
          </div>
        </div>

        <div className="mb-10 grid gap-8 md:grid-cols-3">
          {columns.map((column) => (
            <div key={column.title}>
              <h3 className="mb-4 text-[12px] font-semibold uppercase tracking-widest text-on-surface">
                {column.title}
              </h3>
              <ul className="space-y-3">
                {column.links.map(([label, href]) => (
                  <li key={label}>
                    <Link
                      href={href}
                      className="text-body-md text-on-surface-variant transition hover:text-primary"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-5 border-t border-outline-variant pt-6 text-sm text-on-surface-variant md:flex-row md:items-center md:justify-between">
          <p>© 2026 TOEIC Green. All rights reserved. Made for excellence.</p>
          <div className="flex gap-8">
            <a
              className="text-label-sm text-on-tertiary-container underline opacity-80 transition hover:text-primary hover:opacity-100"
              href="#"
            >
              Privacy Policy
            </a>
            <a
              className="text-label-sm text-on-tertiary-container underline opacity-80 transition hover:text-primary hover:opacity-100"
              href="#"
            >
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
