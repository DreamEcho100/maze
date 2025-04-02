import type { Metadata } from "next";
import { Dancing_Script, Inter } from "next/font/google";

import "~/styles/globals.css";

const interFont = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const dancingScriptFont = Dancing_Script({
  variable: "--font-dancing-script",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Create Next App",
  description: "Generated by create next app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${interFont.variable} ${dancingScriptFont.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
