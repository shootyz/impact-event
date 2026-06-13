import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Impact Gstaad — Event Anmeldung",
  description: "Registriere dich für Impact Gstaad Events",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="de" className={`h-full ${inter.variable}`} style={{ overflowX: "hidden" }}>
      <body className="min-h-full flex flex-col" style={{ fontFamily: "var(--font-inter), -apple-system, sans-serif", overflowX: "hidden" }}>
        {children}
      </body>
    </html>
  );
}
