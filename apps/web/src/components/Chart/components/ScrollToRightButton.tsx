import { Button } from "@repo/ui/button";
import { ChartTheme } from "../types";
import { cn } from "@repo/utils/ui/helpers";

interface ScrollToRightButtonProps {
  onClick: () => void;
  theme: ChartTheme;
  className?: string;
  isVisible: boolean;
}

const ScrollToRightIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 18 18"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M6 5L10 9L6 13"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M10 5L14 9L10 13"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const ScrollToRightButton = ({
  onClick,
  theme,
  className,
  isVisible,
}: ScrollToRightButtonProps) => {
  if (!isVisible) return null;

  return (
    <Button
      variant="light"
      size="icon"
      onClick={onClick}
      className={cn(
        "absolute right-20 bottom-[50px] z-10 h-[26px] w-[26px] opacity-80 transition-all shadow-sm shadow-foreground/20",
        "hover:opacity-100 hover:border-foreground",
        "bg-background border-border",
        className
      )}
      title="Scroll to Right"
    >
      <ScrollToRightIcon />
    </Button>
  );
};
