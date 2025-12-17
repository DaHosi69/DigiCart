
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Loader2, Plus, Edit2, Wallet, Coins, Check, Users, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

type DebtItem = {
  id: string; // or number, assuming uuid or int
  name: string;
  amount: number;
  created_at?: string;
  list_id?: string;
  payer_name?: string;
};

type GroupedDebt = {
  name: string;
  total: number;
  count: number;
  items: DebtItem[];
};

function DebtList({ 
  debts, 
  loading, 
  error, 
  onEdit, 
  onDelete, 
  currency 
}: { 
  debts: DebtItem[]; 
  loading: boolean; 
  error: string | null; 
  onEdit: (item: DebtItem) => void; 
  onDelete: (item: DebtItem) => void;
  currency: string;
}) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const toggleExpand = (name: string) => {
    setExpanded(prev => ({ ...prev, [name]: !prev[name] }));
  };

  const grouped = useMemo(() => {
    const map = new Map<string, GroupedDebt>();
    for (const d of debts) {
      if (!map.has(d.name)) {
        map.set(d.name, { name: d.name, total: 0, count: 0, items: [] });
      }
      const g = map.get(d.name)!;
      g.total += d.amount;
      g.count += 1;
      g.items.push(d);
    }
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [debts]);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin mr-2" /> Laden...
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
         <CardContent>
            <div className="text-red-500 p-4 border border-red-200 rounded bg-red-50">{error}</div>
         </CardContent>
      </Card>
    );
  }

  if (debts.length === 0) {
    return (
      <Card>
        <CardContent>
            <div className="text-center py-10 text-muted-foreground">
              Keine Einträge gefunden.
            </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Offene Posten</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {grouped.map(group => {
            const isExpanded = !!expanded[group.name];
            
            // Single Item -> Render directly
            if (group.count === 1) {
                return (
                    <DebtRow 
                        key={group.items[0].id} 
                        item={group.items[0]} 
                        currency={currency} 
                        onEdit={onEdit} 
                        onDelete={onDelete} 
                    />
                );
            }

            // Multiple Items -> Render Group
            return (
                <div key={group.name} className="border rounded-lg overflow-hidden">
                    {/* Group Header */}
                    <div 
                        className="flex items-center justify-between p-3 bg-muted/30 hover:bg-muted/50 cursor-pointer transition-colors"
                        onClick={() => toggleExpand(group.name)}
                    >
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                <Users className="h-5 w-5" />
                            </div>
                            <div>
                                <div className="font-medium">{group.name}</div>
                                <div className="text-xs text-muted-foreground">{group.count} Einträge</div>
                            </div>
                        </div>
                        
                        <div className="flex items-center sm:gap-4">
                             <div className="text-sm sm:text-lg font-bold tabular-nums">
                                {group.total.toFixed(2)} {currency}
                            </div>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </Button>
                        </div>
                    </div>

                    {/* Group Items */}
                    {isExpanded && (
                        <div className="divide-y border-t bg-background/50">
                            {group.items.map(item => (
                                <div key={item.id} className="pl-4 sm:pl-8"> 
                                    <DebtRow 
                                        item={item} 
                                        currency={currency} 
                                        onEdit={onEdit} 
                                        onDelete={onDelete} 
                                        isChild
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            );
        })}
      </CardContent>
    </Card>
  );
}

function DebtRow({ item, currency, onEdit, onDelete, isChild }: { item: DebtItem, currency: string, onEdit: (i: DebtItem) => void, onDelete: (i: DebtItem) => void, isChild?: boolean }) {
    return (
        <div className={cn(
            "group flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors gap-3",
            !isChild && "border"
        )}>
            <div className="flex items-center gap-3 w-full sm:w-auto">
                {!isChild && (
                    <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center text-lg font-bold text-muted-foreground shrink-0">
                    {item.name.charAt(0).toUpperCase()}
                    </div>
                )}
                <div className="min-w-0">
                    <div className={cn("font-medium truncate", isChild && "text-sm")}>{isChild ? item.created_at?.substring(0, 10) ?? "Eintrag" : item.name}</div>
                    {isChild && <div className="text-xs text-muted-foreground">Einzelposten</div>}
                </div>
            </div>

            <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
            <div className={cn("font-bold tabular-nums", isChild ? "text-base" : "text-sm sm:text-lg")}>
                {item.amount.toFixed(2)} {currency}
            </div>
            <div className="flex items-center gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                {!item.list_id && (
                  <Button variant="ghost" size="icon" onClick={() => onEdit(item)} title="Bearbeiten">
                    <Edit2 className="h-4 w-4" />
                  </Button>
                )}
                <Button variant="ghost" size="icon" onClick={() => onDelete(item)} className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30" title="Als bezahlt markieren (Löschen)">
                    <Check className="h-4 w-4" />
                </Button>
            </div>
            </div>
        </div>
    );
}

export default function Debt() {
  const [debts, setDebts] = useState<DebtItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // Sheet State
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<DebtItem | null>(null);
  
  // Form State
  const [formName, setFormName] = useState("");
  const [formAmount, setFormAmount] = useState("");
  const [saving, setSaving] = useState(false);

  // Filter
  const [filter, setFilter] = useState("");

  useEffect(() => {
    loadDebts();
  }, []);

  const loadDebts = async () => {
    setLoading(true);
    setErr(null);
    const { data, error } = await supabase
      .from("debts")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      setErr(error.message);
    } else {
      setDebts((data as any[])?.map(d => ({
        ...d,
        amount: Number(d.amount) // Ensure number
      })) ?? []);
    }
    setLoading(false);
  };

  const totalDebt = useMemo(() => {
    return debts.reduce((acc, curr) => acc + (curr.amount || 0), 0);
  }, [debts]);

  const filteredDebts = useMemo(() => {
    if (!filter) return debts;
    const lower = filter.toLowerCase();
    return debts.filter(d => d.name.toLowerCase().includes(lower));
  }, [debts, filter]);

  // Handle Sheet Actions
  const openNew = () => {
    setEditingItem(null);
    setFormName("");
    setFormAmount("");
    setIsSheetOpen(true);
  };

  const openEdit = (item: DebtItem) => {
    setEditingItem(item);
    setFormName(item.name);
    setFormAmount(String(item.amount));
    setIsSheetOpen(true);
  };

  const activeCurrency = "EUR"; // Assuming EUR default 

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const payload = {
      name: formName,
      amount: parseFloat(formAmount.replace(",", ".")) || 0,
    };

    try {
      if (editingItem) {
        // UPDATE
        const { error } = await supabase
          .from("debts")
          .update(payload)
          .eq("id", editingItem.id);
        if (error) throw error;
      } else {
        // INSERT
        const { error } = await supabase
          .from("debts")
          .insert([payload]);
        if (error) throw error;
      }
      
      // Reload and Close
      await loadDebts();
      setIsSheetOpen(false);
    } catch (error: any) {
      alert("Fehler beim Speichern: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item: DebtItem) => {
    if (window.confirm(`Schulden von "${item.name}" wirklich als beglichen markieren (löschen)?`)) {
      try {
        // Sync back to Billings if linked
        if (item.list_id && item.payer_name) {
             const { error: syncError } = await supabase
            .from("billing_flags")
            .update({ is_debt: false }) // Keep paid=true, but remove debt flag
            .eq("list_id", item.list_id)
            .eq("payer_name", item.payer_name);

            if (syncError) {
                console.error("Failed to sync debt status back to billings", syncError);
                // We continue deleting the debt anyway
            }
        }

        const { error } = await supabase
          .from("debts")
          .delete()
          .eq("id", item.id);
        
        if (error) throw error;
        // Optimistic remove or reload
        setDebts(prev => prev.filter(d => d.id !== item.id));
      } catch (error: any) {
        alert("Fehler beim Löschen: " + error.message);
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 lg:p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Wallet className="h-6 w-6 text-rose-500" />
            Schulden-Manager
          </h1>
          <p className="text-sm text-muted-foreground">
            Verwalte offene Beträge.
          </p>
        </div>
        <Button onClick={openNew} className="gap-2">
          <Plus className="h-4 w-4" /> Neuer Eintrag
        </Button>
      </div>

      {/* Overview Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-rose-100 dark:bg-rose-900/30 rounded-full">
              <Coins className="h-8 w-8 text-rose-600 dark:text-rose-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Gesamtschulden</p>
              <h2 className="text-3xl font-bold tabular-nums text-rose-600 dark:text-rose-400">
                {totalDebt.toFixed(2)} {activeCurrency}
              </h2>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Group Logic */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="w-full">
              <Input 
                placeholder="Name suchen..." 
                value={filter}
                onChange={e => setFilter(e.target.value)}
              />
            </div>
        </div>

      <DebtList 
        debts={filteredDebts} 
        loading={loading} 
        error={err} 
        onEdit={openEdit} 
        onDelete={handleDelete}
        currency={activeCurrency}
      />

      {/* Edit/Create Sheet */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>{editingItem ? "Eintrag bearbeiten" : "Neuer Eintrag"}</SheetTitle>
          </SheetHeader>
          <form onSubmit={handleSave} className="space-y-6 mt-6">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input 
                id="name" 
                value={formName} 
                onChange={e => setFormName(e.target.value)} 
                placeholder="z.B. Max Mustermann" 
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Betrag</Label>
              <Input 
                id="amount" 
                type="number"
                step="0.01" 
                value={formAmount} 
                onChange={e => setFormAmount(e.target.value)} 
                placeholder="0.00" 
                required 
              />
            </div>
            
            <div className="flex gap-2 justify-end pt-4">
              <Button type="button" variant="outline" onClick={() => setIsSheetOpen(false)}>Abbrechen</Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Speichern
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
