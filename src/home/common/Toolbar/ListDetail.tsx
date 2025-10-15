import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { Database } from "@/shared/classes/database.types";
import { useAuth } from "@/providers/AuthProvider";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

type Tables = Database["public"]["Tables"];
type ListItem = Tables["list_items"]["Row"];
type Product = Tables["products"]["Row"];
type Order = Tables["orders"]["Row"];

export default function ListDetail({ listId }: { listId: string }) {
  const [items, setItems] = useState<(ListItem & { product: Pick<Product, "name" | "unit"> })[]>([]);
  const [orderName, setOrderName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const {isAdmin} = useAuth();

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);

      const [liRes, ordRes] = await Promise.all([
        supabase
          .from("list_items")
          .select("id, quantity, note, added_at, product:products(name,unit)")
          .eq("list_id", listId)
          .order("added_at", { ascending: false }),
        // ganze Order (hier: offene; sonst jüngste per created_at)
        supabase
          .from("orders")
          .select("id, ordered_by_name, status, created_at")
          .eq("list_id", listId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle<Order>(),
      ]);

      if (!active) return;

      if (liRes.error) setItems([]);
      else setItems((liRes.data as any) ?? []);

      if (!ordRes.error && ordRes.data)
        setOrderName(ordRes.data.ordered_by_name ?? "");
      else setOrderName("");

      setLoading(false);
    })();

    return () => {
      active = false;
    };
  }, [listId]);

  if (loading)
    return <div className="text-sm text-muted-foreground">Lade Listeneinträge…</div>;

const onDelete = async (listItemId: string) => {
  if (!confirm("Willst du dieses Produkt wirklich löschen?")) return;

  try {
    // 1️⃣ list_item löschen
    const { error: liErr } = await supabase
      .from("list_items")
      .delete()
      .eq("id", listItemId);

    if (liErr) throw liErr;

    // 2️⃣ dazugehörige Order löschen (die neueste mit diesem list_id)
    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .select("id")
      .eq("list_id", listId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle<Order>();

    if (orderErr) throw orderErr;
    if (order) {
      const { error: delOrderErr } = await supabase
        .from("orders")
        .delete()
        .eq("id", order.id);
      if (delOrderErr) throw delOrderErr;
    }

    // 3️⃣ UI aktualisieren
    setItems((prev) => prev.filter((x) => x.id !== listItemId));
  } catch (e: any) {
    alert(`Fehler beim Löschen: ${e.message ?? e}`);
  }
};

  return (
    <div className="space-y-2">
      {items.map((it) => (
        <div key={it.id} className="flex items-center gap-3 rounded-md p-2">
          <div className="truncate">{it.product?.name ?? "Produkt"}</div>
          <div className="text-xs opacity-70">
            x {it.quantity ?? 1} {it.product?.unit ?? ""}
          </div>
          
          <div className="ml-auto text-xs opacity-70">
            {/* Bestellname aus orders */}
            {orderName || "—"}
          </div>
           {isAdmin && (
              <Button
                variant="ghost"
                size="icon"
                className="text-red-500 hover:text-red-600"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete?.(it.id); 
                }}
                aria-label="Löschen"
              >
                <Trash2 className="h-5 w-5" />
              </Button>
            )}
        </div>
      ))}
      {items.length === 0 && (
        <div className="text-sm text-muted-foreground">
          Noch keine Produkte in dieser Liste.
        </div>
      )}
    </div>
  );
}
