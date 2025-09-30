import { useNavigate } from "react-router-dom";
import NewShoppingListForm from "./components/NewShoppingListForm";
import { useAuth } from "@/providers/AuthProvider";
import { supabase } from "@/lib/supabaseClient";
import type { Database } from "@/shared/classes/database.types";
import { useState } from "react";

type ShoppingList = Database["public"]["Tables"]["shopping_lists"]["Row"];


export default function Lists() {
  const navigate = useNavigate();
  const { isAdmin, profile } = useAuth();
  const [lists, setLists] = useState<ShoppingList[]>([]);


  const addNewList = async (data: { listname: string; listnote: string }) => {
    const { data: inserted, error } = await supabase
      .from("shopping_lists")
      .insert([
        {
          name: data.listname,
          notes: data.listnote,
          managed_by_profile_id: profile?.id,
        },
      ])
      .select();

    if (error) {
      console.log(error);
    }

    if (inserted) {
      console.log(data);
    }
  };

  return (
    <>
      {isAdmin && (
        <NewShoppingListForm
          onBack={() => navigate(-1)}
          onCancel={() => navigate("/home")}
          onSave={addNewList}
        />
      )}
    </>
  );
}
