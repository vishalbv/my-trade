import React from "react";

export const CrosshairIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {/* Center cross */}
    <path d="M12 12L12 8M12 12L12 16M12 12L8 12M12 12L16 12" />
    {/* Corner marks */}
    <path d="M7 4L4 4L4 7" />
    <path d="M17 4L20 4L20 7" />
    <path d="M7 20L4 20L4 17" />
    <path d="M17 20L20 20L20 17" />
  </svg>
);

export const HorizontalLineIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M3 12h18" />
    <circle cx="7" cy="12" r="1.5" fill="currentColor" />
    <circle cx="17" cy="12" r="1.5" fill="currentColor" />
  </svg>
);

export const TrendLineIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M4 20L20 4" />
    <circle cx="7" cy="17" r="1.5" fill="currentColor" />
    <circle cx="17" cy="7" r="1.5" fill="currentColor" />
  </svg>
);

export const FibonacciIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M4 20L20 4" />
    <path d="M4 4h16" strokeOpacity="0.5" />
    <path d="M4 8h16" strokeOpacity="0.6" />
    <path d="M4 12h16" strokeOpacity="0.7" />
    <path d="M4 16h16" strokeOpacity="0.8" />
    <path d="M4 20h16" strokeOpacity="0.9" />
    <circle cx="7" cy="17" r="1.5" fill="currentColor" />
    <circle cx="17" cy="7" r="1.5" fill="currentColor" />
  </svg>
);
