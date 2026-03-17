import { useState, useRef, useEffect } from "react";
import { useCategoryStore } from "@/stores/categoryStore";
import { useProjectStore } from "@/stores/projectStore";
import { useSecretStore } from "@/stores/secretStore";
import { useToast } from "@/components/Toast";
import type { Project } from "@/types";

const ICON_MAP: Record<string, string> = {
  bot: "🤖", cloud: "☁️", wrench: "🔧", database: "🗄️", folder: "📁",
  key: "🔑", lock: "🔒", globe: "🌐", code: "💻", server: "🖥️",
};

interface SidebarProps {
  onAddCategory?: () => void;
  onAddProject?: () => void;
  onEditProject?: (project: Project) => void;
}

export function Sidebar({ onAddCategory, onAddProject, onEditProject }: SidebarProps) {
  const { categories, selectedCategoryId, selectCategory } = useCategoryStore();
  const { projects, selectedProjectId, selectProject, removeProject } = useProjectStore();
  const { setFilter, counts, filter, fetchSecrets, fetchCounts } = useSecretStore();
  const toast = useToast();

  // 컨텍스트 메뉴 상태
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; project: Project } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    if (contextMenu) {
      document.addEventListener("click", handleClick);
      return () => document.removeEventListener("click", handleClick);
    }
  }, [contextMenu]);

  const handleSelectAll = () => {
    selectCategory(null);
    selectProject(null);
    setFilter({ categoryId: undefined, projectId: undefined, pinnedOnly: undefined });
  };

  const handleSelectPinned = () => {
    selectCategory(null);
    selectProject(null);
    setFilter({ categoryId: undefined, projectId: undefined, pinnedOnly: true });
  };

  const handleSelectCategory = (categoryId: string) => {
    selectCategory(categoryId);
    selectProject(null);
    setFilter({ categoryId, projectId: undefined, pinnedOnly: undefined });
  };

  const handleSelectProject = (projectId: string) => {
    selectProject(projectId);
    selectCategory(null);
    setFilter({ projectId, categoryId: undefined, pinnedOnly: undefined });
  };

  const handleContextMenu = (e: React.MouseEvent, project: Project) => {
    e.preventDefault();
    // 우클릭(button === 2)만 컨텍스트 메뉴 표시
    if (e.button !== 2) return;
    // 화면 경계 보정 (메뉴 크기 약 140x80)
    const x = Math.min(e.clientX, window.innerWidth - 150);
    const y = Math.min(e.clientY, window.innerHeight - 90);
    setContextMenu({ x, y, project });
  };

  const handleEditProject = () => {
    if (contextMenu && onEditProject) {
      onEditProject(contextMenu.project);
    }
    setContextMenu(null);
  };

  const handleDeleteProject = async () => {
    if (!contextMenu) return;
    const proj = contextMenu.project;
    setContextMenu(null);
    try {
      await removeProject(proj.id);
      await fetchSecrets();
      await fetchCounts();
      toast.show(`프로젝트 "${proj.name}" 삭제됨`, "success");
    } catch (err) {
      toast.show((err as Error).message, "error");
    }
  };

  const isAll = !selectedCategoryId && !selectedProjectId && !filter.pinnedOnly;
  const isPinned = !!filter.pinnedOnly;

  const btnClass = (active: boolean) =>
    `w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-sm transition-colors ${
      active
        ? "bg-primary/20 text-primary"
        : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
    }`;

  const Badge = ({ count }: { count: number }) =>
    count > 0 ? (
      <span className="text-[10px] px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-full">
        {count}
      </span>
    ) : null;

  return (
    <aside className="w-48 border-r border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 flex flex-col shrink-0">
      {/* 전체 + 즐겨찾기 */}
      <nav className="px-2 pt-2 space-y-0.5">
        <button onClick={handleSelectAll} className={btnClass(isAll)}>
          <div className="flex items-center gap-2"><span>📋</span><span>전체</span></div>
          <Badge count={counts.total} />
        </button>
        <button onClick={handleSelectPinned} className={btnClass(isPinned)}>
          <div className="flex items-center gap-2"><span>📌</span><span>즐겨찾기</span></div>
          <Badge count={counts.pinned} />
        </button>
      </nav>

      <div className="mx-3 my-2 border-t border-gray-200 dark:border-gray-800" />

      {/* 프로젝트 */}
      <div className="px-3 pb-1">
        <h2 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">프로젝트</h2>
      </div>
      <nav className="px-2 space-y-0.5 mb-2">
        {projects.map((proj) => (
          <button
            key={proj.id}
            onClick={() => handleSelectProject(proj.id)}
            onContextMenu={(e) => handleContextMenu(e, proj)}
            className={btnClass(selectedProjectId === proj.id)}
          >
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: proj.color }} />
              <span className="truncate">{proj.name}</span>
            </div>
            <Badge count={counts.byProject[proj.id] ?? 0} />
          </button>
        ))}
        {onAddProject && (
          <button onClick={onAddProject} className="w-full flex items-center justify-center gap-1 px-3 py-1.5 text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
            + 프로젝트
          </button>
        )}
      </nav>

      <div className="mx-3 border-t border-gray-200 dark:border-gray-800" />

      {/* 카테고리 */}
      <div className="p-3 pb-1">
        <h2 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">카테고리</h2>
      </div>
      <nav className="flex-1 overflow-y-auto px-2 space-y-0.5">
        {categories.map((cat) => (
          <button key={cat.id} onClick={() => handleSelectCategory(cat.id)} className={btnClass(selectedCategoryId === cat.id)}>
            <div className="flex items-center gap-2">
              <span>{ICON_MAP[cat.icon] ?? "📁"}</span>
              <span className="truncate">{cat.name}</span>
            </div>
            <Badge count={counts.byCategory[cat.id] ?? 0} />
          </button>
        ))}
      </nav>

      {onAddCategory && (
        <div className="p-2 border-t border-gray-200 dark:border-gray-800">
          <button onClick={onAddCategory} className="w-full flex items-center justify-center gap-1 px-3 py-2 text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
            + 카테고리
          </button>
        </div>
      )}

      {/* 컨텍스트 메뉴 */}
      {contextMenu && (
        <div
          ref={menuRef}
          className="fixed z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl py-1 min-w-[140px]"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <button
            onClick={handleEditProject}
            className="w-full px-3 py-1.5 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            편집
          </button>
          <button
            onClick={handleDeleteProject}
            className="w-full px-3 py-1.5 text-left text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            삭제
          </button>
        </div>
      )}
    </aside>
  );
}
