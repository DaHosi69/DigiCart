// src/home/common/Lists/Lists.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import NewShoppingListForm from "./components/NewShoppingListForm";
import { useAuth } from "@/providers/AuthProvider";
import { supabase } from "@/lib/supabaseClient";
import type { Database } from "@/shared/classes/database.types";
import { ShoppingListCard } from "./components/ShoppingListCard";
import { Input } from "@/components/ui/input";
import { useSimpleToasts } from "@/hooks/useSimpleToasts";

type ShoppingList = Database["public"]["Tables"]["shopping_lists"]["Row"];

export default function Lists() {
  const navigate = useNavigate();
  const { isAdmin, profile } = useAuth();

  const [lists, setLists] = useState<ShoppingList[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const toast = useSimpleToasts();

  // 🔎 Suche (wie in Products)
  const [listSearch, setListSearch] = useState<string>("");

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
      toast.error('Hinzufügen der neuen Liste fehlgeschlagen');
      setError(error.message);
      return;
    }
    toast.success('Liste wurde erfolgreich hinzugefügt');
    setLists((prev) => (data ? [data, ...prev] : prev));
  };

  const deleteList = async (id: string) => {
    if (!isAdmin) return;
    const ok = window.confirm("Diese Einkaufsliste wirklich löschen?");
    if (!ok) return;

    const prev = lists;
    setLists((curr) => curr.filter((l) => l.id !== id));

    const { error } = await supabase.from("shopping_lists").delete().eq("id", id);
    if (error) {
      toast.error('Liste konnte nicht gelöscht werden');
      console.error(error);
      setError(error.message);
      setLists(prev); // Rollback
    }
    toast.success('Liste erfolgreich gelöscht');
  };

  const openDetails = (id: string) => navigate(`/lists/${id}/edit`);

  // 🔎 Gefilterte Listen (Name + Notes, case-insensitive)
  const filteredLists = useMemo(() => {
    const q = listSearch.trim().toLowerCase();
    if (!q) return lists;
    return lists.filter((l) => {
      const name = (l.name ?? "").toLowerCase();
      const notes = (l.notes ?? "").toLowerCase();
      return name.includes(q) || notes.includes(q);
    });
  }, [listSearch, lists]);

  return (
    <>
      {isAdmin && (
        <NewShoppingListForm
          onBack={() => navigate(-1)}
          onCancel={() => navigate("/home")}
          onSave={addNewList}
        />
      )}

      {/* Suchfeld */}
      <div className="mt-4 space-y-1">
        <label htmlFor="list-search" className="text-l font-medium">
          Listen suchen
        </label>
        <Input
          id="list-search"
          placeholder="z. B. Wocheneinkauf, Grillparty…"
          value={listSearch}
          onChange={(e) => setListSearch(e.target.value)}
        />
      </div>

      {loading && (
        <p className="text-sm text-muted-foreground mt-4">Lade Listen…</p>
      )}
      {error && <p className="text-sm text-red-600 mt-2">{error}</p>}

      {/* Trefferanzahl */}
      <div className="mt-2 text-xs text-muted-foreground">
        {filteredLists.length} {filteredLists.length === 1 ? "Treffer" : "Treffer"}
      </div>

      <div className="mt-4 grid gap-3">
        {filteredLists.length === 0 ? (
          <div className="text-sm text-muted-foreground">
            Keine Listen gefunden.
          </div>
        ) : (
          filteredLists.map((list) => (
            <ShoppingListCard
              key={list.id}
              list={list}
              onMenu={() => openDetails(list.id)}
              onDelete={deleteList}
            />
          ))
        )}
      </div>
    </>
  );
}
