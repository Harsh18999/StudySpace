import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";

export const metadata: Metadata = {
  title: "StudySpace.AI — Learn Smarter, Build Faster",
  description:
    "Organize your learning with videos, quizzes, notes, resources, and flashcards — all in one place.",
  keywords: ["Gate 2027", "LMS", "learning", "courses", "flashcards", "quizzes", "notes"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-[#FAF7F2] text-[#1C1917] antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
