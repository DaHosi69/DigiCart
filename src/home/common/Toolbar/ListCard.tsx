// src/home/common/Lists/components/ListCard.tsx
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Database } from "@/shared/classes/database.types";
import { CalendarDays, ListChecks, ShoppingCart } from "lucide-react";

type ShoppingList = Database["public"]["Tables"]["shopping_lists"]["Row"];

type Props = {
  list: ShoppingList;
  selected?: boolean;
  onClick?: () => void;
  orderCount?: number;
};

export default function ListCard({
  list,
  selected,
  onClick,
  orderCount,
}: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-left"
      aria-pressed={selected}
    >
      <Card
        className={cn(
          "transition-all border hover:shadow-md rounded-xl",
          "hover:border-primary/40 hover:-translate-y-[1px]",
          selected && "ring-2 ring-primary border-primary/60",
        )}
      >
        <CardContent className="p-3">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "rounded-xl p-2 shrink-0",
                selected ? "bg-primary/15" : "bg-muted",
              )}
            >
              <ListChecks
                className={cn("h-5 w-5", selected && "text-primary")}
              />
            </div>

            <div className="flex-1 min-w-0 flex flex-col justify-center">
              <div className="flex items-center gap-2">
                <span className="truncate font-semibold">{list.name}</span>
                {!list.is_active && (
                  <Badge
                    variant="secondary"
                    className="shrink-0 text-[10px] h-5 px-1.5"
                  >
                    Abgeschlossen
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <div
                className={cn(
                  "flex items-center gap-1.5 text-xs px-2 py-1 rounded-md transition-colors",
                  selected
                    ? "bg-primary/10 text-primary font-medium"
                    : "bg-muted text-muted-foreground",
                )}
              >
                <ShoppingCart className="h-3.5 w-3.5" />
                <span>{orderCount ?? 0}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </button>
  );
}
