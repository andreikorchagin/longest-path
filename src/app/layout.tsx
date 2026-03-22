import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Longest Path — Running Route Builder",
  description:
    "Build running routes that maximize interesting exploration instead of minimizing distance",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full overflow-hidden">{children}</body>
    </html>
  );
}
