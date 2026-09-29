import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "../styles/jaseir-kit.css";
import SiteHeader from "../components/layout/SiteHeader";
import SiteFooter from "../components/layout/SiteFooter";
import { hubMetadata } from "../lib/agent-metadata";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = hubMetadata();

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <SiteHeader zone={{ kind: "hub" }} />
        {children}
        <SiteFooter zone={{ kind: "hub" }} />
      </body>
    </html>
  );
}
