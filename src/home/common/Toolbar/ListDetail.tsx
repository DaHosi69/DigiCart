// src/home/common/Toolbar/ListDetail.tsx
import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useAuth } from "@/providers/AuthProvider";
import { useSimpleToasts } from "@/hooks/useSimpleToasts";

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

type Props = { listId: string; refreshKey?: number };

export default function ListDetail({ listId, refreshKey = 0 }: Props) {
  const [rows, setRows] = useState<ViewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const { isAdmin } = useAuth();
  const toast = useSimpleToasts();

  // --- 1) Fetch als Callback (wird von Realtime getriggert) ---
  const fetchRows = useCallback(async () => {
    setLoading(true);
    setErr(null);
    const { data, error } = await supabase
      .from("v_list_items_with_order")
      .select("*")
      .eq("list_id", listId)
      .order("added_at", { ascending: false });

    if (error) setErr(error.message);
    setRows((data as ViewRow[]) ?? []);
    setLoading(false);
  }, [listId]);

  // --- 2) Initial/refreshKey Load ---
  useEffect(() => {
    void fetchRows();
  }, [fetchRows, refreshKey]);

  // --- 3) Realtime-Subscription + Debounce gegen Event-Flut ---
  const debounceRef = useRef<number | null>(null);
  const scheduleFetch = useCallback(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      debounceRef.current = null;
      void fetchRows();
    }, 150); // 150ms debounce
  }, [fetchRows]);

  useEffect(() => {
    const channel = supabase
      .channel(`list_items:${listId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "list_items",
          filter: `list_id=eq.${listId}`,
        },
        () => {
          // Bei INSERT/UPDATE/DELETE neu laden (debounced)
          scheduleFetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      if (debounceRef.current) {
        window.clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
    };
  }, [listId, scheduleFetch]);

  // --- Gruppierung nach Kategorie ---
  const byCategory = useMemo(() => {
    const map = new Map<string, ViewRow[]>();
    for (const r of rows) {
      const key = r.category_name ?? "Sonstiges";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(r);
    }
    for (const [, arr] of map) {
      arr.sort((a, b) => {
        const ta = a.added_at ? Date.parse(a.added_at) : 0;
        const tb = b.added_at ? Date.parse(b.added_at) : 0;
        return tb - ta;
      });
    }
    return Array.from(map.entries()).sort((a, b) =>
      a[0].localeCompare(b[0], undefined, { sensitivity: "base" })
    );
  }, [rows]);

  const onDelete = async (listItemId: string) => {
    if (!confirm("Willst du dieses Produkt wirklich löschen?")) return;
    const { error } = await supabase.from("list_items").delete().eq("id", listItemId);
    if (error) {
      alert(error.message);
      toast.error('Produkt konnte nicht aus der Liste entfernt werden');
      return;
    }
    // lokal optimistisch entfernen – Realtime refetcht zusätzlich
    setRows((prev) => prev.filter((r) => r.list_item_id !== listItemId));
    toast.success('Produkt wurde erfolgreich aus der Liste entfernt');
  };

  if (loading) return <div className="text-sm text-muted-foreground">Lade Listeneinträge…</div>;
  if (err) return <div className="text-sm text-red-600">{err}</div>;
  if (rows.length === 0) {
    return <div className="text-sm flex justify-center text-muted-foreground">Noch keine Produkte in dieser Liste.</div>;
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

              <div className="text-xs opacity-70">x {it.quantity ?? 1}</div>

              <div className="ml-auto text-xs opacity-70">
                {it.ordered_by_name?.trim() || "—"}
              </div>
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
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
