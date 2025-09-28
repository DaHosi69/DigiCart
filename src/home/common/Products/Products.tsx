import ProductsCard from "./components/ProductsCard";

export default function Products() {
  const demo = [
    {
      id: "1",
      name: "Bananen",
      subtitle: "Reife Bananen, gelb",
      pricePrimary: "1,99 €",
      priceSecondary: "· 1kg",
      category: "Obst",
    },
    {
      id: "2",
      name: "Hafermilch",
      subtitle: "Barista-Edition",
      pricePrimary: "2,49 €",
      priceSecondary: "· 1L",
      category: "Getränke",
    },
    {
      id: "3",
      name: "Pasta Penne",
      subtitle: "500g Packung",
      pricePrimary: "1,29 €",
      priceSecondary: "· 500g",
      category: "Trockenware",
    },
  ];

  return (
    <ProductsCard
      products={demo}
      onOpen={(id) => console.log("open", id)}
      onDelete={(id) => console.log("delete", id)}
    />
  );
}
