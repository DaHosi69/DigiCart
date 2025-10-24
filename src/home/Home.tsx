// src/home/Home.tsx
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/providers/AuthProvider";
import type { Database } from "@/shared/classes/database.types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ListDetail from "./common/Toolbar/ListDetail";
import Toolbar from "./common/Toolbar/Toolbar";
import ListCard from "./common/Toolbar/ListCard";

type Tables = Database["public"]["Tables"];
type ShoppingList = Tables["shopping_lists"]["Row"];
type Product = Tables["products"]["Row"];
type ListItemInsert = Tables["list_items"]["Insert"];
type Order = Tables["orders"]["Row"];
type OrderInsert = Tables["orders"]["Insert"];

type SelectedMap = Record<string, { product: Product; qty: number }>;

export default function Home() {
  const { profile } = useAuth();

  const [lists, setLists] = useState<ShoppingList[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [activeList, setActiveList] = useState<ShoppingList | null>(null);

  const [selected, setSelected] = useState<SelectedMap>({});

  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderName, setOrderName] = useState("");

  // 🆕 Suchbegriff für Produkte
  const [productSearch, setProductSearch] = useState<string>("");

  // Refresh-Trigger für ListDetail
  const [listRefresh, setListRefresh] = useState(0);

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      setError(null);

      const [{ data: ls, error: e1 }, { data: ps, error: e2 }] =
        await Promise.all([
          supabase
            .from("shopping_lists")
            .select("id,name,is_active,notes,managed_by_profile_id,created_at")
            .eq("is_active", true)
            .order("created_at", { ascending: false }),
          supabase
            .from("products")
            .select(
              "id,name,price,currency_code,category_id,unit,created_at,is_active"
            )
            .eq("is_active", true)
            .order("created_at", { ascending: false }),
        ]);

      if (e1) setError(e1.message);
      if (e2) setError(e2.message);

      setLists(ls ?? []);
      setProducts((ps as Product[]) ?? []);
      setActiveList((ls ?? [])[0] ?? null);
      setLoading(false);
    };

    void loadAll();
  }, []);

  // 🆕 Gefilterte Produkte (case-insensitive)
  const filteredProducts = useMemo(() => {
    const q = productSearch.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => (p.name ?? "").toLowerCase().includes(q));
  }, [productSearch, products]);

  // Auswahl toggeln
  const toggleProduct = (p: Product) => {
    setSelected((prev) => {
      const next = { ...prev };
      if (next[p.id]) {
        delete next[p.id];
      } else {
        next[p.id] = { product: p, qty: 1 };
      }
      return next;
    });
  };

  // Menge ändern
  const changeQty = (productId: string, qty: number) => {
    setSelected((prev) => {
      if (!prev[productId]) return prev;
      const safe = Math.max(1, Math.min(9999, Math.floor(qty || 1)));
      return { ...prev, [productId]: { ...prev[productId], qty: safe } };
    });
  };

  const totalSelected = useMemo(
    () => Object.values(selected).reduce((sum, s) => sum + s.qty, 0),
    [selected]
  );

  // Immer NEUE Order anlegen
  const createOrder = async (
    listId: string,
    profileId: string,
    name: string
  ): Promise<Order> => {
    console.log(name);

    const payload: OrderInsert = {
      list_id: listId,
      created_by_profile_id: profileId,
      status: "open",
      currency_code: "EUR",
      total_amount: 0,
      ordered_by_name: name.trim(),
      payer_name: name.trim() || null,
      purchased_at: null,
    };

    const { data, error } = await supabase
      .from("orders")
      .insert(payload)
      .select("*")
      .single();

    if (error) throw error;
    return data!;
  };

  // Produkte gesammelt hinzufügen
  const addBatchToList = async () => {
    if (!activeList || !profile?.id) return;
    console.log(orderName);

    const normalizedName = orderName.trim();
    if (!normalizedName) {
      alert("Bitte den Namen der bestellenden Person angeben.");
      return;
    }
    if (Object.keys(selected).length === 0) {
      alert("Bitte mindestens ein Produkt auswählen.");
      return;
    }

    setAdding(true);
    setError(null);

    try {
      await createOrder(activeList.id, profile.id, normalizedName);

      const inserts: ListItemInsert[] = Object.values(selected).map((s) => ({
        list_id: activeList.id,
        product_id: s.product.id,
        quantity: s.qty,
        note: null,
      }));

      const { error: liErr } = await supabase
        .from("list_items")
        .insert(inserts);
      if (liErr) throw liErr;

      setSelected({});
      setListRefresh((v) => v + 1);
    } catch (e: any) {
      setError(e?.message ?? "Fehler beim Hinzufügen");
    } finally {
      setAdding(false);
    }
  };

  if (loading)
    return <div className="p-4 text-sm text-muted-foreground">Lade…</div>;
  if (error) return <div className="p-4 text-sm text-red-600">{error}</div>;

  return (
    <>
      <Toolbar />
      <div className="mt-2 grid grid-cols-1 xl:grid-cols-[1fr_420px] gap-4 lg:gap-6">
        {/* Linke Spalte */}
        <Card>
          <CardContent className="p-4">
            {/* Listen-Auswahl als Cards */}
            <div className="mb-4 mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {lists.map((l) => (
                <ListCard
                  key={l.id}
                  list={l}
                  selected={activeList?.id === l.id}
                  onClick={() => {
                    setActiveList(l);
                    setSelected({});
                    setListRefresh((v) => v + 1);
                  }}
                />
              ))}
            </div>
            <hr/>

            {activeList ? (
              <ListDetail listId={activeList.id} refreshKey={listRefresh} />
            ) : (
              <div className="text-sm text-muted-foreground">
                Keine aktive Liste ausgewählt.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Rechte Spalte */}
        <Card>
          <CardContent className="p-4 space-y-3">
            {/* Produkt-Suche (steuert rechte Spalte) */}
            <div className="space-y-1">
              <label htmlFor="product-search" className="text-l font-medium">
                Produkt Suchen
              </label>
              <Input
                id="product-search"
                placeholder="z. B. Cola, Käse, Brot…"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
              />
            </div>
            <div className="text-sm font-medium">Produkte auswählen</div>

            <div className="grid gap-2 max-h-40 overflow-y-auto pr-1">
              {filteredProducts.length === 0 && (
                <div className="text-xs text-muted-foreground">
                  Keine Produkte gefunden.
                </div>
              )}

              {filteredProducts.map((p) => {
                const sel = selected[p.id];
                const isActive = !!sel;
                return (
                  <div
                    key={p.id}
                    className="flex items-center gap-2 rounded-md p-2"
                  >
                    <Button
                      variant={isActive ? "default" : "outline"}
                      onClick={() => toggleProduct(p)}
                      className="min-w-28 justify-between"
                    >
                      <span className="truncate">{p.name}</span>
                      <span className="text-xs opacity-75">
                        {Number(p.price ?? 0).toFixed(2)}{" "}
                        {p.currency_code ?? "EUR"}
                      </span>
                    </Button>

                    {isActive && (
                      <div className="ml-auto flex items-center gap-2">
                        <Button
                          type="button"
                          size="icon"
                          variant="secondary"
                          onClick={() => changeQty(p.id, (sel.qty ?? 1) - 1)}
                          aria-label="Menge verringern"
                        >
                          −
                        </Button>
                        <Input
                          type="number"
                          value={sel.qty}
                          onChange={(e) =>
                            changeQty(p.id, Number(e.target.value))
                          }
                          className="w-16 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          min={1}
                        />
                        <Button
                          type="button"
                          size="icon"
                          variant="secondary"
                          onClick={() => changeQty(p.id, (sel.qty ?? 1) + 1)}
                          aria-label="Menge erhöhen"
                        >
                          +
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Name der bestellenden Person */}
            <div className="space-y-1">
              <label htmlFor="order-name" className="text-xs opacity-80">
                Name der bestellenden Person
              </label>
              <Input
                id="order-name"
                value={orderName}
                onChange={(e) => setOrderName(e.target.value)}
                placeholder="z. B. Max Mustermann"
              />
            </div>

            <Button
              className="w-full"
              onClick={addBatchToList}
              disabled={
                !activeList || adding || Object.keys(selected).length === 0
              }
              title={
                Object.keys(selected).length === 0
                  ? "Bitte Produkte auswählen"
                  : undefined
              }
            >
              {adding
                ? "Wird hinzugefügt…"
                : `Zur Liste hinzufügen (${totalSelected} Artikel)`}
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
