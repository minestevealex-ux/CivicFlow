import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CivicFlow | Municipal Operations",
  description: "Smart Civic Issue Reporting and Municipal Resource Management",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
