import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/providers/AuthProvider";
import { supabase } from "@/lib/supabaseClient";
import type { Database } from "@/shared/classes/database.types";
import NewProductForm from "./components/NewProductForm";
import { ProductCard } from "./components/ProductCard";

type Product = Database["public"]["Tables"]["products"]["Row"];
type ProductInsert = Database["public"]["Tables"]["products"]["Insert"];
type Category = Database["public"]["Tables"]["categories"]["Row"];

export default function Products() {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAll = async () => {
    setLoading(true);
    setError(null);
   
    await Promise.all([loadProducts(), loadCategories()]);

    setLoading(false);
  };

  const loadProducts = async () => {
    const { data, error } = await supabase
      .from("products")
      .select("id,name,unit,category_id,price,currency_code,created_at")
      .order("created_at", { ascending: false });
    if (error) setError(error.message);
    setProducts((data as Product[]) ?? []);
  };

  const loadCategories = async () => {
    const { data, error } = await supabase
      .from("categories")
      .select("id, name")
      .order("name", { ascending: true });

    if (error) setError(error.message);
    setCategories((data as Category[]) ?? []);
  };

  useEffect(() => {
    void loadAll();
  }, []);

  const addNew = async (p: ProductInsert) => {
    const { data, error } = await supabase
      .from("products")
      .insert(p)
      .select("id,name,unit,category_id,price,currency_code,created_at")
      .single();
    if (error) {
      setError(error.message);
      return;
    }
    setProducts((prev) => (data ? [data as Product, ...prev] : prev));
  };

  const remove = async (id: string) => {
    if (!isAdmin) return;
    const ok = window.confirm("Dieses Produkt wirklich löschen?");
    if (!ok) return;
    const prev = products;
    setProducts((curr) => curr.filter((p) => p.id !== id));
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) {
      setError(error.message);
      setProducts(prev);
    }
  };

  const openEdit = (id: string) => navigate(`/products/${id}/edit`);

  return (
    <>
      <NewProductForm onSave={addNew} />

      {loading && (
        <p className="text-sm text-muted-foreground mt-4">Lade Produkte…</p>
      )}
      {error && <p className="text-sm text-red-600 mt-2">{error}</p>}

      <div className="mt-4 grid gap-3">
        {products.map((product) => (
          <ProductCard
            categories={categories}
            key={product.id}
            product={product}
            onMenu={() => openEdit(product.id)}
            onDelete={remove}
          />
        ))}
      </div>
    </>
  );
}
