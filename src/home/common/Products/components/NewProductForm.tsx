import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
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
  const [categoryError, setCategoryError] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("categories")
        .select("id,name")
        .order("name", { ascending: true });
      setCategories((data as Category[]) ?? []);
    })();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!categoryId) {
      setCategoryError(true);
      return;
    }
    setCategoryError(false);

    const payload: ProductInsert = {
      name: name.trim(),
      unit: unit.trim() || "Stk",
      category_id: Number(categoryId),
      price: Number(price || 0),
      currency_code: "EUR",
    };
    await onSave(payload);

    setName("");
    setUnit("Stk");
    setPrice("0.00");
    setCategoryId("");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 py-4">
      <div className="space-y-2">
        <Label htmlFor="prod-name">Name</Label>
        <Input
          id="prod-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder="Produktname"
        />
      </div>

      <div className="space-y-2">
        <Label>Kategorie</Label>
        <Select
          value={categoryId}
          onValueChange={(val) => {
            setCategoryId(val);
            setCategoryError(false);
          }}
        >
          <SelectTrigger
            className={`w-full ${categoryError ? "border-red-500" : ""}`}
          >
            <SelectValue placeholder="Kategorie wählen" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id.toString()}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {categoryError && (
          <p className="text-red-500 text-xs">
            Bitte eine Kategorie auswählen.
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="price">Preis (EUR)</Label>
        <Input
          id="price"
          type="number"
          step="0.01"
          min="0"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="0.00"
        />
        <Label className="text-xs opacity-70">Optional</Label>
      </div>

      <div className="flex justify-end pt-2">
        <Button type="submit" className="gap-2">
          <Save className="h-4 w-4" /> Speichern
        </Button>
      </div>
    </form>
  );
}
