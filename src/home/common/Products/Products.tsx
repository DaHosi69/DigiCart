// src/products/Products.tsx
import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/providers/AuthProvider";
import { supabase } from "@/lib/supabaseClient";
import type { Database } from "@/shared/classes/database.types";
import NewProductForm from "./components/NewProductForm";
import { ProductCard } from "./components/ProductCard";
import { Input } from "@/components/ui/input"; // <-- für die Suche
import { useSimpleToasts } from "@/hooks/useSimpleToasts";

type Product = Database["public"]["Tables"]["products"]["Row"];
type ProductInsert = Database["public"]["Tables"]["products"]["Insert"];
type Category = Database["public"]["Tables"]["categories"]["Row"];

export default function Products() {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const toast = useSimpleToasts();
  

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- Suche (wie in Home) ---
  const [productSearch, setProductSearch] = useState<string>("");

  // --- Debounce Refs ---
  const prodDebounceRef = useRef<number | null>(null);
  const catDebounceRef = useRef<number | null>(null);

  // --- Loader ---
  const loadProducts = useCallback(async () => {
    const { data, error } = await supabase
      .from("products")
      .select("id,name,unit,category_id,price,currency_code,created_at,is_active")
      .order("created_at", { ascending: false });
    if (error) setError(error.message);
    setProducts((data as Product[]) ?? []);
  }, []);

  const loadCategories = useCallback(async () => {
    const { data, error } = await supabase
      .from("categories")
      .select("id, name")
      .order("name", { ascending: true });
    if (error) setError(error.message);
    setCategories((data as Category[]) ?? []);
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    await Promise.all([loadProducts(), loadCategories()]);
    setLoading(false);
  }, [loadProducts, loadCategories]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  // --- Debounced Schedulers ---
  const scheduleProductsReload = useCallback(() => {
    if (prodDebounceRef.current) window.clearTimeout(prodDebounceRef.current);
    prodDebounceRef.current = window.setTimeout(() => {
      prodDebounceRef.current = null;
      void loadProducts();
    }, 150);
  }, [loadProducts]);

  const scheduleCategoriesReload = useCallback(() => {
    if (catDebounceRef.current) window.clearTimeout(catDebounceRef.current);
    catDebounceRef.current = window.setTimeout(() => {
      catDebounceRef.current = null;
      void loadCategories();
    }, 150);
  }, [loadCategories]);

  // --- Realtime Subscriptions ---
  useEffect(() => {
    // Produkte
    const chProducts = supabase
      .channel("products:all")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "products" },
        () => scheduleProductsReload()
      )
      .subscribe();

    // Kategorien (optional – entfernen, falls nicht nötig)
    const chCategories = supabase
      .channel("categories:all")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "categories" },
        () => scheduleCategoriesReload()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(chProducts);
      supabase.removeChannel(chCategories);
      if (prodDebounceRef.current) {
        window.clearTimeout(prodDebounceRef.current);
        prodDebounceRef.current = null;
      }
      if (catDebounceRef.current) {
        window.clearTimeout(catDebounceRef.current);
        catDebounceRef.current = null;
      }
    };
  }, [scheduleProductsReload, scheduleCategoriesReload]);

  // --- CRUD bleibt wie gehabt ---
  const addNew = async (p: ProductInsert) => {
    const { data, error } = await supabase
      .from("products")
      .insert(p)
      .select("id,name,unit,category_id,price,currency_code,created_at,is_active")
      .single();
    if (error) {
      toast.error('Produkt konnte nicht hinzugefügt werden');
      setError(error.message);
      return;
    }
    // Optimistisch einfügen – Realtime lädt zusätzlich nach
    setProducts((prev) => (data ? [data as Product, ...prev] : prev));
    toast.success('Produkt wurde erfolgreich hinzugefügt');
  };

  const remove = async (id: string) => {
    if (!isAdmin) return;
    const ok = window.confirm("Dieses Produkt wirklich löschen?");
    if (!ok) return;
    const prev = products;
    setProducts((curr) => curr.filter((p) => p.id !== id));
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) {
      toast.error('Produkt konnte nicht gelöscht werden');
      setError(error.message);
      setProducts(prev);
    }
    toast.success('Produkt wurde erfolgreich gelöscht');
  };

  const openEdit = (id: string) => navigate(`/products/${id}/edit`);

  // --- Filter wie in Home ---
  const filteredProducts = useMemo(() => {
    const q = productSearch.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => (p.name ?? "").toLowerCase().includes(q));
  }, [productSearch, products]);

  return (
    <>
      <NewProductForm onSave={addNew} />

      {/* Produkt-Suche (wie in Home) */}
      <div className="mt-4 space-y-1">
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

      {loading && <p className="text-sm text-muted-foreground mt-4">Lade Produkte…</p>}
      {error && <p className="text-sm text-red-600 mt-2">{error}</p>}

      {/* Optional: kleiner Hinweis zur Trefferanzahl */}
      <div className="mt-2 text-xs text-muted-foreground">
        {filteredProducts.length} {filteredProducts.length === 1 ? "Treffer" : "Treffer"}
      </div>

      <div className="mt-2 grid gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {filteredProducts.length === 0 ? (
          <div className="text-sm text-muted-foreground">
            Keine Produkte mit diesem Namen gefunden.
          </div>
        ) : (
          filteredProducts.map((product) => (
            <ProductCard
              categories={categories}
              key={product.id}
              product={product}
              onMenu={() => openEdit(product.id)}
              onDelete={remove}
            />
          ))
        )}
      </div>
    </>
  );
}
