import React, { useEffect, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export type CatNode = {
  id: number;
  name: string;
  slug?: string;
  parent_id?: number | null;
  hasChildren?: boolean;
  children?: CatNode[];
};

type Props = {
  title?: string;
  fetchAllCategories: () => Promise<CatNode[]>;
  className?: string;
};

export default function CategorySidebar({
  title = 'Khám phá theo danh mục',
  fetchAllCategories,
  className = '',
}: Props) {
  const [categories, setCategories] = useState<CatNode[]>([]);
  const [open, setOpen] = useState<Record<number, boolean>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  // Build tree
  const buildTree = (data: CatNode[]): CatNode[] => {
    const map = new Map<number, CatNode>();
    data.forEach((c) => map.set(c.id, { ...c, children: [] }));
    const tree: CatNode[] = [];
    map.forEach((c) => {
      if (c.parent_id) {
        const parent = map.get(c.parent_id);
        if (parent) {
          parent.children!.push(c);
          parent.hasChildren = true;
        }
      } else {
        tree.push(c);
      }
    });
    return tree;
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const data = await fetchAllCategories();
        if (!cancelled) setCategories(buildTree(data));
      } catch (err) {
        console.error(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fetchAllCategories]);

  const toggle = (node: CatNode) => {
    setOpen((prev) => ({ ...prev, [node.id]: !prev[node.id] }));
  };

  const handleClickNode = (node: CatNode) => {
    if (node.slug) {
      navigate(`/category/${node.slug}`, { state: { title: node.name } });
    }
  };

  const renderNode = (node: CatNode) => (
    <li key={node.id}>
      <div className="flex items-center justify-between px-4 py-2 hover:bg-slate-50 rounded-md">
        <span
          className="text-sm text-slate-800 cursor-pointer"
          onClick={() => handleClickNode(node)}
        >
          {node.name}
        </span>
        {node.hasChildren && (
          <button
            className="ml-2 p-1"
            onClick={(e) => {
              e.stopPropagation(); // không navigate
              toggle(node);
            }}
          >
            <ChevronDown
              className={`h-4 w-4 text-slate-500 transition-transform ${
                open[node.id] ? 'rotate-180' : ''
              }`}
            />
          </button>
        )}
      </div>

      {node.children && open[node.id] && (
        <ul className="pl-6">{node.children.map((c) => renderNode(c))}</ul>
      )}
    </li>
  );

  return (
    <aside
      className={`w-full rounded-2xl bg-white shadow-xl ring-1 ring-slate-200 ${className}`}
      aria-label={title}
    >
      <div className="px-4 py-3 text-sm font-bold text-slate-900">{title}</div>

      {loading ? (
        <ul className="animate-pulse divide-y divide-slate-100">
          {Array.from({ length: 6 }).map((_, i) => (
            <li key={i} className="px-4 py-4">
              <div className="h-3 w-40 rounded bg-slate-200" />
            </li>
          ))}
        </ul>
      ) : (
        <ul className="divide-y divide-slate-100">
          {categories.map((c) => renderNode(c))}
        </ul>
      )}
    </aside>
  );
}
