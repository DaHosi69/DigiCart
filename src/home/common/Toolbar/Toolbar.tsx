import { Switch } from "@/components/ui/switch";
import { useTheme } from "@/contexts/ThemeContext";
import { Sun, Moon } from "lucide-react";

export default function Toolbar() {
  const { dark, toggleDark } = useTheme();
  return (
    <div className="mb-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold">Einkauf</h1>
        </div>
        <div className="flex items-center gap-2">
          {/* <Button variant="ghost" size="icon">
            <Settings className="h-6 w-6" />
          </Button> */}
          <Sun className="h-5 w-5" />
          <Switch checked={dark} onCheckedChange={toggleDark} />
          <Moon className="h-5 w-5" />
        </div>
      </div>
      <label className="text-sm opacity-70">
        Wähle eine Einkaufsliste aus zu der du Bestellungen hinzufügen willst.
      </label>
    </div>
  );
}
