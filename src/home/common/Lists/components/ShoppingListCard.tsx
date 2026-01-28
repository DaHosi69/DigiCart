import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  CalendarDays,
  User,
  Dot,
  CheckCircle2,
  Archive,
  ChevronRight,
  Trash2,
  Edit,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/AuthProvider";

export type ShoppingList = {
  id: string;
  name: string;
  is_active: boolean;
  notes?: string | null;
  managed_by_profile_id?: string | null;
  created_at: string;
};

function formatDate(d: string) {
  try {
    const date = new Date(d);
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "2-digit",
    });
  } catch {
    return d;
  }
}

export function ShoppingListCard({
  list,
  onClick,
  onMenu,
  onDelete,
  onOpen,
  onToggle,
  className,
}: {
  list: ShoppingList;
  onClick?: () => void;
  onMenu?: () => void;
  onDelete?: (id: string) => void;
  onOpen?: () => void;
  onToggle?: () => void;
  className?: string;
}) {
  const { isAdmin } = useAuth();

  return (
    <Card
      className={cn(
        "group cursor-pointer transition hover:shadow-md",
        !list.is_active && "opacity-90",
        className,
      )}
      onClick={onClick}
      role="button"
      aria-label={`Einkaufsliste ${list.name}`}
    >
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              {list.is_active ? (
                <CheckCircle2 className="h-4 w-4 text-green-600" aria-hidden />
              ) : (
                <Archive className="h-4 w-4 opacity-70" aria-hidden />
              )}
              <p className="truncate text-sm font-semibold sm:text-base">
                {list.name}
              </p>
            </div>
            {list.notes ? (
              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                {list.notes}
              </p>
            ) : null}
          </div>

          <div className="flex shrink-0 items-center gap-1">
            {isAdmin && (
              <Button
                variant="ghost"
                size="icon"
                className="text-red-500 hover:text-red-600"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete?.(list.id);
                }}
                aria-label="Löschen"
              >
                <Trash2 className="h-5 w-5" />
              </Button>
            )}

            <Button
              variant="ghost"
              size="icon"
              className="-mr-1"
              onClick={(e) => {
                e.stopPropagation();
                onMenu?.();
              }}
              aria-label="Bearbeiten"
            >
              <Edit className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <CalendarDays className="h-4 w-4" /> {formatDate(list.created_at)}
          </span>
          <Dot className="h-4 w-4" />
          <span className="inline-flex items-center gap-1">
            <User className="h-4 w-4" />{" "}
            {list.managed_by_profile_id
              ? list.managed_by_profile_id.slice(0, 8) + "…"
              : "Unbekannt"}
          </span>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div
            className="flex items-center gap-2"
            onClick={(e) => e.stopPropagation()}
          >
            <Switch
              id={`switch-${list.id}`}
              checked={list.is_active}
              onCheckedChange={() => onToggle?.()}
              disabled={!isAdmin}
            />
            <Label
              htmlFor={`switch-${list.id}`}
              className="text-xs text-muted-foreground cursor-pointer"
            >
              {list.is_active ? "Aktiv" : "Inaktiv"}
            </Label>
          </div>

          {list.is_active && (
            <Button
              variant="outline"
              size="sm"
              className="group-hover:border-primary"
              onClick={(e) => {
                e.stopPropagation();
                onOpen?.();
              }}
            >
              Öffnen
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
