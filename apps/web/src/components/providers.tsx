"use client";

import { useEffect } from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { initializeWebSocket } from "../services/webSocket";
import { Toaster } from "@repo/ui/toaster";
import store, { RootState } from "../store/store";
import { Provider as StoreProvider, useSelector } from "react-redux";

import AuthCheckComponent from "../services/authCheck";
import { fyersDataSocketService } from "../services/fyersDataSocket";
export function Provider({ children, ...props }: any) {
  return (
    <div id="app">
      <StoreProvider store={store} stabilityCheck="never">
        <NextThemesProvider
          {...props.theme}
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Initialize />
          {children}
        </NextThemesProvider>
        <Toaster />
        <AuthCheckComponent />
      </StoreProvider>
    </div>
  );
}

function Initialize() {
  const { access_token, app_id } = useSelector(
    (state: RootState) => state.states.fyers
  );
  useEffect(() => {
    //for vaul drawer animation
    document.getElementById("app")?.setAttribute("vaul-drawer-wrapper", "");
    //initialize web socket
    initializeWebSocket();
  }, []);

  useEffect(() => {
    if (access_token) {
      fyersDataSocketService.connect(app_id + ":" + access_token);
    }
  }, [access_token, app_id]);

  return null;
}
