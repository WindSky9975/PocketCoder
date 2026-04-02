import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import { AppShellFrame } from "../components/ui/app-shell-frame.tsx";
import { LocaleProvider } from "../lib/i18n/provider.tsx";

import "./globals.css";

export const metadata: Metadata = {
  title: "PocketCoder",
  description: "PocketCoder 的手机优先配对编码控制台。",
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0d9488",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <LocaleProvider>
          <AppShellFrame>{children}</AppShellFrame>
        </LocaleProvider>
      </body>
    </html>
  );
}
