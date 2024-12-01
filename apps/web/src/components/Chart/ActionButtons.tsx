import { useTheme } from "next-themes";
import { themes } from "./constants/themes";
import { cn } from "@repo/utils/ui/helpers";

interface ActionButtonProps {
  onClick: () => void;
  title: string;
  icon: React.ReactNode;
}

export const ActionButtons = ({
  handleZoom,
  handlePan,
  resetView,
  rsiHeight,
}) => {
  const { theme } = useTheme();
  const defaultTheme = themes.dark!;
  const currentTheme = themes[theme as keyof typeof themes] || defaultTheme;

  return (
    <div
      className={cn(
        "absolute bottom-0 flex items-end justify-center p-5 z-[1000] opacity-0 transition-opacity duration-200 hover:opacity-100 touch:opacity-100 left-1/2 transform -translate-x-1/2 h-[100px]"
      )}
      style={{
        bottom: rsiHeight > 0 ? `${rsiHeight + 30}px` : "inherit",
      }}
    >
      <div
        className="flex gap-px rounded p-1 shadow-md"
        style={{
          background:
            currentTheme?.controlsBackground || defaultTheme.controlsBackground,
        }}
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
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      title={title}
      className="flex h-7 w-7 items-center justify-center rounded p-1.5 cursor-pointer transition-colors duration-200"
      style={{
        color: currentTheme.text || defaultTheme.text,
        backgroundColor: "transparent",
        "&:hover": {
          backgroundColor: currentTheme.buttonHover || defaultTheme.buttonHover,
        },
      }}
    >
      {icon}
    </button>
  );
};
