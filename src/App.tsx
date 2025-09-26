import { ThemeProvider } from "./contexts/ThemeContext";
import Login from "./login/Login";

function App() {
  return (
    <ThemeProvider>
      <div className="min-h-screen bg-gray-100 text-black dark:bg-gray-900 dark:text-white items-center justify-center">
        <Login />
      </div>
    </ThemeProvider>
  );
}

export default App;
