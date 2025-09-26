import { useTheme } from "@/contexts/ThemeContext";


export default function DarkModeButton() {
  const { dark, toggleDark } = useTheme();

  return (
    <button
      onClick={toggleDark}
      className="px-4 py-2 rounded bg-blue-500 text-white hover:bg-blue-600"
    >
      {dark ? "Light Mode" : "Dark Mode"}
    </button>
  );
}
