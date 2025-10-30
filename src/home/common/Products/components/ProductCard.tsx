import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Tag, Euro, MoreVertical, Trash2, Edit } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/AuthProvider";
import type { Database } from "@/shared/classes/database.types";

type Product = Database["public"]["Tables"]["products"]["Row"];
type Category = Database["public"]["Tables"]["categories"]["Row"];

export function ProductCard({
  product,
 categories,
  onMenu,
  onDelete,
  className,
}: {
  product: Product;
  categories: Category[];
  onMenu?: () => void;              
  onDelete?: (id: string) => void;  
  className?: string;
}) {
  const { isAdmin } = useAuth();
  const categoryName =
    categories.find((c) => c.id === product.category_id)?.name ?? "Unbekannt";

  return (
    <Card className={cn("group transition hover:shadow-md", className)}>
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4 opacity-80" />
              <p className="truncate text-sm font-semibold sm:text-base">{product.name}</p>
              <Badge variant="secondary" className="ml-1">{categoryName}</Badge>
            </div>
            <p className="mt-1 text-xs text-muted-foreground inline-flex items-center gap-1">
              <Euro className="h-4 w-4" /> {Number(product.price ?? 0).toFixed(2)} {product.currency_code ?? "EUR"}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-1">
            {isAdmin && (
              <>
                <Button
                  variant="ghost" size="icon"
                  onClick={(e) => { e.stopPropagation(); onDelete?.(product.id); }}
                  className="text-red-500 hover:text-red-600"
                  aria-label="Löschen"
                >
                  <Trash2 className="h-5 w-5" />
                </Button>
                <Button
                  variant="ghost" size="icon"
                  onClick={(e) => { e.stopPropagation(); onMenu?.(); }}
                  aria-label="Bearbeiten"
                >
                  <Edit className="h-5 w-5" />
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <CalendarDays className="h-4 w-4" /> {new Date(product.created_at!).toLocaleDateString()}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
