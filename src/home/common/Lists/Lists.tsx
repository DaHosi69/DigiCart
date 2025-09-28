import { useNavigate } from "react-router-dom";
import NewShoppingListForm from "./components/NewShoppingListForm";

export default function Lists() {
    const navigate = useNavigate();

  return (
    <NewShoppingListForm
      onBack={() => navigate(-1)}
      onCancel={() => navigate("/home")}
      onSave={(data) => console.log(data)}
    />
  );
}
