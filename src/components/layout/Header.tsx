import { Command, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { Breadcrumbs, type BreadcrumbItem } from "./Breadcrumbs";

export function Header({
  breadcrumbs,
  onSearch,
}: {
  breadcrumbs: BreadcrumbItem[];
  onSearch: () => void;
}) {
  return (
    <header className="relative z-30 flex h-16 shrink-0 items-center gap-4 border-b border-slate-200/80 bg-white/90 px-4 backdrop-blur-xl md:px-6">
      <Link to="/" className="group flex shrink-0 items-center gap-3" aria-label="返回系统全景">
        <span
          className="grid h-9 w-9 place-items-center rounded-xl text-[10px] font-bold tracking-[0.08em] text-white shadow-[0_8px_20px_-8px_rgba(37,99,235,0.8)]"
          style={{ background: "linear-gradient(135deg, #2563eb 0%, #0ea5e9 100%)" }}
        >
          SAP
        </span>
        <span className="flex min-w-0 flex-col leading-tight">
          <span className="text-[14px] font-semibold tracking-tight text-slate-900">Flow Atlas</span>
          <span className="hidden text-[10px] font-medium tracking-[0.14em] text-slate-400 sm:block">SAP 业务流程图谱</span>
        </span>
      </Link>

      <span className="hidden h-6 w-px bg-slate-200 md:block" />
      <Breadcrumbs items={breadcrumbs} className="hidden min-w-0 flex-1 md:flex" />
      <div className="flex-1 md:hidden" />

      <button
        type="button"
        onClick={onSearch}
        className="group flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-[12px] text-slate-500 shadow-sm transition-all hover:border-slate-300 hover:text-slate-800"
        aria-label="搜索模块、流程、步骤与开发对象"
      >
        <Search className="h-3.5 w-3.5 text-slate-400 group-hover:text-slate-600" />
        <span className="hidden sm:inline">搜索知识库</span>
        <kbd className="ml-1 hidden items-center gap-0.5 rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-mono text-[10px] text-slate-400 sm:flex">
          <Command className="h-2.5 w-2.5" />K
        </kbd>
      </button>
    </header>
  );
}
