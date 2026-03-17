import { useState } from "react";
import { useProjectStore } from "@/stores/projectStore";
import { useToast } from "@/components/Toast";

interface ProjectFormProps {
  onClose: () => void;
}

const COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#ef4444",
  "#f97316", "#eab308", "#22c55e", "#14b8a6",
  "#06b6d4", "#3b82f6", "#64748b", "#a855f7",
];

export function ProjectForm({ onClose }: ProjectFormProps) {
  const [name, setName] = useState("");
  const [color, setColor] = useState(COLORS[0]!);
  const { addProject } = useProjectStore();
  const toast = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      await addProject(name.trim(), color);
      toast.show(`프로젝트 "${name}" 추가됨`, "success");
      onClose();
    } catch (err) {
      toast.show((err as Error).message, "error");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl w-full max-w-sm p-6 shadow-2xl">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">새 프로젝트</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              이름
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="프로젝트 이름"
              className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              색상
            </label>
            <div className="grid grid-cols-6 gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full transition-all ${
                    color === c ? "ring-2 ring-white ring-offset-2 ring-offset-white dark:ring-offset-gray-900 scale-110" : "hover:scale-110"
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              className="flex-1 py-2 bg-primary hover:bg-primary-hover text-white font-semibold rounded-lg transition-colors"
            >
              추가
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-200 rounded-lg transition-colors"
            >
              취소
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
