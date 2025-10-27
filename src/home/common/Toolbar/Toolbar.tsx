import { Switch } from "@/components/ui/switch";
import { useTheme } from "@/contexts/ThemeContext";
import { Sun, Moon, ShoppingCart } from "lucide-react";
import { act } from "react";

type Props = { activeListName: string };

export default function Toolbar({ activeListName }: Props) {
  const { dark, toggleDark } = useTheme();
  return (
    <div className="mb-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {activeListName ? (
            <>
              <h1 className="text-2xl font-semibold">
                Einkauf: {activeListName}
              </h1>
              <ShoppingCart className="h-4 w-4 opacity-70" />
            </>
          ) : (
            <h1 className="text-2xl font-semibold">
              Keine Einkaufsliste ausgewählt
            </h1>
          )}
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
    </div>
  );
}
