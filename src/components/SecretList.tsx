import { useSecretStore } from "@/stores/secretStore";
import { useCategoryStore } from "@/stores/categoryStore";
import { useProjectStore } from "@/stores/projectStore";

export function SecretList() {
  const { secrets, selectedSecret, selectSecret, loading } = useSecretStore();
  const { categories } = useCategoryStore();
  const { projects } = useProjectStore();

  const getCategoryName = (categoryId: string | null) => {
    if (!categoryId) return "";
    return categories.find((c) => c.id === categoryId)?.name ?? "";
  };

  const getProjectColor = (projectId: string | null) => {
    if (!projectId) return null;
    return projects.find((p) => p.id === projectId)?.color ?? null;
  };

  const getEnvBadge = (env: string) => {
    const colors: Record<string, string> = {
      prod: "bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400",
      staging: "bg-yellow-100 dark:bg-yellow-500/20 text-yellow-600 dark:text-yellow-400",
      dev: "bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400",
    };
    return env ? colors[env] ?? "" : "";
  };

  if (loading) {
    return (
      <div className="w-72 border-r border-gray-200 dark:border-gray-800 flex items-center justify-center text-gray-400 dark:text-gray-500">
        로딩 중...
      </div>
    );
  }

  return (
    <div className="w-72 border-r border-gray-200 dark:border-gray-800 flex flex-col shrink-0">
      <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-800 text-xs text-gray-400 dark:text-gray-500">
        {secrets.length}개의 시크릿
      </div>

      <div className="flex-1 overflow-y-auto">
        {secrets.length === 0 ? (
          <div className="p-4 text-center text-gray-400 dark:text-gray-600 text-sm">
            시크릿이 없습니다
          </div>
        ) : (
          secrets.map((item) => {
            const projColor = getProjectColor(item.projectId);
            return (
              <button
                key={item.id}
                onClick={() => selectSecret(item.id)}
                className={`w-full text-left px-3 py-3 border-b border-gray-100 dark:border-gray-800/50 transition-colors ${
                  selectedSecret?.id === item.id
                    ? "bg-primary/10 border-l-2 border-l-primary"
                    : "hover:bg-gray-50 dark:hover:bg-gray-800/50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 min-w-0">
                    {item.pinned && (
                      <span className="text-yellow-500 text-xs shrink-0" title="즐겨찾기">📌</span>
                    )}
                    {projColor && (
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: projColor }} />
                    )}
                    <span className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                      {item.name}
                    </span>
                  </div>
                  {item.environment && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium shrink-0 ml-1 ${getEnvBadge(item.environment)}`}>
                      {item.environment}
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 truncate">
                  {item.service}
                  {getCategoryName(item.categoryId) && ` · ${getCategoryName(item.categoryId)}`}
                </div>
                {item.tags.length > 0 && (
                  <div className="flex gap-1 mt-1 flex-wrap">
                    {item.tags.slice(0, 3).map((tag) => (
                      <span key={tag} className="text-[10px] px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
