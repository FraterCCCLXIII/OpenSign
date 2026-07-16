import { useEffect, useState } from "react";

const ThemeToggle = () => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const storedTheme = localStorage.getItem("theme");
    if (storedTheme === "dark") {
      setIsDark(true);
      document.documentElement.setAttribute("data-theme", "opensigndark");
    } else {
      document.documentElement.setAttribute("data-theme", "opensigncss");
    }
  }, []);

  const handleChange = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    if (newTheme) {
      document.documentElement.setAttribute("data-theme", "opensigndark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.setAttribute("data-theme", "opensigncss");
      localStorage.setItem("theme", "light");
    }
  };

  return (
    <button
      id="dark-mode-toggle"
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label="Toggle dark mode"
      onClick={(e) => {
        e.stopPropagation();
        handleChange();
      }}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-base-100 ${
        isDark
          ? "bg-primary border-primary"
          : "bg-base-300 border-base-300"
      }`}
    >
      <span
        className={`pointer-events-none block h-4 w-4 rounded-full bg-base-100 shadow-sm ring-0 transition-transform ${
          isDark ? "translate-x-[1.125rem]" : "translate-x-0.5"
        }`}
      />
    </button>
  );
};

export default ThemeToggle;
