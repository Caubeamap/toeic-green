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
    <footer className="border-t border-outline-variant bg-white pb-10 pt-20">
      <div className="container-shell">
        <div className="mb-20 grid gap-12 md:grid-cols-4">
          <div className="space-y-6 md:col-span-1">
            <div className="text-2xl font-bold text-primary">TOEIC Green</div>
            <p className="max-w-sm text-body-md leading-relaxed text-on-surface-variant">
              Nền tảng luyện thi TOEIC thông minh, giúp bạn đạt điểm số mong muốn
              trong thời gian ngắn nhất bằng công nghệ AI tiên tiến.
            </p>
            <div className="flex gap-4">
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

          {columns.map((column) => (
            <div key={column.title}>
              <h3 className="mb-6 text-[12px] font-semibold uppercase tracking-widest text-on-surface">
                {column.title}
              </h3>
              <ul className="space-y-4">
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

        <div className="flex flex-col gap-6 border-t border-outline-variant pt-8 text-sm text-on-surface-variant md:flex-row md:items-center md:justify-between">
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
