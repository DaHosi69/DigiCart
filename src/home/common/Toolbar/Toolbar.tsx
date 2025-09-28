import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useTheme } from "@/contexts/ThemeContext";
import { Settings, Sun, Moon } from "lucide-react";

export default function Toolbar() {
  const { dark, toggleDark } = useTheme();
  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold">Einkauf</h1>
          <Badge variant="secondary">Liste: Wocheneinkauf</Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon">
            <Settings className="h-6 w-6" />
          </Button>
          <Sun className="h-5 w-5" />
          <Switch
            checked={dark} 
            onCheckedChange={toggleDark}
          />
          <Moon className="h-5 w-5" />
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <div className="relative flex-1">
          <Input placeholder="Suchen oder hinzufügen…" className="pl-9" />
          <div className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        </div>
        <div />
      </div>
    </>
  );
}
