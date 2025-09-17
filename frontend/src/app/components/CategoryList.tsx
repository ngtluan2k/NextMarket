import React, { useEffect, useState } from "react";

export interface Category {
  id: number;
  name: string;
  slug: string;
  image?: string | null;
}

const CategoryList: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
  const token = localStorage.getItem("token"); // hoặc từ context/useAuth
  fetch("http://localhost:3000/categories", {
  })
    .then(res => {
      if (!res.ok) throw new Error("HTTP error " + res.status);
      return res.json();
    })
    .then(json => setCategories(json.data || []))
    .catch(err => console.error(err));
}, []);

  return (
    <ul className="space-y-2">
      {categories.map(c => (
        <li key={c.id}>
          <a href="#" className="block px-3 py-2 rounded hover:bg-cyan-50">
            {c.name}
          </a>
        </li>
      ))}
    </ul>
  );
};

export default CategoryList;
