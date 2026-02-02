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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus, List } from "lucide-react";
import { useLoading } from "@/contexts/LoadingContext";

type ShoppingList = Database["public"]["Tables"]["shopping_lists"]["Row"];

export default function Lists() {
  const navigate = useNavigate();
  const { isAdmin, profile } = useAuth();
  const { addTask, removeTask } = useLoading();

  const [lists, setLists] = useState<ShoppingList[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const toast = useSimpleToasts();

  // 🔎 Suche (wie in Products)
  const [listSearch, setListSearch] = useState<string>("");

  const loadAllLists = async () => {
    addTask("lists-data");
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("shopping_lists")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) setError(error.message);
    setLists(data ?? []);
    setLoading(false);
    removeTask("lists-data");
  };

  useEffect(() => {
    void loadAllLists();
    // cleanup
    return () => removeTask("lists-data");
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
      toast.error("Hinzufügen der neuen Liste fehlgeschlagen");
      setError(error.message);
      return;
    }
    toast.success("Liste wurde erfolgreich hinzugefügt");
    setLists((prev) => (data ? [data, ...prev] : prev));
    setIsDialogOpen(false);
  };

  const deleteList = async (id: string) => {
    if (!isAdmin) return;
    const ok = window.confirm("Diese Einkaufsliste wirklich löschen?");
    if (!ok) return;

    const prev = lists;
    setLists((curr) => curr.filter((l) => l.id !== id));

    const { error } = await supabase
      .from("shopping_lists")
      .delete()
      .eq("id", id);
    if (error) {
      toast.error("Liste konnte nicht gelöscht werden");
      console.error(error);
      setError(error.message);
      setLists(prev); // Rollback
    }
    toast.success("Liste erfolgreich gelöscht");
  };

  const toggleListStatus = async (list: ShoppingList) => {
    if (!isAdmin) return;
    const newStatus = !list.is_active;

    // Optimistic update
    setLists((curr) =>
      curr.map((l) => (l.id === list.id ? { ...l, is_active: newStatus } : l)),
    );

    const { error } = await supabase
      .from("shopping_lists")
      .update({ is_active: newStatus })
      .eq("id", list.id);

    if (error) {
      toast.error("Status konnte nicht geändert werden");
      // Rollback
      setLists((curr) =>
        curr.map((l) =>
          l.id === list.id ? { ...l, is_active: !newStatus } : l,
        ),
      );
    } else {
      toast.success(newStatus ? "Liste aktiviert" : "Liste deaktiviert");
    }
  };

  const openDetails = (id: string) => navigate(`/lists/${id}/edit`);
  const openList = (id: string) => navigate(`/home/lists/${id}`);

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
    <div className="max-w-7xl mx-auto p-4 lg:p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <List className="h-6 w-6 text-primary" />
            Einkaufslisten
          </h1>
          <p className="text-sm text-muted-foreground">
            Verwalte deine Einkaufslisten.
          </p>
        </div>
        {isAdmin && (
          <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" /> Neue Liste
          </Button>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Neue Einkaufsliste erstellen</DialogTitle>
          </DialogHeader>
          <NewShoppingListForm onSave={addNewList} />
        </DialogContent>
      </Dialog>

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

      {loading && null}
      {error && <p className="text-sm text-red-600 mt-2">{error}</p>}

      {/* Trefferanzahl */}
      <div className="mt-2 text-xs text-muted-foreground">
        {filteredLists.length}{" "}
        {filteredLists.length === 1 ? "Treffer" : "Treffer"}
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
              onOpen={() => openList(list.id)}
              onDelete={deleteList}
              onToggle={() => toggleListStatus(list)}
            />
          ))
        )}
      </div>
    </div>
  );
}
