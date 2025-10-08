import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import NewShoppingListForm from "./components/NewShoppingListForm";
import { useAuth } from "@/providers/AuthProvider";
import { supabase } from "@/lib/supabaseClient";
import type { Database } from "@/shared/classes/database.types";
import { ShoppingListCard } from "./components/ShoppingListCard";

type ShoppingList = Database["public"]["Tables"]["shopping_lists"]["Row"];

export default function Lists() {
  const navigate = useNavigate();
  const { isAdmin, profile } = useAuth();

  const [lists, setLists] = useState<ShoppingList[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAllLists = async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("shopping_lists")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) setError(error.message);
    setLists(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    void loadAllLists();
  }, []);

  const addNewList = async ({
    listname,
    listnote,
  }: {
    listname: string;
    listnote: string;
  }) => {
    const { data, error } = await supabase
      .from("shopping_lists")
      .insert([
        {
          name: listname,
          notes: listnote || null,
          managed_by_profile_id: profile?.id ?? null,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error(error);
      setError(error.message);
      return;
    }
    setLists((prev) => (data ? [data, ...prev] : prev));
  };

  // 🔴 Delete-Logik: fragt kurz nach, löscht in Supabase und aktualisiert State
  const deleteList = async (id: string) => {
    if (!isAdmin) return; // Sicherheitsnetz; UI blendet den Button ohnehin aus
    const ok = window.confirm("Diese Einkaufsliste wirklich löschen?");
    if (!ok) return;

    // Optimistisches Entfernen (optional): vorher merken, falls Rollback nötig
    const prev = lists;
    setLists((curr) => curr.filter((l) => l.id !== id));

    const { error } = await supabase
      .from("shopping_lists")
      .delete()
      .eq("id", id);

    if (error) {
      console.error(error);
      setError(error.message);
      // Rollback, falls Delete fehlschlägt
      setLists(prev);
      return;
    }

    // Optional: refetchen (wenn du auf Nummer sicher gehen willst)
    // await loadAllLists();
  };

  
const openDetails = (id: string) => navigate(`/lists/${id}/edit`);


  return (
    <>
      {isAdmin && (
        <NewShoppingListForm
          onBack={() => navigate(-1)}
          onCancel={() => navigate("/home")}
          onSave={addNewList} // <- erwartet hier { listname, listnote }
        />
      )}

      {loading && (
        <p className="text-sm text-muted-foreground mt-4">Lade Listen…</p>
      )}
      {error && <p className="text-sm text-red-600 mt-2">{error}</p>}

      <div className="mt-4 grid gap-3">
        {lists.map((list) => (
          <ShoppingListCard
            key={list.id}
            list={list}
            onMenu={() => openDetails(list.id)}  
            onDelete={deleteList} // 👈 Delete-Callback an Card
          />
        ))}
      </div>
    </>
  );
}
