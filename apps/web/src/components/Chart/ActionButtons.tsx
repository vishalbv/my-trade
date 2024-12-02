import { useTheme } from "next-themes";
import { themes } from "./constants/themes";
import { cn } from "@repo/utils/ui/helpers";
import { useEffect, useRef, useState } from "react";
import { Button } from "@repo/ui/button";

interface ActionButtonProps {
  onClick: () => void;
  title: string;
  icon: React.ReactNode;
}

interface ActionButtonsProps {
  handleZoom: (scale: number) => void;
  handlePan: (offset: number) => void;
  resetView: () => void;
  rsiHeight: number;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({
  handleZoom,
  handlePan,
  resetView,
  rsiHeight,
}) => {
  const { theme } = useTheme();
  const defaultTheme = themes.dark!;
  const currentTheme = themes[theme as keyof typeof themes] || defaultTheme;
  const [isVisible, setIsVisible] = useState(false);
  const buttonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!buttonRef.current) return;

      const rect = buttonRef.current.getBoundingClientRect();
      const buffer = 50; // Detection area above the buttons

      const isNearButtons =
        e.clientX >= rect.left - buffer &&
        e.clientX <= rect.right + buffer &&
        e.clientY >= rect.top - buffer * 1.5 &&
        e.clientY <= rect.bottom + buffer;

      setIsVisible(isNearButtons);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div
      ref={buttonRef}
      className={cn(
        "absolute bottom-0 flex items-end justify-center z-[1000] transition-opacity duration-200 touch:opacity-100 left-1/2 transform -translate-x-1/2",
        isVisible ? "opacity-100" : "opacity-0"
      )}
      style={{
        bottom: rsiHeight > 0 ? `${rsiHeight + 50}px` : "50px",
      }}
    >
      <div
        className="flex rounded shadow-md"
        // style={{
        //   background:
        //     currentTheme?.controlsBackground || defaultTheme.controlsBackground,
        // }}
      >
        <ActionButton
          onClick={() => handleZoom(0.9)}
          title="Zoom Out (-)"
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 18 18"
              width="18"
              height="18"
            >
              <path fill="currentColor" d="M14 10H4V8.5h10V10Z"></path>
            </svg>
          }
        />
        <ActionButton
          onClick={() => handleZoom(1.1)}
          title="Zoom In (+)"
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 18 18"
              width="18"
              height="18"
            >
              <path
                fill="currentColor"
                d="M8.25 13.75v-9.5h1.5v9.5h-1.5Z"
              ></path>
              <path
                fill="currentColor"
                d="M13.75 9.75h-9.5v-1.5h9.5v1.5Z"
              ></path>
            </svg>
          }
        />
        <ActionButton
          onClick={() => handlePan(-10)}
          title="Pan Left"
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 18 18"
              width="18"
              height="18"
              className="rotate-180"
            >
              <path
                fill="currentColor"
                d="M7.83 3.92 12.28 9l-4.45 5.08-1.13-1L10.29 9l-3.6-4.09 1.14-.99Z"
              ></path>
            </svg>
          }
        />
        <ActionButton
          onClick={() => handlePan(10)}
          title="Pan Right"
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 18 18"
              width="18"
              height="18"
            >
              <path
                fill="currentColor"
                d="M7.83 3.92 12.28 9l-4.45 5.08-1.13-1L10.29 9l-3.6-4.09 1.14-.99Z"
              ></path>
            </svg>
          }
        />
        <ActionButton
          onClick={resetView}
          title="Reset Chart"
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 18 18"
              width="18"
              height="18"
            >
              <path
                fill="currentColor"
                d="M10 6.38V8L6 5.5 10 3v1.85A5.25 5.25 0 1 1 3.75 10a.75.75 0 0 1 1.5 0A3.75 3.75 0 1 0 10 6.38Z"
              ></path>
            </svg>
          }
        />
      </div>
    </div>
  );
};

const ActionButton: React.FC<ActionButtonProps> = ({
  onClick,
  title,
  icon,
}) => {
  const { theme } = useTheme();
  const defaultTheme = themes.dark!;
  const currentTheme = themes[theme as keyof typeof themes] || defaultTheme;

  return (
    <Button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      variant="light"
      title={title}
      className="flex h-8 w-8 items-center justify-center rounded p-1.5 cursor-pointer transition-colors duration-200"
      //   className="flex h-7 w-7 items-center justify-center rounded p-1.5 cursor-pointer transition-colors duration-200"
      //   style={{
      //     color: currentTheme.text || defaultTheme.text,
      //     backgroundColor: "transparent",
      //     "&:hover": {
      //       backgroundColor: currentTheme.buttonHover || defaultTheme.buttonHover,
      //     },
      //   }}
    >
      {icon}
    </Button>
  );
};
