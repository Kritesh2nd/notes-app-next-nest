import type { Metadata } from "next";
import "./globals.css";
import { ContentProvider } from "@/context/ContentContext";
import { AuthProvider } from "@/context/AuthContext";
import { ToastProvider } from "@/components/Toast";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { BlueprintBackdrop } from "@/components/Schematic";

export const metadata: Metadata = {
  title: "Blueprint Notes — Draft your thinking like an engineer",
  description:
    "A Markdown-first notes workspace with a blueprint / technical-drawing aesthetic. Create an account, draft notes, and organise your thinking with precision.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">
        <ContentProvider>
          <AuthProvider>
            <ToastProvider>
              <BlueprintBackdrop />
              <div className="flex min-h-screen flex-col">
                <Navbar />
                <main className="flex-1">{children}</main>
                <Footer />
              </div>
            </ToastProvider>
          </AuthProvider>
        </ContentProvider>
      </body>
    </html>
  );
}
