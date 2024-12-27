"use client";

import { useEffect, useRef } from "react";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@repo/ui/resizable";
import { TopWindow } from "./topWindow";
import { RightWindow } from "./rightWindow";
import Header from "../src/modules/Header/header";
import Sidebar from "../src/modules/Sidebar/sidebar";
import { Footer } from "../src/modules/Footer/footer";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../src/store/store";
import { usePathname } from "next/navigation";
import { layoutIgnorePaths, STYLES } from "../src/utils/constants";
import { setRightWindowSize } from "../src/store/slices/webAppSlice";

const TopWindowAndMain = ({
  children,
  handleDoubleClickTopHandle,
  isTopWindow,
  topPanelRef,
}: {
  children: React.ReactNode;
  handleDoubleClickTopHandle: () => void;
  isTopWindow: boolean;
  topPanelRef: any;
}) => {
  return (
    <>
      {isTopWindow ? (
        <ResizablePanelGroup
          direction="vertical"
          className="flex flex-col flex-1"
        >
          <ResizablePanel defaultSize={0} collapsible ref={topPanelRef}>
            <TopWindow />
          </ResizablePanel>
          <ResizableHandle
            withHandle
            onDoubleClick={handleDoubleClickTopHandle}
            className="!h-1"
          />
          <ResizablePanel defaultSize={100} minSize={30}>
            <main className="h-full overflow-y-auto mb-6">{children}</main>
          </ResizablePanel>
        </ResizablePanelGroup>
      ) : (
        <div className="flex flex-1 h-full w-full">
          <main className="h-full overflow-y-auto mb-6 w-full">{children}</main>
        </div>
      )}
    </>
  );
};

export default function LayoutBody({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const {
    showOptionsAnalyzer,
    showPositionsOrders,
    topWindowSize,
    rightWindowSize,
  } = useSelector((state: RootState) => state.webApp);
  const isRightWindow = showOptionsAnalyzer;
  const isTopWindow = showPositionsOrders;

  const dispatch = useDispatch();

  const rightPanelRef = useRef<any>(null);
  const topPanelRef = useRef<any>(null);

  const handleDoubleClickRightHandle = () => {
    if (rightPanelRef.current?.getSize() === 0) {
      rightPanelRef.current?.resize(25);
    } else {
      rightPanelRef.current?.resize(0);
    }
  };

  const handleDoubleClickTopHandle = () => {
    if (topPanelRef.current?.getSize() === 0) {
      topPanelRef.current?.resize(30);
    } else {
      topPanelRef.current?.resize(0);
    }
  };

  useEffect(() => {
    topPanelRef.current?.resize(topWindowSize);
  }, [topWindowSize]);

  useEffect(() => {
    rightPanelRef.current?.resize(rightWindowSize);
  }, [rightWindowSize]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        e.stopPropagation();
        handleDoubleClickTopHandle();
      }
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === "Enter") {
        e.preventDefault();
        e.stopPropagation();
        handleDoubleClickRightHandle();
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, []);

  const pathname = usePathname();

  return layoutIgnorePaths.includes(pathname) ? (
    <div className="flex h-screen w-full flex-col items-center justify-center">
      {children}
    </div>
  ) : (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />

        <div
          style={{
            height: `calc(100vh - ${STYLES.footer.height} - ${STYLES.header.height})`,
            width: "100%",
          }}
        >
          {isRightWindow ? (
            <ResizablePanelGroup direction="horizontal" className="flex flex-1">
              <ResizablePanel defaultSize={100} minSize={30}>
                <TopWindowAndMain
                  handleDoubleClickTopHandle={handleDoubleClickTopHandle}
                  isTopWindow={isTopWindow}
                  topPanelRef={topPanelRef}
                >
                  {children}
                </TopWindowAndMain>
              </ResizablePanel>
              <ResizableHandle
                withHandle
                onDoubleClick={handleDoubleClickRightHandle}
                className="!w-1"
              />
              <ResizablePanel defaultSize={0} collapsible ref={rightPanelRef}>
                <RightWindow />
              </ResizablePanel>
            </ResizablePanelGroup>
          ) : (
            <div className="flex flex-1">
              <TopWindowAndMain
                handleDoubleClickTopHandle={handleDoubleClickTopHandle}
                isTopWindow={isTopWindow}
                topPanelRef={topPanelRef}
              >
                {children}
              </TopWindowAndMain>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
