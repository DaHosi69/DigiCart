import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/providers/AuthProvider";
import type { Database } from "@/shared/classes/database.types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft } from "lucide-react";
import ListDetail from "./common/Toolbar/ListDetail";
import Toolbar from "./common/Toolbar/Toolbar";
import ListCard from "./common/Toolbar/ListCard";
import { useNavigate, useParams } from "react-router-dom";
import { useSimpleToasts } from "@/hooks/useSimpleToasts";
import { LoadingScreen } from "@/shared/components/LoadingScreen";

type Tables = Database["public"]["Tables"];
type ShoppingList = Tables["shopping_lists"]["Row"] & {
  list_items: { count: number }[];
};
type Product = Tables["products"]["Row"];
type ListItemInsert = Tables["list_items"]["Insert"];
type Order = Tables["orders"]["Row"];
type OrderInsert = Tables["orders"]["Insert"];

type SelectedMap = Record<string, { product: Product; qty: number }>;

export default function Home() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const { id: listIdParam } = useParams<{ id?: string }>(); // /home/lists/:id
  const toast = useSimpleToasts();

  const [lists, setLists] = useState<ShoppingList[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [activeList, setActiveList] = useState<ShoppingList | null>(null);

  const [selected, setSelected] = useState<SelectedMap>({});
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderName, setOrderName] = useState("");

  const [productSearch, setProductSearch] = useState<string>("");
  const [listRefresh, setListRefresh] = useState(0);

  // --- Debounce Refs ---
  const listsDebounceRef = useRef<number | null>(null);
  const prodsDebounceRef = useRef<number | null>(null);

  // --- Loader ---
  const loadLists = useCallback(async () => {
    const { data, error } = await supabase
      .from("shopping_lists")
      .select(
        "id,name,is_active,notes,managed_by_profile_id,created_at, list_items(count)",
      )
      .eq("is_active", true)
      .order("created_at", { ascending: false });
    if (error) setError(error.message);
    setLists(data ?? []);
  }, []);

  const loadProducts = useCallback(async () => {
    const { data, error } = await supabase
      .from("products")
      .select(
        "id,name,price,currency_code,category_id,unit,created_at,is_active",
      )
      .eq("is_active", true)
      .order("created_at", { ascending: false });
    if (error) setError(error.message);
    setProducts((data as Product[]) ?? []);
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    await Promise.all([loadLists(), loadProducts()]);
    setLoading(false);
  }, [loadLists, loadProducts]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  // Aktive Liste anhand Route setzen (sobald Listen geladen)
  useEffect(() => {
    if (!lists) return;
    if (listIdParam) {
      const found = lists.find((l) => l.id === listIdParam) || null;
      setActiveList(found);
      // Wenn ID ungültig ist, zurück zum Picker
      if (!found && !loading) navigate("/home", { replace: true });
    } else {
      setActiveList(null); // Picker
    }
  }, [lists, listIdParam, loading, navigate]);

  // --- Debounced schedulers ---
  const scheduleListsReload = useCallback(() => {
    if (listsDebounceRef.current) window.clearTimeout(listsDebounceRef.current);
    listsDebounceRef.current = window.setTimeout(() => {
      listsDebounceRef.current = null;
      void loadLists();
    }, 150);
  }, [loadLists]);

  const scheduleProductsReload = useCallback(() => {
    if (prodsDebounceRef.current) window.clearTimeout(prodsDebounceRef.current);
    prodsDebounceRef.current = window.setTimeout(() => {
      prodsDebounceRef.current = null;
      void loadProducts();
    }, 150);
  }, [loadProducts]);

  // --- Realtime Subscriptions ---
  useEffect(() => {
    const chLists = supabase
      .channel("shopping_lists:active")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "shopping_lists",
        },
        () => scheduleListsReload(),
      )
      .subscribe();

    const chProducts = supabase
      .channel("products:active")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "products",
        },
        () => scheduleProductsReload(),
      )
      .subscribe();

    const chListItems = supabase
      .channel("list_items:active")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "list_items",
        },
        () => scheduleListsReload(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(chLists);
      supabase.removeChannel(chProducts);
      supabase.removeChannel(chListItems);
      if (listsDebounceRef.current) {
        window.clearTimeout(listsDebounceRef.current);
        listsDebounceRef.current = null;
      }
      if (prodsDebounceRef.current) {
        window.clearTimeout(prodsDebounceRef.current);
        prodsDebounceRef.current = null;
      }
    };
  }, [scheduleListsReload, scheduleProductsReload]);

  // --- Rest deiner Komponente ---
  const filteredProducts = useMemo(() => {
    const q = productSearch.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => (p.name ?? "").toLowerCase().includes(q));
  }, [productSearch, products]);

  const toggleProduct = (p: Product) => {
    setSelected((prev) => {
      const next = { ...prev };
      if (next[p.id]) delete next[p.id];
      else next[p.id] = { product: p, qty: 1 };
      return next;
    });
  };

  const changeQty = (productId: string, qty: number) => {
    setSelected((prev) => {
      if (!prev[productId]) return prev;
      const safe = Math.max(1, Math.min(9999, Math.floor(qty || 1)));
      return { ...prev, [productId]: { ...prev[productId], qty: safe } };
    });
  };

  const totalSelected = useMemo(
    () => Object.values(selected).reduce((sum, s) => sum + s.qty, 0),
    [selected],
  );

  const createOrder = async (
    listId: string,
    profileId: string,
    name: string,
  ): Promise<Order> => {
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

  const addBatchToList = async () => {
    if (!activeList || !profile?.id) return;

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
      toast.error("Produkt konnte nicht zur Liste Hinzugefügt werden");
    } finally {
      setAdding(false);
      toast.success("Produkt erfolgreich zur Liste Hinzugefügt");
    }
  };

  const goBackToPicker = () => {
    // zurück zum Picker als Route
    navigate("/home");
    // UI-state zurücksetzen (optional)
    setSelected({});
    setOrderName("");
    setProductSearch("");
  };

  if (loading)
    return <LoadingScreen />;
  if (error) return <div className="p-4 text-sm text-red-600">{error}</div>;

  const pickerActive = !listIdParam; // Route-abhängig

  return (
    <>
      <Toolbar activeListName={activeList?.name || ""} />
      {pickerActive ? (
        <label className="text-sm opacity-70">
          Wähle eine Einkaufsliste aus zu der du Bestellungen hinzufügen willst.
        </label>
      ) : (
        <label className="text-sm opacity-70">
          Füge ein oder mehrere Produkte zur Einkaufsliste hinzu.
        </label>
      )}

      {/* Kopfzeile: Back nur wenn eine Liste aktiv (Route hat :id) */}
      {!pickerActive && (
        <div className="mt-2 mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={goBackToPicker} className="gap-1">
              <ChevronLeft className="h-6 w-6 [&_svg]:!size-10" />
              Zur Listen-Auswahl
            </Button>
          </div>
        </div>
      )}

      <div
        className={
          pickerActive
            ? "w-full mt-2"
            : "w-full mt-2 grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-4 lg:gap-6"
        }
      >
        {/* Linke Spalte */}
        {pickerActive ? (
          <>
            <label className="text-xl font-semibold">Einkaufslisten:</label>
            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {lists.map((l) => (
                <ListCard
                  key={l.id}
                  list={l}
                  selected={false}
                  orderCount={l.list_items?.[0]?.count}
                  onClick={() => {
                    // statt setActiveList → Route wechseln
                    navigate(`/home/lists/${l.id}`);
                    setSelected({});
                    setListRefresh((v) => v + 1);
                  }}
                />
              ))}
              {lists.length === 0 && (
                <div className="text-sm text-muted-foreground">
                  Keine aktiven Einkaufslisten.
                </div>
              )}
            </div>
          </>
        ) : (
          activeList && (
            <ListDetail listId={activeList.id} refreshKey={listRefresh} />
          )
        )}

        {/* Rechte Spalte nur wenn :id */}
        {!pickerActive && activeList && (
          <Card className="max-h-[90vh] sm:max-h-[calc(90vh-150px)]">
            <CardContent className="p-4 space-y-3">
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

              <div className="grid gap-2 max-h-70 overflow-y-auto pr-1">
                {filteredProducts.length === 0 && (
                  <>
                    <div className="text-xs text-muted-foreground">
                      Keine Produkte mit diesem Namen gefunden.
                    </div>
                    <Button onClick={() => navigate("/products")}>
                      Neues Produkt erstellen
                    </Button>
                  </>
                )}

                {filteredProducts.map((p) => {
                  const sel = selected[p.id];
                  const isActive = !!sel;
                  return (
                    <div
                      key={p.id}
                      className="flex flex-col gap-1 rounded-md p-1.5"
                    >
                      <Button
                        variant={isActive ? "default" : "outline"}
                        onClick={() => toggleProduct(p)}
                        className="w-full min-h-[40px] h-auto whitespace-normal text-left justify-between items-start py-2"
                      >
                        <span className="mr-2">{p.name}</span>
                        <span className="text-xs opacity-75 shrink-0 pt-0.5">
                          {Number(p.price ?? 0).toFixed(2)}{" "}
                          {p.currency_code ?? "EUR"}
                        </span>
                      </Button>

                      {isActive && (
                        <div className="flex items-center justify-center gap-2 w-full">
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
        )}
      </div>
    </>
  );
}
