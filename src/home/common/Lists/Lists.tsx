import { useNavigate } from "react-router-dom";
import NewShoppingListForm from "./components/NewShoppingListForm";
import { useAuth } from "@/providers/AuthProvider";
import { supabase } from "@/lib/supabaseClient";

export default function Lists() {
  const navigate = useNavigate();
  const { isAdmin, profile } = useAuth();

  const addNewList = async (data: { listname: string; listnote: string }) => {
    const { data: inserted, error } = await supabase
      .from("shopping_lists")
      .insert([{ name: data.listname, notes: data.listnote, managed_by_profile_id: profile?.id  }])
      .select();

      if(error){
        console.log(error);
      }

      if(inserted){
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
