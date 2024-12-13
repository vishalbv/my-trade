import type { Metadata } from "next";
import { Oleo_Script, Lato, Sura } from "next/font/google";
import "./globals.scss";
import { Provider } from "../src/components/providers";
import Header from "../src/modules/Header/header";
import Sidebar from "../src/modules/Sidebar/sidebar";
import NoSsrWrapper from "./no-ssr-wrapper";
import { Footer } from "../src/modules/Footer/footer";

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
    <html lang="en">
      <body
        className={`${oleoScript.variable} ${lato.variable} ${sura.variable} font-sans font-lato text-foreground animated-bg-dark`}
      >
        <NoSsrWrapper>
          <Provider theme={{ attribute: "class" }}>
            <div className="flex h-screen">
              <Sidebar />
              <div className="flex flex-col flex-1 overflow-hidden">
                <Header />
                <main className="flex-1 overflow-y-auto mb-6">{children}</main>
                <Footer />
              </div>
            </div>
          </Provider>
        </NoSsrWrapper>
      </body>
    </html>
  );
}
