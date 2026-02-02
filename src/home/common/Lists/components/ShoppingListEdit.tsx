// src/home/common/Lists/ShoppingListEdit.tsx
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { Database } from "@/shared/classes/database.types";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Save } from "lucide-react";
import { useAuth } from "@/providers/AuthProvider";
import { LoadingScreen } from "@/shared/components/LoadingScreen";

type ShoppingList = Database["public"]["Tables"]["shopping_lists"]["Row"];
type ShoppingListUpdate = Database["public"]["Tables"]["shopping_lists"]["Update"];

export default function ShoppingListEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [notes, setNotes] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(true);

  // Laden
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!id) return;
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from("shopping_lists")
        .select("id, name, notes, is_active, managed_by_profile_id, created_at")
        .eq("id", id)
        .maybeSingle<ShoppingList>();

      if (!mounted) return;

      if (error) {
        setError(error.message);
      } else if (data) {
        setName(data.name ?? "");
        setNotes(data.notes ?? null);
        setIsActive(Boolean(data.is_active));
      } else {
        setError("Liste nicht gefunden.");
      }

      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, [id]);

  // Speichern
  const onSave = async () => {
    if (!isAdmin) return; // RLS schützt zusätzlich
    if (!id) return;

    setSaving(true);
    setError(null);

    const patch: ShoppingListUpdate = {
      name: name.trim(),
      notes: (notes ?? "").trim() === "" ? null : notes?.trim() ?? null,
      is_active: isActive,
    };

    const { data, error } = await supabase
      .from("shopping_lists")
      .update(patch)
      .eq("id", id)
      .select()
      .single();

    setSaving(false);

    if (error) {
      setError(error.message);
      return;
    }

    // optional: zurück zur Liste oder Detail bestätigt lassen
    navigate("/lists"); // oder navigate(-1)
  };

  if (loading) return <LoadingScreen/>;
  if (error) return <div className="p-4 text-sm text-red-600">{error}</div>;

  return (
    <div className="w-full">
      <Card className="rounded-2xl shadow-sm">
        <CardHeader className="flex flex-row items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full"
            onClick={() => navigate(-1)}
            aria-label="Zurück"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <CardTitle className="text-2xl font-semibold">Einkaufsliste bearbeiten</CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="list-name" className="text-base">Name</Label>
            <Input
              id="list-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="z. B. Wocheneinkauf"
              className="h-12 text-base"
              required
              disabled={!isAdmin}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="list-notes" className="text-base">Notizen</Label>
            <Textarea
              id="list-notes"
              value={notes ?? ""}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="z. B. Bio bevorzugen…"
              className="min-h-[120px] text-base"
              disabled={!isAdmin}
            />
          </div>

          <div className="flex items-center gap-3">
            <Switch
              id="list-active"
              checked={isActive}
              onCheckedChange={setIsActive}
              disabled={!isAdmin}
            />
            <Label htmlFor="list-active">Aktiv</Label>
          </div>

          {!isAdmin && (
            <p className="text-sm text-muted-foreground">
              Nur Admins dürfen Listen bearbeiten.
            </p>
          )}
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
