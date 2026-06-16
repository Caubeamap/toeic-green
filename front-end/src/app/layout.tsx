import type { Metadata } from "next";
import { Be_Vietnam_Pro, Merriweather } from "next/font/google";
import { AppBackground } from "@/components/layout/AppBackground";
import { AppProviders } from "@/components/layout/AppProviders";
import "./globals.css";

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-be-vietnam",
  display: "swap"
});

const merriweather = Merriweather({
  subsets: ["latin", "vietnamese"],
  weight: ["300", "400", "700"],
  variable: "--font-merriweather",
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
                const isBadAttr = (name) =>
                  name.startsWith('bis_') ||
                  name.startsWith('__processed_') ||
                  name.startsWith('cz-') ||
                  name.startsWith('data-new-gr-') ||
                  name.startsWith('data-gr-') ||
                  badAttrs.includes(name);
                const cleanElement = (element) => {
                  if (!element || element.nodeType !== Node.ELEMENT_NODE) return;
                  const attrs = element.attributes;
                  for (let i = attrs.length - 1; i >= 0; i--) {
                    const name = attrs[i].name;
                    if (isBadAttr(name)) {
                      element.removeAttribute(name);
                    }
                  }
                };
                const cleanTree = (root) => {
                  cleanElement(root);
                  if (!root || !root.querySelectorAll) return;
                  root.querySelectorAll('*').forEach(cleanElement);
                };
                cleanTree(document.documentElement);
                const observer = new MutationObserver((records) => {
                  records.forEach((record) => {
                    if (record.type === 'attributes') {
                      cleanElement(record.target);
                    }
                    record.addedNodes.forEach(cleanTree);
                  });
                });
                observer.observe(document.documentElement, { attributes: true, childList: true, subtree: true });
                window.addEventListener('DOMContentLoaded', () => {
                  cleanTree(document.documentElement);
                });
              })();
            `
          }}
        />
      </head>
      <body
        className={`${beVietnamPro.variable} ${merriweather.variable} bg-background font-sans text-on-surface antialiased`}
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
