// src/home/Home.tsx
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/providers/AuthProvider";
import type { Database } from "@/shared/classes/database.types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ListDetail from "./common/Toolbar/ListDetail";

type Tables = Database["public"]["Tables"];
type ShoppingList = Tables["shopping_lists"]["Row"];
type Product = Tables["products"]["Row"];
type ListItemInsert = Tables["list_items"]["Insert"];
type Order = Tables["orders"]["Row"];
type OrderInsert = Tables["orders"]["Insert"];

export default function Home() {
  const { profile } = useAuth();

  const [lists, setLists] = useState<ShoppingList[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [activeList, setActiveList] = useState<ShoppingList | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderName, setOrderName] = useState("");

  // Aktive Listen + Produkte laden
  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      setError(null);

      const [{ data: ls, error: e1 }, { data: ps, error: e2 }] = await Promise.all([
        supabase
          .from("shopping_lists")
          .select("id,name,is_active,notes,managed_by_profile_id,created_at")
          .eq("is_active", true)
          .order("created_at", { ascending: false }),
        supabase
          .from("products")
          .select("id,name,price,currency_code,category_id,unit,created_at,is_active")
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

  // Offene Order für Liste + Person holen/erstellen (mit ordered_by_name)
  const upsertOpenOrder = async (listId: string, profileId: string, name: string): Promise<Order> => {
    const { data: existing, error: e1 } = await supabase
      .from("orders")
      .select("*")
      .eq("list_id", listId)
      .eq("created_by_profile_id", profileId)
      .eq("status", "open" as Database["public"]["Enums"]["order_status"])
      .maybeSingle<Order>();

    if (e1 && e1.code !== "PGRST116") throw e1;
    if (existing) {
      // Falls noch kein Name gesetzt und jetzt einer vorhanden ist → updaten
      const normalized = name.trim();
      if (!existing.ordered_by_name && normalized) {
        await supabase.from("orders").update({ ordered_by_name: normalized }).eq("id", existing.id);
      }
      return existing;
    }

    const payload: OrderInsert = {
      list_id: listId,
      created_by_profile_id: profileId,
      status: "open",
      currency_code: "EUR",
      total_amount: 0,
      ordered_by_name: name.trim(),
      payer_name: name.trim(),
      purchased_at: null,
    };

    const { data: created, error: e2 } = await supabase
      .from("orders")
      .insert(payload)
      .select("*")
      .single();

    if (e2) throw e2;
    return created!;
  };

  // Produkt zur aktiven Liste hinzufügen -> NUR list_items + (Order anlegen/aktualisieren)
  const addSelectedToList = async () => {
    if (!activeList || !selectedProduct || !profile?.id) return;
    
    const normalizedName = orderName.trim();
    if (!normalizedName) {
      alert("Bitte den Namen der bestellenden Person angeben.");
      return;
    }

    setAdding(true);
    setError(null);

    try {
      // 1) Order sicherstellen (mit ordered_by_name)
      await upsertOpenOrder(activeList.id, profile.id, normalizedName);

      // 2) list_items: immer neuen Eintrag anlegen (Duplikate erlaubt)
      const liPayload: ListItemInsert = {
        list_id: activeList.id,
        product_id: selectedProduct.id,
        quantity: 1,
        note: null,
        added_at: undefined, // DB-Default (now()) nutzen, falls gesetzt
      };
      const { error: liErr } = await supabase.from("list_items").insert(liPayload);
      if (liErr) throw liErr;

      // optional: Auswahl zurücksetzen
      // setSelectedProduct(null);
    } catch (e: any) {
      setError(e?.message ?? "Fehler beim Hinzufügen");
    } finally {
      setAdding(false);
    }
  };

  if (loading) return <div className="p-4 text-sm text-muted-foreground">Lade…</div>;
  if (error) return <div className="p-4 text-sm text-red-600">{error}</div>;

  return (
    <div className="max-w-7xl mx-auto p-4 lg:p-6">
      <div className="mt-2 grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-4 lg:gap-6">
        {/* Linke Spalte: aktive Listen + Item-Ansicht */}
        <Card>
          <CardContent className="p-4">
            <div className="mb-4 flex gap-2 overflow-x-auto">
              {lists.map((l) => (
                <Button
                  key={l.id}
                  variant={activeList?.id === l.id ? "default" : "secondary"}
                  onClick={() => setActiveList(l)}
                >
                  {l.name}
                </Button>
              ))}
            </div>

            {activeList ? (
              <ListDetail listId={activeList.id} />
            ) : (
              <div className="text-sm text-muted-foreground">Keine aktive Liste ausgewählt.</div>
            )}
          </CardContent>
        </Card>

        {/* Rechte Spalte: Produktkatalog + Besteller-Name + Add */}
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="text-sm font-medium">Produkte</div>

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

            <div className="grid gap-2">
              {products.map((p) => (
                <Button
                  key={p.id}
                  variant={selectedProduct?.id === p.id ? "default" : "outline"}
                  className="justify-between"
                  onClick={() => setSelectedProduct(p)}
                >
                  <span className="truncate">{p.name}</span>
                  <span className="text-xs opacity-75">
                    {(Number(p.price ?? 0)).toFixed(2)} {p.currency_code ?? "EUR"}
                  </span>
                </Button>
              ))}
            </div>

            <Button
              className="w-full"
              onClick={addSelectedToList}
              disabled={!activeList || !selectedProduct || adding}
            >
              {adding ? "Wird hinzugefügt…" : "Zur Liste hinzufügen"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}




 /*<>
    <main style={{ maxWidth: 700, margin: "40px auto", padding: 16 }}>
      <h1>360° Viewer</h1>
      <PanoViewer />
    </main>
   </>*/