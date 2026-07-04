import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HoK Codex",
  description: "Honor of Kings Global reference: items, skills, arcana, and live patch tracking",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-[#0D0D0D] text-[#F0F0F0] antialiased">{children}</body>
    </html>
  );
}
