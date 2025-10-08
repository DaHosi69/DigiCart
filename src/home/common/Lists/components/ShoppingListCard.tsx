import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CalendarDays,
  User,
  MoreVertical,
  Dot,
  CheckCircle2,
  Archive,
  ChevronRight,
  Trash2,
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
  onDelete, // 👈 neue Prop
  className,
}: {
  list: ShoppingList;
  onClick?: () => void;
  onMenu?: () => void;
  onDelete?: (id: string) => void; // 👈 Callback für Delete
  className?: string;
}) {
  const { isAdmin } = useAuth();

  return (
    <Card
      className={cn(
        "group cursor-pointer transition hover:shadow-md",
        !list.is_active && "opacity-90",
        className
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
            <Badge
              variant={list.is_active ? "secondary" : "outline"}
              className="hidden sm:inline-flex"
            >
              {list.is_active ? "Aktiv" : "Archiviert"}
            </Badge>

            {isAdmin && (
              <Button
                variant="ghost"
                size="icon"
                className="text-red-500 hover:text-red-600"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete?.(list.id); // 👈 ruft Delete auf
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
              aria-label="Menü"
            >
              <MoreVertical className="h-5 w-5" />
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

        <div className="mt-3 flex items-center justify-end">
          <Button
            variant="outline"
            size="sm"
            className="group-hover:border-primary"
          >
            Öffnen
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
