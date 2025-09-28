import { ChevronRight, Trash } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type Product = {
  id: string;
  name: string;
  subtitle?: string;        
  pricePrimary: string;     
  priceSecondary?: string;   
  category?: string;         
};

type ProductsCardProps = {
  title?: string;
  products: Product[];
  onOpen?: (id: string) => void;
  onDelete?: (id: string) => void;
};

export default function ProductsCard({
  title = "Produkte",
  products,
  onOpen,
  onDelete,
}: ProductsCardProps) {
  return (
    <Card className="rounded-2xl shadow-sm">
      <CardHeader>
        <CardTitle className="text-2xl">{title}</CardTitle>
      </CardHeader>

      <CardContent className="p-0">
        <div className="divide-y">
          {products.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between gap-3 px-5 py-5"
            >
              {/* Linke Seite: Titel + Untertitel + Preise */}
              <div className="min-w-0">
                <div
                  className="font-semibold text-lg text-foreground hover:underline cursor-pointer"
                  onClick={() => onOpen?.(p.id)}
                >
                  {p.name}
                </div>
                {p.subtitle && (
                  <div className="text-sm text-muted-foreground">
                    {p.subtitle}
                  </div>
                )}
                <div className="mt-2 font-semibold">
                  {p.pricePrimary}
                  {p.priceSecondary && (
                    <span className="text-muted-foreground font-normal">
                      {" "}{p.priceSecondary}
                    </span>
                  )}
                </div>
              </div>

              {/* Rechte Seite: Badge + Actions */}
              <div className="flex items-center gap-3 shrink-0">
                {p.category && (
                  <Badge
                    variant="secondary"
                    className="rounded-full px-3 py-1 text-sm"
                  >
                    {p.category}
                  </Badge>
                )}

                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Details"
                  onClick={() => onOpen?.(p.id)}
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Löschen"
                  className="text-destructive"
                  onClick={() => onDelete?.(p.id)}
                >
                  <Trash className="h-5 w-5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
