"use client";

import { MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";

// import { Button } from "@/components/ui/button";

import { useEffect, useState } from "react";
import { Button } from "@repo/ui/button";

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const [domLoaded, setDomLoaded] = useState(false);

  useEffect(() => {
    setDomLoaded(true);
  }, []);
  if (!domLoaded) return null;
  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="p-2"
      aria-label="Toggle theme"
      //   variant="default"
    >
      {theme === "dark" ? (
        <SunIcon className="w-5 h-5 text-yellow-500" />
      ) : (
        <MoonIcon className="w-5 h-5 text-gray-800" />
      )}
    </button>
  );
}
