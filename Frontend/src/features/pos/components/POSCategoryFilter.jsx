import React from "react";

export default function POSCategoryFilter({
  categories = [],
  selectedCategory = "",
  setSelectedCategory,
}) {
  return (
    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
      <button
        onClick={() => setSelectedCategory("")}
        className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer border ${
          selectedCategory === ""
            ? "bg-primary text-primary-foreground border-primary shadow-sm"
            : "bg-background text-muted-foreground hover:text-foreground border-border hover:bg-secondary"
        }`}
      >
        All Items
      </button>
      {categories.map((cat) => {
        const catId = cat.id || cat._id;
        const isSelected = selectedCategory === catId;
        return (
          <button
            key={catId}
            onClick={() => setSelectedCategory(isSelected ? "" : catId)}
            className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer border ${
              isSelected
                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                : "bg-background text-muted-foreground hover:text-foreground border-border hover:bg-secondary"
            }`}
          >
            {cat.name}
          </button>
        );
      })}
    </div>
  );
}
