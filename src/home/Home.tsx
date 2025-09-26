import { ThemeProvider } from "@/contexts/ThemeContext";
import DarkModeButton from "@/shared/components/DarkModeButton";

export default function Home() {
  return (
    <ThemeProvider>
      <div
        className="flex min-h-screen items-center justify-center transition-colors duration-500 ease-in-out g-gray-50 dark:bg-gray-900 dark:text-gray-100"
      >
        <h1 className="text-4xl font-bold">Welcome to the Home Page</h1>
        <DarkModeButton />
      </div>
    </ThemeProvider>
  );
}
