"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="w-8 h-8 rounded-full" />;
  }

  const isDark = theme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="p-2 rounded-full hover:bg-[var(--accent-soft)] transition-colors duration-200 text-[var(--ink)]"
      title={`Switch to ${isDark ? "light" : "dark"} theme`}
      aria-label="Toggle theme"
    >
      {isDark ? <Sun className="w-4 h-4 text-[var(--amber)]" /> : <Moon className="w-4 h-4 text-[var(--slate)]" />}
    </button>
  );
}
