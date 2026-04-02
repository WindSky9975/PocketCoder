import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PocketCoder",
  description: "PocketCoder mobile-first web shell.",
  manifest: "/manifest.webmanifest"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}