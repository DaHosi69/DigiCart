import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Save } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import type { Database } from "@/shared/classes/database.types";

type Category = Database["public"]["Tables"]["categories"]["Row"];
type ProductInsert = Database["public"]["Tables"]["products"]["Insert"];

export default function NewProductForm({
  onSave,
}: {
  onSave: (payload: ProductInsert) => void | Promise<void>;
}) {
  const [name, setName] = useState("");
  const [unit, setUnit] = useState<string>("Stk");
  const [price, setPrice] = useState<string>("0.00");
  const [categoryId, setCategoryId] = useState<string>("");
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("categories")
        .select("id,name")
        .order("name", { ascending: true });
      setCategories(data as Category[] ?? []);
    })();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryId) return;
    const payload: ProductInsert = {
      name: name.trim(),
      unit: unit.trim() || "Stk",
      category_id: categoryId ? Number(categoryId) : 0,
      price: Number(price || 0),
      currency_code: "EUR",
    };
    await onSave(payload);
    // Reset optional
    setName(""); setUnit("Stk"); setPrice("0.00"); setCategoryId("");
  };

  return (
    <Card className="rounded-2xl shadow-sm">
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle className="text-2xl font-semibold">
                Neues Produkt
              </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-4">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="prod-name">Name</Label>
            <Input id="prod-name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>

          <div className="space-y-2">
            <Label>Kategorie</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger className="w-full"><SelectValue placeholder="Kategorie wählen" /></SelectTrigger>
              <SelectContent>
                {categories.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="price">Preis (EUR)</Label>
            <Input id="price" type="number" step="0.01" min="0" value={price} onChange={(e)=>setPrice(e.target.value)} />
          </div>
        </CardContent>
        <CardFooter className="justify-end">
          <Button type="submit" className="gap-2">
            <Save className="h-4 w-4" /> Speichern
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
