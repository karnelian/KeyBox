import { useState } from "react";
import { useCategoryStore } from "@/stores/categoryStore";
import { useToast } from "@/components/Toast";

interface CategoryFormProps {
  onClose: () => void;
}

const ICONS = [
  { value: "folder", label: "📁 폴더" },
  { value: "bot", label: "🤖 AI" },
  { value: "cloud", label: "☁️ 클라우드" },
  { value: "wrench", label: "🔧 도구" },
  { value: "database", label: "🗄️ DB" },
  { value: "key", label: "🔑 키" },
  { value: "globe", label: "🌐 웹" },
  { value: "code", label: "💻 코드" },
  { value: "server", label: "🖥️ 서버" },
  { value: "lock", label: "🔒 보안" },
];

export function CategoryForm({ onClose }: CategoryFormProps) {
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("folder");
  const { addCategory } = useCategoryStore();
  const toast = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      await addCategory(name.trim(), icon);
      toast.show(`카테고리 "${name}" 추가됨`, "success");
      onClose();
    } catch (err) {
      toast.show((err as Error).message, "error");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl w-full max-w-sm p-6 shadow-2xl">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">새 카테고리</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              이름
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="카테고리 이름"
              className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              아이콘
            </label>
            <div className="grid grid-cols-5 gap-2">
              {ICONS.map((ic) => (
                <button
                  key={ic.value}
                  type="button"
                  onClick={() => setIcon(ic.value)}
                  className={`p-2 rounded-lg text-center text-sm transition-colors ${
                    icon === ic.value
                      ? "bg-primary/20 ring-2 ring-primary"
                      : "bg-white dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700"
                  }`}
                  title={ic.label}
                >
                  {ic.label.split(" ")[0]}
                </button>
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
