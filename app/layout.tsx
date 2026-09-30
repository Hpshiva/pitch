import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Local Business Lead Engine",
  description: "Local-first lead research, qualification and personalized outreach generator."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
