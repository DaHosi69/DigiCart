// src/home/common/Lists/components/ListCard.tsx
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Database } from "@/shared/classes/database.types";
import { CalendarDays, ListChecks } from "lucide-react";

type ShoppingList = Database["public"]["Tables"]["shopping_lists"]["Row"];

type Props = {
  list: ShoppingList;
  selected?: boolean;
  onClick?: () => void;
};

export default function ListCard({ list, selected, onClick }: Props) {
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
          selected && "ring-2 ring-primary border-primary/60"
        )}
      >
        <CardContent className="p-3 sm:p-4">
          <div className="flex items-start gap-3">
            <div className={cn(
              "rounded-xl p-2 shrink-0",
              selected ? "bg-primary/15" : "bg-muted"
            )}>
              <ListChecks className={cn("h-5 w-5", selected && "text-primary")} />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate font-semibold">{list.name}</p>
                {!list.is_active && (
                  <Badge variant="secondary" className="shrink-0">Abgeschlossen</Badge>
                )}
              </div>

              <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                <CalendarDays className="h-3.5 w-3.5" />
                <span title={list.created_at ?? ""}>
                  {list.created_at ? new Date(list.created_at).toLocaleDateString() : "—"}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </button>
  );
}
