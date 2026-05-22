import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "우리 반 방명록",
  description: "학과 방명록 서비스",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased bg-gray-100 flex justify-center min-h-screen">
        <div className="w-full max-w-md bg-white shadow-xl min-h-screen relative overflow-hidden flex flex-col">
          {children}
        </div>
      </body>
    </html>
  );
}
