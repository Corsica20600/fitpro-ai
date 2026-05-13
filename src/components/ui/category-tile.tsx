import type { ButtonHTMLAttributes } from "react";

type CategoryTileProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  active?: boolean;
};

export function CategoryTile({ active = false, className = "", ...props }: CategoryTileProps) {
  return <button {...props} className={`category-tile ${active ? "active" : ""} ${className}`.trim()} />;
}
