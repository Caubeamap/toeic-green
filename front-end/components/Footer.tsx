import { Mail, MessageCircle, Share2 } from "lucide-react";
import Link from "next/link";

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

const socialLinks = [
  { id: "mail", icon: Mail },
  { id: "message", icon: MessageCircle },
  { id: "share", icon: Share2 }
];

export function Footer() {
  return (
    <footer className="border-t border-emerald-100 bg-white">
      <div className="container-shell py-16">
        <div className="grid gap-12 lg:grid-cols-4">
          <div className="space-y-6">
            <div className="text-2xl font-black text-growth-dark">TOEIC Green</div>
            <p className="max-w-sm leading-7 text-muted">
              Nền tảng luyện thi TOEIC thông minh, giúp bạn đạt điểm số mong
              muốn trong thời gian ngắn nhất bằng công nghệ AI tiên tiến.
            </p>
            <div className="flex gap-4">
              {socialLinks.map(({ id, icon: Icon }) => (
                <button
                  key={id}
                  className="grid h-9 w-9 place-items-center rounded-full bg-zinc-100 text-growth-dark transition hover:bg-growth"
                  aria-label="Social link"
                >
                  <Icon size={17} />
                </button>
              ))}
            </div>
          </div>

          {columns.map((column) => (
            <div key={column.title}>
              <h3 className="text-sm font-black uppercase tracking-[0.14em] text-ink">
                {column.title}
              </h3>
              <ul className="mt-6 space-y-4">
                {column.links.map(([label, href]) => (
                  <li key={label}>
                    <Link
                      href={href}
                      className="text-sm font-semibold text-muted transition hover:text-growth-dark"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-16 flex flex-col gap-4 border-t border-emerald-100 pt-8 text-sm font-semibold text-muted md:flex-row md:items-center md:justify-between">
          <p>© 2026 TOEIC Green. All rights reserved. Made for excellence.</p>
          <div className="flex gap-8">
            <a className="underline transition hover:text-growth-dark" href="#">
              Privacy Policy
            </a>
            <a className="underline transition hover:text-growth-dark" href="#">
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
