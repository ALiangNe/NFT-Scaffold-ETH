

"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { MoonIcon, SunIcon } from "@heroicons/react/24/outline";

export const SwitchTheme = ({ className }: { className?: string }) => {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  const isDarkMode = resolvedTheme === "dark";

  const handleToggle = () => {
    if (isDarkMode) {
      setTheme("light");
      return;
    }
    setTheme("dark");
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className={`flex space-x-2 h-8 items-center justify-center text-sm ${className}`}>
      <input
        id="theme-toggle"
        type="checkbox"
        className="toggle toggle-lg toggle-primary bg-gradient-to-r from-purple-500 to-pink-500 border-transparent hover:opacity-90 transition-opacity"
        onChange={handleToggle}
        checked={isDarkMode}
      />
      <label 
        htmlFor="theme-toggle" 
        className={`swap swap-rotate transform hover:scale-110 transition-transform duration-300 ${!isDarkMode ? "swap-active" : ""}`}
      >
        <SunIcon className="swap-on h-5 w-5 text-yellow-500" />
        <MoonIcon className="swap-off h-5 w-5 text-purple-500" />
      </label>
    </div>
  );
};

