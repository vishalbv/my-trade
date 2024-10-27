"use client";

import { useEffect } from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { initializeWebSocket } from "../services/webSocket";
import { Toaster } from "@repo/ui/toaster";

export function Provider({ children, ...props }: any) {
  useEffect(() => {
    //for vaul drawer animation
    document.getElementById("app")?.setAttribute("vaul-drawer-wrapper", "");
    //initialize web socket
    initializeWebSocket();
  }, []);

  return (
    <div id="app">
      <NextThemesProvider
        {...props.theme}
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        {children}
      </NextThemesProvider>
      <Toaster />
    </div>
  );
}
