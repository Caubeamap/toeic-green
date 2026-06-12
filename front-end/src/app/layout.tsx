import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { AppBackground } from "@/components/layout/AppBackground";
import { AppProviders } from "@/components/layout/AppProviders";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin", "vietnamese"],
  variable: "--font-jakarta",
  display: "swap"
});

export const metadata: Metadata = {
  title: "TOEIC Green | Master TOEIC with Smart Practice",
  description:
    "Luyện thi TOEIC online, ghi chú từ vựng hằng ngày và xem giải thích chi tiết sau mỗi bài test."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className="scroll-smooth" suppressHydrationWarning>
      <head>
        <script
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                const badAttrs = [
                  'bis_register',
                  'cz-shortcut-listen',
                  'data-new-gr-c-s-check-loaded',
                  'data-gr-ext-installed',
                  'data-clean-paper'
                ];
                const clean = (el) => {
                  if (!el) return;
                  const attrs = el.attributes;
                  for (let i = attrs.length - 1; i >= 0; i--) {
                    const name = attrs[i].name;
                    if (
                      name.startsWith('bis_') ||
                      name.startsWith('__processed_') ||
                      name.startsWith('cz-') ||
                      name.startsWith('data-new-gr-') ||
                      name.startsWith('data-gr-') ||
                      badAttrs.includes(name)
                    ) {
                      el.removeAttribute(name);
                    }
                  }
                };
                clean(document.documentElement);
                const observer = new MutationObserver(() => {
                  clean(document.documentElement);
                  clean(document.body);
                });
                observer.observe(document.documentElement, { attributes: true, childList: true, subtree: true });
                window.addEventListener('DOMContentLoaded', () => {
                  clean(document.documentElement);
                  clean(document.body);
                });
              })();
            `
          }}
        />
      </head>
      <body
        className={`${jakarta.variable} bg-background font-sans text-on-surface antialiased`}
        suppressHydrationWarning
      >
        <AppProviders>
          <AppBackground />
          {children}
        </AppProviders>
      </body>
    </html>
  );
}
