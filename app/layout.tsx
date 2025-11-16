import type { Metadata } from "next";
// font is loaded via CSS in globals.css
import "./globals.css";
import { CanvasTokenProvider } from "./components/CanvasTokenProvider";


export const metadata: Metadata = {
  title: "Aztec StudyAI",
  description: "Aztec StudyAI is a chatbot that helps you study for your classes with Canvas information.",
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`antialiased`}>
        <CanvasTokenProvider>{children}</CanvasTokenProvider>
      </body>
    </html>
  );
}



