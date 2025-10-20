// src/home/common/Toolbar/ListDetail.tsx
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useAuth } from "@/providers/AuthProvider";

type ViewRow = {
  list_item_id: string;
  list_id: string;
  product_id: string;
  quantity: number | null;
  note: string | null;
  added_at: string | null;
  product_name: string;
  category_id: number;
  category_name: string;
  ordered_by_name: string | null;
};

export default function ListDetail({ listId }: { listId: string }) {
  const [rows, setRows] = useState<ViewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const { isAdmin } = useAuth();

  // Daten laden aus der View v_list_items_with_order
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setErr(null);
      const { data, error } = await supabase
        .from("v_list_items_with_order")
        .select("*")
        .eq("list_id", listId)
        .order("added_at", { ascending: false });

      if (!mounted) return;
      if (error) setErr(error.message);
      setRows((data as ViewRow[]) ?? []);
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, [listId]);

  // Nach Kategorie gruppieren
  const byCategory = useMemo(() => {
    const map = new Map<string, ViewRow[]>();
    for (const r of rows) {
      const key = r.category_name ?? "Sonstiges";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(r);
    }
    // In jeder Kategorie optional nach added_at absteigend sortieren
    for (const [, arr] of map) {
      arr.sort((a, b) => {
        const ta = a.added_at ? Date.parse(a.added_at) : 0;
        const tb = b.added_at ? Date.parse(b.added_at) : 0;
        return tb - ta;
      });
    }
    // alphabetisch nach Kategorie
    return Array.from(map.entries()).sort((a, b) =>
      a[0].localeCompare(b[0], undefined, { sensitivity: "base" })
    );
  }, [rows]);

  const onDelete = async (listItemId: string) => {
    if (!isAdmin) return;
    if (!confirm("Willst du dieses Produkt wirklich löschen?")) return;
    const { error } = await supabase.from("list_items").delete().eq("id", listItemId);
    if (error) {
      alert(error.message);
      return;
    }
    setRows((prev) => prev.filter((r) => r.list_item_id !== listItemId));
  };

  if (loading) return <div className="text-sm text-muted-foreground">Lade Listeneinträge…</div>;
  if (err) return <div className="text-sm text-red-600">{err}</div>;

  if (rows.length === 0) {
    return <div className="text-sm text-muted-foreground">Noch keine Produkte in dieser Liste.</div>;
  }

  return (
    <div className="space-y-6">
      {byCategory.map(([category, items]) => (
        <div key={category} className="space-y-2">
          <div className="text-xs font-semibold uppercase tracking-wide opacity-70">
            {category}
          </div>

          {items.map((it) => (
            <div
              key={it.list_item_id}
              className="flex items-center gap-3 rounded-md p-2 border"
            >
              <div className="truncate">{it.product_name}</div>

              <div className="text-xs opacity-70">
                x {it.quantity ?? 1}
              </div>

              <div className="ml-auto text-xs opacity-70">
                {it.ordered_by_name?.trim() || "—"}
              </div>

              {isAdmin && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-red-500 hover:text-red-600"
                  onClick={(e) => {
                    e.stopPropagation();
                    void onDelete(it.list_item_id);
                  }}
                  aria-label="Löschen"
                  title="List-Item löschen"
                >
                  <Trash2 className="h-5 w-5" />
                </Button>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
