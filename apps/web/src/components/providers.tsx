"use client";

import { useEffect } from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { initializeWebSocket } from "../services/webSocket";
import { Toaster } from "@repo/ui/toaster";
import store from "../store/store";
import { Provider as StoreProvider } from "react-redux";
import Drawer from "../modules/Drawers/drawer";
import AuthCheckComponent from "../services/authCheck";
export function Provider({ children, ...props }: any) {
  useEffect(() => {
    //for vaul drawer animation
    document.getElementById("app")?.setAttribute("vaul-drawer-wrapper", "");
    //initialize web socket
    initializeWebSocket();
  }, []);

  return (
    <div id="app">
      <StoreProvider store={store}>
        <Drawer />

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
        <AuthCheckComponent />
      </StoreProvider>
    </div>
  );
}
