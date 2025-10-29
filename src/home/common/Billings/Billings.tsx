// src/home/common/Billings/Billings.tsx
import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { Database } from "@/shared/classes/database.types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type Tables = Database["public"]["Tables"];
type ShoppingList = Tables["shopping_lists"]["Row"];
type Product = Tables["products"]["Row"];

type ViewRow = {
  list_item_id: string;
  list_id: string;
  product_id: string;
  quantity: number | string | null;
  note: string | null;
  added_at: string | null;
  product_name: string;
  category_id: number;
  category_name: string;
  ordered_by_name: string | null;
};

type PriceInfo = Pick<Product, "id" | "price" | "currency_code">;
type PriceMap = Record<string, { price: number; currency: string }>;

type BillingFlag = {
  id: string;
  list_id: string;
  payer_name: string;
  is_paid: boolean;
  updated_at?: string | null;
};

export default function Billings() {
  const [lists, setLists] = useState<ShoppingList[]>([]);
  const [selectedList, setSelectedList] = useState<ShoppingList | null>(null);

  const [rows, setRows] = useState<ViewRow[]>([]);
  const [priceMap, setPriceMap] = useState<PriceMap>({});
  const [loading, setLoading] = useState(true);
  const [loadingRows, setLoadingRows] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [nameFilter, setNameFilter] = useState("");
  const [paidMap, setPaidMap] = useState<Record<string, boolean>>({});
  const [toggling, setToggling] = useState<Record<string, boolean>>({});

  // Für gezielte Product-Reloads
  const productIdSetRef = useRef<Set<string>>(new Set());

  // --- Debounce Timer Refs ---
  const listsDebounceRef = useRef<number | null>(null);
  const itemsDebounceRef = useRef<number | null>(null);
  const flagsDebounceRef = useRef<number | null>(null);
  const prodsDebounceRef = useRef<number | null>(null);

  // --- Loader ---
  const loadLists = useCallback(async () => {
    setLoading(true);
    setErr(null);

    const { data, error } = await supabase
      .from("shopping_lists")
      .select("id,name,is_active,notes,managed_by_profile_id,created_at")
      .eq("is_active", false)
      .order("created_at", { ascending: false });

    if (error) setErr(error.message);

    const ls = (data as ShoppingList[]) ?? [];
    setLists(ls);
    setSelectedList(ls[0] ?? null);
    setLoading(false);
  }, []);

  const loadRowsAndFlags = useCallback(async (listId: string) => {
    setLoadingRows(true);
    setErr(null);

    // a) Items der Liste
    const { data: vrows, error: vErr } = await supabase
      .from("v_list_items_with_order")
      .select("*")
      .eq("list_id", listId)
      .order("added_at", { ascending: true });

    if (vErr) {
      setErr(vErr.message);
      setRows([]);
      setPriceMap({});
      setPaidMap({});
      setLoadingRows(false);
      return;
    }

    const vr = (vrows as ViewRow[]) ?? [];
    setRows(vr);

    // b) Preise der referenzierten Produkte
    const productIds = Array.from(new Set(vr.map((r) => r.product_id)));
    productIdSetRef.current = new Set(productIds);

    if (productIds.length > 0) {
      const { data: prices, error: pErr } = await supabase
        .from("products")
        .select("id, price, currency_code")
        .in("id", productIds);

      if (pErr) {
        setErr(pErr.message);
        setPriceMap({});
      } else {
        const pm: PriceMap = {};
        (prices as PriceInfo[]).forEach((p) => {
          pm[p.id] = {
            price: Number(p.price ?? 0),
            currency: p.currency_code ?? "EUR",
          };
        });
        setPriceMap(pm);
      }
    } else {
      setPriceMap({});
    }

    // c) Flags
    const { data: flags, error: fErr } = await supabase
      .from("billing_flags")
      .select("payer_name,is_paid")
      .eq("list_id", listId);

    if (!fErr) {
      const map: Record<string, boolean> = {};
      (flags as Pick<BillingFlag, "payer_name" | "is_paid">[]).forEach((f) => {
        map[(f.payer_name ?? "").trim() || "—"] = !!f.is_paid;
      });
      setPaidMap(map);
    }

    setLoadingRows(false);
  }, []);

  // --- Debounced Scheduler (wie in deinem Snippet) ---
  const scheduleListsReload = useCallback(() => {
    if (listsDebounceRef.current) {
      window.clearTimeout(listsDebounceRef.current);
      listsDebounceRef.current = null;
    }
    listsDebounceRef.current = window.setTimeout(() => {
      loadLists();
    }, 250);
  }, [loadLists]);

  const scheduleRowsReload = useCallback(
    (listId: string) => {
      if (itemsDebounceRef.current) {
        window.clearTimeout(itemsDebounceRef.current);
        itemsDebounceRef.current = null;
      }
      itemsDebounceRef.current = window.setTimeout(() => {
        loadRowsAndFlags(listId);
      }, 200);
    },
    [loadRowsAndFlags]
  );

  const scheduleFlagsReload = useCallback(
    (listId: string) => {
      if (flagsDebounceRef.current) {
        window.clearTimeout(flagsDebounceRef.current);
        flagsDebounceRef.current = null;
      }
      flagsDebounceRef.current = window.setTimeout(() => {
        loadRowsAndFlags(listId);
      }, 150);
    },
    [loadRowsAndFlags]
  );

  const scheduleProductsReload = useCallback(
    (listId?: string, productId?: string) => {
      // Nur reloaden, wenn Produkt in der aktuellen Liste vorkommt (falls productId bekannt)
      if (productId && !productIdSetRef.current.has(productId)) return;

      if (prodsDebounceRef.current) {
        window.clearTimeout(prodsDebounceRef.current);
        prodsDebounceRef.current = null;
      }
      prodsDebounceRef.current = window.setTimeout(() => {
        if (listId) loadRowsAndFlags(listId);
      }, 250);
    },
    [loadRowsAndFlags]
  );

  // --- Initial + Realtime Listen (abgeschlossene) ---
  useEffect(() => {
    loadLists();

    const chLists = supabase
      .channel("shopping_lists:closed")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "shopping_lists" },
        () => scheduleListsReload()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(chLists);
      if (listsDebounceRef.current) {
        window.clearTimeout(listsDebounceRef.current);
        listsDebounceRef.current = null;
      }
    };
  }, [loadLists, scheduleListsReload]);

  // --- Rows/Flags laden bei Listenwechsel ---
  useEffect(() => {
    if (!selectedList) {
      setRows([]);
      setPriceMap({});
      setPaidMap({});
      return;
    }
    loadRowsAndFlags(selectedList.id);
  }, [selectedList?.id, loadRowsAndFlags]);

  // --- Realtime billing_flags (debounced) ---
  useEffect(() => {
    if (!selectedList) return;
    const listId = selectedList.id;

    const chFlags = supabase
      .channel(`billing_flags:${listId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "billing_flags",
          filter: `list_id=eq.${listId}`,
        },
        (payload) => {
          // Optimistisch: sofort kleines Patch im State (optional),
          // sicherer: neu laden – hier debounced:
          scheduleFlagsReload(listId);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(chFlags);
      if (flagsDebounceRef.current) {
        window.clearTimeout(flagsDebounceRef.current);
        flagsDebounceRef.current = null;
      }
    };
  }, [selectedList?.id, scheduleFlagsReload]);

  // --- Realtime list_items (debounced) ---
  useEffect(() => {
    if (!selectedList) return;
    const listId = selectedList.id;

    const chItems = supabase
      .channel(`list_items:${listId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "list_items",
          filter: `list_id=eq.${listId}`,
        },
        () => scheduleRowsReload(listId)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(chItems);
      if (itemsDebounceRef.current) {
        window.clearTimeout(itemsDebounceRef.current);
        itemsDebounceRef.current = null;
      }
    };
  }, [selectedList?.id, scheduleRowsReload]);

  // --- Realtime products (debounced, nur relevante Produkte) ---
  useEffect(() => {
    if (!selectedList) return;
    const listId = selectedList.id;

    const chProducts = supabase
      .channel(`products:any:${listId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "products" },
        (payload) => {
          const pid = (payload.new as Product)?.id;
          scheduleProductsReload(listId, pid);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(chProducts);
      if (prodsDebounceRef.current) {
        window.clearTimeout(prodsDebounceRef.current);
        prodsDebounceRef.current = null;
      }
    };
  }, [selectedList?.id, scheduleProductsReload]);

  // --- Aggregationen ---
  const totals = useMemo(() => {
    const map = new Map<string, { sum: number; count: number; currency: string }>();
    for (const r of rows) {
      // Kategorie "extra" nicht abrechnen:
      if (r.category_name?.toLowerCase() === "extra") continue;

      const qty = Number(r.quantity ?? 1);
      const price = priceMap[r.product_id]?.price ?? 0;
      const currency = priceMap[r.product_id]?.currency ?? "EUR";
      const name = (r.ordered_by_name ?? "—").trim() || "—";
      const line = qty * price;

      if (!map.has(name)) map.set(name, { sum: 0, count: 0, currency });
      const acc = map.get(name)!;
      acc.sum += line;
      acc.count += 1;
      acc.currency = currency;
    }

    const nf = nameFilter.trim().toLowerCase();
    return Array.from(map.entries())
      .filter(([n]) => (nf ? n.toLowerCase().includes(nf) : true))
      .sort((a, b) => a[0].localeCompare(b[0], undefined, { sensitivity: "base" }));
  }, [rows, priceMap, nameFilter]);

  const sumOverview = useMemo(() => {
    let total = 0;
    let paid = 0;
    let open = 0;
    let currency = "EUR";
    totals.forEach(([name, t]) => {
      total += t.sum;
      if (paidMap[name]) paid += t.sum;
      else open += t.sum;
      currency = t.currency || currency;
    });
    return { total, paid, open, currency };
  }, [totals, paidMap]);

  const byCategory = useMemo(() => {
    const cat = new Map<string, ViewRow[]>();
    rows.forEach((r) => {
      const key = r.category_name ?? "Sonstiges";
      if (!cat.has(key)) cat.set(key, []);
      cat.get(key)!.push(r);
    });
    return Array.from(cat.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [rows]);

  // Toggle bezahlt/offen
  const togglePaid = async (payerName: string) => {
    if (!selectedList) return;
    const key = payerName.trim() || "—";
    setToggling((p) => ({ ...p, [key]: true }));

    try {
      const current = !!paidMap[key];
      const next = !current;

      const { data, error } = await supabase
        .from("billing_flags")
        .upsert(
          { list_id: selectedList.id, payer_name: key, is_paid: next },
          { onConflict: "list_id,payer_name" }
        )
        .select()
        .single();

      if (error) throw error;

      // Optimistisches Update – Realtime bestätigt danach
      if (data) setPaidMap((m) => ({ ...m, [key]: next }));
    } catch (e: any) {
      alert(e?.message ?? "Fehler beim Aktualisieren des Zahlungsstatus");
    } finally {
      setToggling((p) => ({ ...p, [key]: false }));
    }
  };

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
          Wähle eine abgeschlossene Einkaufsliste und sieh die Summen je Bestellname (Zahler). Markiere Einträge als bezahlt.
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

      {/* 💰 Gesamt-Summen */}
      <Card className="mb-4">
        <CardContent className="p-4">
          {loadingRows ? (
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Berechne Summen…
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-md border p-3">
                <div className="text-xs uppercase tracking-wide opacity-70">Gesamt</div>
                <div className="mt-1 text-xl font-semibold tabular-nums">
                  {sumOverview.total.toFixed(2)} {sumOverview.currency}
                </div>
              </div>
              <div className="rounded-md border p-3 bg-emerald-50 dark:bg-emerald-950/20">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <div className="text-xs uppercase tracking-wide text-emerald-700 dark:text-emerald-300">Bezahlt</div>
                </div>
                <div className="mt-1 text-lg font-medium tabular-nums text-emerald-700 dark:text-emerald-300">
                  {sumOverview.paid.toFixed(2)} {sumOverview.currency}
                </div>
              </div>
              <div className="rounded-md border p-3 bg-rose-50/60 dark:bg-rose-950/20">
                <div className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                  <div className="text-xs uppercase tracking-wide text-rose-700 dark:text-rose-300">Offen</div>
                </div>
                <div className="mt-1 text-lg font-medium tabular-nums text-rose-700 dark:text-rose-300">
                  {sumOverview.open.toFixed(2)} {sumOverview.currency}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summen + Details */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_420px] gap-4 lg:gap-6">
        {/* Summen pro Name */}
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between gap-3">
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
              <div className="rounded-md border overflow-hidden">
                {totals.map(([name, t]) => {
                  const paid = !!paidMap[name];
                  const isBusy = !!toggling[name];
                  return (
                    <div
                      key={name}
                      className={cn(
                        "flex items-center justify-between p-3 gap-3",
                        "border-b last:border-b-0 transition-colors",
                        paid ? "bg-emerald-50 dark:bg-emerald-950/30" : "bg-rose-50/40 dark:bg-rose-950/20"
                      )}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Badge variant="secondary" className="truncate">{name}</Badge>
                        <span className="hidden md:block text-xs text-muted-foreground whitespace-nowrap">
                          {t.count} Produkte
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className={cn("font-medium tabular-nums", paid ? "text-emerald-700 dark:text-emerald-300" : "")}>
                          {t.sum.toFixed(2)} {t.currency}
                        </div>

                        <Button
                          variant={paid ? "secondary" : "outline"}
                          size="sm"
                          onClick={() => togglePaid(name)}
                          disabled={isBusy}
                          className={cn("gap-1", paid ? "border-emerald-300 dark:border-emerald-800" : "border-rose-300 dark:border-rose-800")}
                          title={paid ? "Als unbezahl markiern" : "Als bezahlt markieren"}
                        >
                          {isBusy ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : paid ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                          ) : (
                            <XCircle className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                          )}
                          <span className="text-xs">{paid ? "Bezahlt" : "Offen"}</span>
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Details je Kategorie */}
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
                    <div className="text-xs font-semibold uppercase tracking-wide opacity-70">{category}</div>
                    <div className="rounded-md border divide-y max-h-64 overflow-y-auto">
                      {items.map((it) => {
                        const qty = Number(it.quantity ?? 1);
                        const price = priceMap[it.product_id]?.price ?? 0;
                        const curr = priceMap[it.product_id]?.currency ?? "EUR";
                        const line = qty * price;
                        const n = (it.ordered_by_name ?? "—").trim() || "—";
                        const paid = !!paidMap[n];

                        return (
                          <div
                            key={it.list_item_id}
                            className={cn(
                              "flex items-center gap-3 p-2",
                              paid ? "bg-emerald-50/40 dark:bg-emerald-950/10" : "bg-transparent"
                            )}
                          >
                            <div className="truncate">{it.product_name}</div>
                            <div className="text-xs opacity-70">x {qty}</div>

                            <div className="ml-auto flex items-center gap-2">
                              {paid ? (
                                <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                              ) : (
                                <XCircle className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                              )}
                              <div className="text-xs opacity-70">{n || "—"}</div>
                              <div className="ml-3 text-sm tabular-nums">
                                {line.toFixed(2)} {curr}
                              </div>
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
