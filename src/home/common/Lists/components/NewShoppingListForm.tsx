import { useState } from "react";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

type NewListFormProps = {
  defaultName?: string;
  defaultNote?: string;
  onSave?: (data: {
    listname: string;
    listnote: string;
  }) => void | Promise<void>;
};

export default function NewShoppingListForm({
  defaultName = "",
  defaultNote = "",
  onSave,
}: NewListFormProps) {
  const [name, setName] = useState(defaultName);
  const [note, setNote] = useState(defaultNote);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave?.({ listname: name.trim(), listnote: note.trim() });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 py-4">
      <div className="space-y-2">
        <Label htmlFor="list-name">Name der Liste</Label>
        <Input
          id="list-name"
          placeholder="z. B. Wocheneinkauf"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="list-note">Beschreibung / Notiz</Label>
        <Textarea
          id="list-note"
          placeholder="z. B. Bio-Produkte bevorzugen…"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="min-h-[100px] resize-none"
        />
      </div>

      <div className="flex justify-end pt-2">
        <Button type="submit" className="gap-2">
          <Save className="h-4 w-4" /> Speichern
        </Button>
      </div>
    </form>
  );
}
