import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";

import "~/styles/globals.css";

import type { PropsWithChildren } from "react";

import { ThemeProvider } from "@de100/ui/theme";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FlowBrain",
  description: "The intelligent note-taking app",
};

export default function RootLayout(props: PropsWithChildren) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body
          className={`${geistSans.variable} ${geistMono.variable} font-geist-sans antialiased`}
        >
          <ThemeProvider attribute="class">{props.children}</ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
