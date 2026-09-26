import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
title: "Cloud Cost Analytics | Atomity Challenge",
description:
"A focused cloud cost analytics experience for exploring infrastructure spend across clusters, namespaces, and pods.",
};

export const viewport: Viewport = {
width: "device-width",
initialScale: 1,
};

export default function RootLayout({
children,
}: Readonly<{
children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
