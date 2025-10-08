import { useState } from "react";
import { ArrowLeft, Save, X } from "lucide-react";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

type NewListFormProps = {
  defaultName?: string;
  defaultNote?: string;
  onBack?: () => void;
  onCancel?: () => void;
  onSave?: (data: { listname: string; listnote: string }) => void | Promise<void>;
};

export default function NewShoppingListForm({
  defaultName = "",
  defaultNote = "",
  onBack,
  onCancel,
  onSave,
}: NewListFormProps) {
  const [name, setName] = useState(defaultName);
  const [note, setNote] = useState(defaultNote);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave?.({ listname: name.trim(), listnote: note.trim() });
  };

  return (
    <div className="w-full ">
      <Card className="rounded-2xl shadow-sm">
        <form onSubmit={handleSubmit}>
          <CardHeader className="space-y-4">
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-full"
                onClick={onBack}
                aria-label="Zurück"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>

              <CardTitle className="text-2xl font-semibold">
                Neue Einkaufsliste
              </CardTitle>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="list-name" className="text-base">
                Name der Liste
              </Label>
              <Input
                id="list-name"
                placeholder="z. B. Wocheneinkauf"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-12 text-base"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="list-note" className="text-base">
                Beschreibung / Notiz
              </Label>
              <Textarea
                id="list-note"
                placeholder="z. B. Bio-Produkte bevorzugen…"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="min-h-[120px] text-base"
              />
            </div>
          </CardContent>

          <CardFooter className="flex justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={onCancel}
              className="gap-2"
            >
              <X className="h-4 w-4" />
              Abbrechen
            </Button>

            <Button type="submit" className="gap-2">
              <Save className="h-4 w-4" />
              Speichern
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
