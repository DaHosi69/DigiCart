import { ShoppingCart } from "lucide-react";

type Props = { activeListName: string };

export default function Toolbar({ activeListName }: Props) {
  return (
    <div className="mb-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {activeListName ? (
            <>
              <h1 className="text-2xl font-semibold">
                Einkauf: {activeListName}
              </h1>
              <ShoppingCart className="h-4 w-4 opacity-70" />
            </>
          ) : (
            <h1 className="text-2xl font-semibold">
              Keine Einkaufsliste ausgewählt
            </h1>
          )}
        </div>
       
      </div>
    </div>
  );
}
