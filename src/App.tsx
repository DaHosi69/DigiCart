import { useEffect, useState } from "react";
import "./App.css";
import Login from "./login/Login";

function App() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  return (
    <div className="min-h-screen bg-gray-100 text-black dark:bg-gray-900 dark:text-white  items-center justify-center">
      {/* Dark Mode Umschalter */}
      <button
        onClick={() => setDark(!dark)}
        className="px-4 py-2 rounded bg-blue-500 text-white hover:bg-blue-600"
      >
        {dark ? "Light Mode" : "Dark Mode"}
      </button>

      <Login />
    </div>
  );
}

export default App;
