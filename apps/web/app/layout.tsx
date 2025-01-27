import type { Metadata } from "next";
import { Oleo_Script, Lato, Sura } from "next/font/google";
import "./globals.scss";
import { Provider } from "../src/components/providers";
import NoSsrWrapper from "./no-ssr-wrapper";
import LayoutBody from "./layoutBody";
import { Suspense } from "react";
import ErrorBoundary from "../src/components/ErrorBoundary";

const oleoScript = Oleo_Script({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-oleo-script",
});

const lato = Lato({
  weight: ["100", "300", "400", "700", "900"],
  subsets: ["latin"],
  variable: "--font-lato",
});

const sura = Sura({
  weight: ["400"],
  subsets: ["latin"],
  variable: "--font-sura",
});

export const metadata: Metadata = {
  title: "My Trade App",
  description: "Trading application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${oleoScript.variable} ${lato.variable} ${sura.variable} font-sans font-lato text-foreground animated-bg-dark`}
      >
        <ErrorBoundary>
          <Suspense fallback={<div>Loading...</div>}>
            <NoSsrWrapper>
              <Provider theme={{ attribute: "class" }}>
                <LayoutBody>{children}</LayoutBody>
              </Provider>
            </NoSsrWrapper>
          </Suspense>
        </ErrorBoundary>
      </body>
    </html>
  );
}
