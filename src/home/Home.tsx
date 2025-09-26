import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Home() {
  return (
   <div className="max-w-7xl mx-auto p-4 lg:p-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold">Einkauf</h1>
          <Badge variant="secondary">Liste: Wocheneinkauf</Badge>
        </div>
        <div className="flex items-center gap-2">
          {/* share/settings/theme etc. */}
          <Button variant="ghost" size="icon">Share</Button>
          <Button variant="ghost" size="icon">Settings</Button>
          <Switch /* darkmode */ />
        </div>
      </div>

      {/* Suche + Filter */}
      <div className="mt-4 flex items-center gap-2">
        <div className="relative flex-1">
          <Input placeholder="Suchen oder hinzufügen…" className="pl-9" />
          <div className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
        </div>
        <div /> {/* Sheet/Popover mit Optionen */}
      </div>

      {/* Grid */}
      <div className="mt-4 grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-4 lg:gap-6">
        {/* Linke Spalte: Tabs + Liste */}
        <Card className="overflow-hidden">
          <div className="p-2">
            <Tabs defaultValue="open" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="open">Offen</TabsTrigger>
                <TabsTrigger value="done">Erledigt</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <CardContent className="p-0">
            <ScrollArea className="h-[520px]">
              <div className="divide-y">
                hier kommen die items hin
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Rechte Spalte */}
        <div className="space-y-4">
       cards
        </div>
      </div>
    </div>

  );
}

