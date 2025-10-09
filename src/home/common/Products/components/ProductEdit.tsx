import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import type { Database } from "@/shared/classes/database.types";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save } from "lucide-react";
import { useAuth } from "@/providers/AuthProvider";

type Product = Database["public"]["Tables"]["products"]["Row"];
type ProductUpdate = Database["public"]["Tables"]["products"]["Update"];
type Category = Database["public"]["Tables"]["categories"]["Row"];

export default function ProductEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [unit, setUnit] = useState("Stk");
  const [price, setPrice] = useState<string>("0.00");
  const [currency, setCurrency] = useState("EUR");
  const [categoryId, setCategoryId] = useState<string>("");
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!id) return;
      setLoading(true);
      setError(null);

      const [{ data: prod, error: e1 }, { data: cats }] = await Promise.all([
        supabase.from("products").select("id,name,unit,price,currency_code,category_id").eq("id", id).maybeSingle<Product>(),
        supabase.from("categories").select("id,name").order("name"),
      ]);

      if (!active) return;

      setCategories(cats as Category[] ?? []);
      if (e1) setError(e1.message);
      if (prod) {
        setName(prod.name ?? "");
        setUnit(prod.unit ?? "Stk");
        setPrice(Number(prod.price ?? 0).toFixed(2));
        setCurrency(prod.currency_code ?? "EUR");
        setCategoryId(prod.category_id.toString() ?? "");
      } else if (!e1) {
        setError("Produkt nicht gefunden.");
      }

      setLoading(false);
    })();

    return () => { active = false; };
  }, [id]);

  const onSave = async () => {
    if (!isAdmin || !id) return;
    setSaving(true); setError(null);

    const patch: ProductUpdate = {
      name: name.trim(),
      unit: unit.trim() || "Stk",
      price: Number(price || 0),
      currency_code: currency || "EUR",
      category_id: categoryId ? Number(categoryId) : undefined,
    };

    const { error } = await supabase.from("products").update(patch).eq("id", id);
    setSaving(false);
    if (error) { setError(error.message); return; }
    navigate("/products");
  };

  if (loading) return <div className="p-4 text-sm text-muted-foreground">Lade Produkt…</div>;
  if (error)   return <div className="p-4 text-sm text-red-600">{error}</div>;

  return (
    <div className="w-full">
      <Card className="rounded-2xl shadow-sm">
        <CardHeader className="flex flex-row items-center gap-3">
          <Button type="button" variant="ghost" size="icon" className="h-9 w-9 rounded-full" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <CardTitle className="text-2xl font-semibold">Produkt bearbeiten</CardTitle>
        </CardHeader>

        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label>Name</Label>
            <Input value={name} onChange={(e)=>setName(e.target.value)} disabled={!isAdmin} required />
          </div>

          <div className="space-y-2">
            <Label>Kategorie</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger><SelectValue placeholder="Kategorie wählen" /></SelectTrigger>
              <SelectContent>
                {categories.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Einheit</Label>
            <Input value={unit} onChange={(e)=>setUnit(e.target.value)} disabled={!isAdmin} />
          </div>

          <div className="space-y-2">
            <Label>Preis</Label>
            <Input type="number" step="0.01" min="0" value={price} onChange={(e)=>setPrice(e.target.value)} disabled={!isAdmin} />
          </div>

          <div className="space-y-2">
            <Label>Währung</Label>
            <Input value={currency} onChange={(e)=>setCurrency(e.target.value)} disabled={!isAdmin} />
          </div>
        </CardContent>

        <CardFooter className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => navigate(-1)}>Abbrechen</Button>
          <Button onClick={onSave} disabled={!isAdmin || saving}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Speichern…" : "Speichern"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
