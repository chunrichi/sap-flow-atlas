import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/cn";

export type BreadcrumbItem = {
  label: string;
  to?: string;
};

export function Breadcrumbs({ items, className }: { items: BreadcrumbItem[]; className?: string }) {
  return (
    <nav aria-label="面包屑" className={cn("flex min-w-0 items-center gap-1.5 text-[13px]", className)}>
      {items.map((item, index) => {
        const last = index === items.length - 1;
        return (
          <span key={`${item.label}-${index}`} className="flex min-w-0 items-center gap-1.5">
            {index > 0 ? <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-300" /> : null}
            {item.to && !last ? (
              <Link
                to={item.to}
                className="truncate text-slate-500 transition-colors hover:text-slate-900"
              >
                {item.label}
              </Link>
            ) : (
              <span className={cn("truncate", last ? "font-medium text-slate-900" : "text-slate-500")}>
                {item.label}
              </span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
