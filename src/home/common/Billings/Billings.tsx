import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { Database } from "@/shared/classes/database.types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

type Tables = Database["public"]["Tables"];
type ShoppingList = Tables["shopping_lists"]["Row"];
type Product = Tables["products"]["Row"];

// Zeilen aus der View (wie wir sie definiert haben)
type ViewRow = {
  list_item_id: string;
  list_id: string;
  product_id: string;
  quantity: number | string | null;     // numeric kommt oft als string → wir parsen
  note: string | null;
  added_at: string | null;
  product_name: string;
  category_id: number;
  category_name: string;
  ordered_by_name: string | null;
};

type PriceInfo = Pick<Product, "id" | "price" | "currency_code" | "unit">;
type PriceMap = Record<string, { price: number; currency: string }>;

export default function Billings() {
  const [lists, setLists] = useState<ShoppingList[]>([]);
  const [selectedList, setSelectedList] = useState<ShoppingList | null>(null);

  const [rows, setRows] = useState<ViewRow[]>([]);
  const [priceMap, setPriceMap] = useState<PriceMap>({});
  const [loading, setLoading] = useState(true);
  const [loadingRows, setLoadingRows] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Optional: Filter nach Namen in der Abrechnung
  const [nameFilter, setNameFilter] = useState("");

  // 1) Abgeschlossene Listen holen
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setErr(null);

      const { data, error } = await supabase
        .from("shopping_lists")
        .select("id,name,is_active,notes,managed_by_profile_id,created_at")
        .eq("is_active", false)
        .order("created_at", { ascending: false });

      if (!mounted) return;
      if (error) setErr(error.message);
      setLists((data as ShoppingList[]) ?? []);
      setSelectedList((data && data.length > 0 ? (data[0] as ShoppingList) : null) ?? null);
      setLoading(false);
    })();

    return () => {
      mounted = false;
    };
  }, []);

  // 2) Rows für ausgewählte Liste + Preise laden
  useEffect(() => {
    if (!selectedList) {
      setRows([]);
      setPriceMap({});
      return;
    }

    let mounted = true;
    (async () => {
      setLoadingRows(true);
      setErr(null);

      // a) alle list_items mit ordername aus View
      const { data: vrows, error: vErr } = await supabase
        .from("v_list_items_with_order")
        .select("*")
        .eq("list_id", selectedList.id)
        .order("added_at", { ascending: true });

      if (!mounted) return;

      if (vErr) {
        setErr(vErr.message);
        setRows([]);
        setPriceMap({});
        setLoadingRows(false);
        return;
      }

      const vr = (vrows as ViewRow[]) ?? [];
      setRows(vr);

      // b) Preise der referenzierten Produkte in einem Schwung holen
      const productIds = Array.from(new Set(vr.map(r => r.product_id)));
      if (productIds.length > 0) {
        const { data: prices, error: pErr } = await supabase
          .from("products")
          .select("id, price, currency_code")
          .in("id", productIds);

        if (pErr) {
          setErr(pErr.message);
          setPriceMap({});
          setLoadingRows(false);
          return;
        }

        const pm: PriceMap = {};
        (prices as PriceInfo[]).forEach(p => {
          pm[p.id] = {
            price: Number(p.price ?? 0),
            currency: p.currency_code ?? "EUR",
          };
        });
        setPriceMap(pm);
      } else {
        setPriceMap({});
      }

      setLoadingRows(false);
    })();

    return () => {
      mounted = false;
    };
  }, [selectedList?.id]);

  // 3) Aggregation: Summe pro ordered_by_name
  const totals = useMemo(() => {
    const map = new Map<
      string, // name
      { sum: number; count: number; currency: string }
    >();

    for (const r of rows) {
      const qty = Number(r.quantity ?? 1);
      const price = priceMap[r.product_id]?.price ?? 0;
      const currency = priceMap[r.product_id]?.currency ?? "EUR";
      const name = (r.ordered_by_name ?? "—").trim() || "—";
      const line = qty * price;

      if (!map.has(name)) map.set(name, { sum: 0, count: 0, currency });
      const acc = map.get(name)!;
      acc.sum += line;
      acc.count += 1;
      acc.currency = currency; // Annahme: gleiche Währung
    }

    // Filter (optional nach Name)
    const nf = nameFilter.trim().toLowerCase();
    const entries = Array.from(map.entries())
      .filter(([n]) => (nf ? n.toLowerCase().includes(nf) : true))
      .sort((a, b) => a[0].localeCompare(b[0], undefined, { sensitivity: "base" }));

    return entries;
  }, [rows, priceMap, nameFilter]);

  // 4) Detail-Liste (alle Items), optional gruppiert nach Kategorien
  const byCategory = useMemo(() => {
    const cat = new Map<
      string, // category_name
      ViewRow[]
    >();
    rows.forEach(r => {
      const key = r.category_name ?? "Sonstiges";
      if (!cat.has(key)) cat.set(key, []);
      cat.get(key)!.push(r);
    });
    return Array.from(cat.entries()).sort((a,b) => a[0].localeCompare(b[0]));
  }, [rows]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-4 lg:p-6">
        <div className="text-sm text-muted-foreground flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          Lade abgeschlossene Listen…
        </div>
      </div>
    );
  }

  if (err) {
    return (
      <div className="max-w-7xl mx-auto p-4 lg:p-6">
        <div className="text-sm text-red-600">{err}</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 lg:p-6">
      <div className="mb-3">
        <h1 className="text-2xl font-semibold">Abrechnungen</h1>
        <p className="text-sm text-muted-foreground">
          Wähle eine abgeschlossene Einkaufsliste und sieh die Summen je Bestellname (Zahler).
        </p>
      </div>

      {/* Listen-Auswahl */}
      <Card className="mb-4">
        <CardContent className="p-4">
          {lists.length === 0 ? (
            <div className="text-sm text-muted-foreground">Keine abgeschlossenen Listen.</div>
          ) : (
            <div className="flex gap-2 overflow-x-auto">
              {lists.map((l) => (
                <Button
                  key={l.id}
                  variant={selectedList?.id === l.id ? "default" : "secondary"}
                  onClick={() => setSelectedList(l)}
                  className="whitespace-nowrap"
                >
                  {l.name}
                </Button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summen + Details */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_420px] gap-4 lg:gap-6">
        {/* Summen pro Name */}
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">Summen je Bestellname</div>
              <div className="w-56">
                <Input
                  placeholder="Namen filtern…"
                  value={nameFilter}
                  onChange={(e) => setNameFilter(e.target.value)}
                />
              </div>
            </div>

            {loadingRows ? (
              <div className="text-sm text-muted-foreground flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Lade Abrechnung…
              </div>
            ) : totals.length === 0 ? (
              <div className="text-sm text-muted-foreground">Keine Daten.</div>
            ) : (
              <div className="divide-y rounded-md border">
                {totals.map(([name, t]) => (
                  <div key={name} className="flex items-center justify-between p-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{name}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {t.count} Posten
                      </span>
                    </div>
                    <div className="font-medium tabular-nums">
                      {t.sum.toFixed(2)} {t.currency}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Detailansicht je Kategorie */}
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="text-sm font-medium">Details (nach Kategorien)</div>

            {loadingRows ? (
              <div className="text-sm text-muted-foreground flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Lade Details…
              </div>
            ) : rows.length === 0 ? (
              <div className="text-sm text-muted-foreground">Keine Einträge.</div>
            ) : (
              <div className="space-y-5">
                {byCategory.map(([category, items]) => (
                  <div key={category} className="space-y-2">
                    <div className="text-xs font-semibold uppercase tracking-wide opacity-70">
                      {category}
                    </div>
                    <div className="rounded-md border divide-y max-h-64 overflow-y-auto">
                      {items.map((it) => {
                        const qty = Number(it.quantity ?? 1);
                        const price = priceMap[it.product_id]?.price ?? 0;
                        const curr = priceMap[it.product_id]?.currency ?? "EUR";
                        const line = qty * price;

                        return (
                          <div key={it.list_item_id} className="flex items-center gap-3 p-2">
                            <div className="truncate">{it.product_name}</div>
                            <div className="text-xs opacity-70">
                              x {qty}
                            </div>
                            <div className="ml-auto text-xs opacity-70">
                              {it.ordered_by_name?.trim() || "—"}
                            </div>
                            <div className="ml-3 text-sm tabular-nums">
                              {line.toFixed(2)} {curr}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
