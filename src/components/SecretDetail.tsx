import { useState, useEffect, useRef } from "react";
import { useSecretStore } from "@/stores/secretStore";
import { useCategoryStore } from "@/stores/categoryStore";
import { useProjectStore } from "@/stores/projectStore";

interface SecretDetailProps {
  onEdit: () => void;
  clipboardClearSeconds?: number;
}

export function SecretDetail({ onEdit, clipboardClearSeconds = 30 }: SecretDetailProps) {
  const { selectedSecret, removeSecret, copySecret, togglePin } = useSecretStore();
  const { categories } = useCategoryStore();
  const { projects } = useProjectStore();
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    setRevealed(false);
    setCopied(false);
  }, [selectedSecret?.id]);

  if (!selectedSecret) return null;

  const category = categories.find((c) => c.id === selectedSecret.categoryId);
  const project = projects.find((p) => p.id === selectedSecret.projectId);

  const handleCopy = async () => {
    await copySecret(selectedSecret.id, clipboardClearSeconds);
    setCopied(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setCopied(false), 2000);
  };

  const handleDelete = async () => {
    if (confirm(`"${selectedSecret.name}" 을 삭제하시겠습니까?`)) {
      await removeSecret(selectedSecret.id);
    }
  };

  const envLabel: Record<string, string> = { dev: "Development", staging: "Staging", prod: "Production" };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">{selectedSecret.name}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{selectedSecret.service}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => togglePin(selectedSecret.id)}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              selectedSecret.pinned
                ? "bg-yellow-50 dark:bg-yellow-500/20 text-yellow-600 dark:text-yellow-400"
                : "bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200"
            }`}
            title={selectedSecret.pinned ? "즐겨찾기 해제" : "즐겨찾기"}
          >
            {selectedSecret.pinned ? "📌" : "📍"}
          </button>
          <button onClick={onEdit} className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg transition-colors">편집</button>
          <button onClick={handleDelete} className="px-3 py-1.5 text-sm bg-red-50 dark:bg-danger/20 hover:bg-red-100 dark:hover:bg-danger/30 text-danger rounded-lg transition-colors">삭제</button>
        </div>
      </div>

      {/* 시크릿 값 */}
      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Secret Value</span>
          <div className="flex gap-2">
            <button onClick={() => setRevealed(!revealed)} className="text-xs px-2 py-1 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 rounded transition-colors">
              {revealed ? "🙈 숨기기" : "👁 보기"}
            </button>
            <button onClick={handleCopy} className={`text-xs px-2 py-1 rounded transition-colors ${copied ? "bg-green-100 dark:bg-success/20 text-success" : "bg-indigo-50 dark:bg-primary/20 hover:bg-indigo-100 dark:hover:bg-primary/30 text-primary"}`}>
              {copied ? "✓ 복사됨" : "📋 복사"}
            </button>
          </div>
        </div>
        <code className="block text-sm text-gray-800 dark:text-gray-200 break-all font-mono">
          {revealed ? selectedSecret.secretValue : "••••••••••••••••••••••••"}
        </code>
        {copied && clipboardClearSeconds > 0 && <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">{clipboardClearSeconds}초 후 클립보드에서 자동 삭제됩니다</p>}
      </div>

      {/* 메타 정보 */}
      <div className="grid grid-cols-2 gap-4">
        {project && (
          <div>
            <span className="text-xs text-gray-400 dark:text-gray-500">프로젝트</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: project.color }} />
              <p className="text-sm text-gray-800 dark:text-gray-200">{project.name}</p>
            </div>
          </div>
        )}
        {category && (
          <div>
            <span className="text-xs text-gray-400 dark:text-gray-500">카테고리</span>
            <p className="text-sm text-gray-800 dark:text-gray-200 mt-0.5">{category.name}</p>
          </div>
        )}
        {selectedSecret.environment && (
          <div>
            <span className="text-xs text-gray-400 dark:text-gray-500">환경</span>
            <p className="text-sm text-gray-800 dark:text-gray-200 mt-0.5">{envLabel[selectedSecret.environment] ?? selectedSecret.environment}</p>
          </div>
        )}
      </div>

      {/* 태그 */}
      {selectedSecret.tags.length > 0 && (
        <div>
          <span className="text-xs text-gray-400 dark:text-gray-500">태그</span>
          <div className="flex gap-1.5 mt-1 flex-wrap">
            {selectedSecret.tags.map((tag) => (
              <span key={tag} className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-full">#{tag}</span>
            ))}
          </div>
        </div>
      )}

      {/* 메모 */}
      {selectedSecret.notes && (
        <div>
          <span className="text-xs text-gray-400 dark:text-gray-500">메모</span>
          <p className="text-sm text-gray-700 dark:text-gray-300 mt-1 whitespace-pre-wrap">{selectedSecret.notes}</p>
        </div>
      )}

      <div className="text-xs text-gray-400 dark:text-gray-600 pt-4 border-t border-gray-200 dark:border-gray-800">
        생성: {new Date(selectedSecret.createdAt).toLocaleString("ko-KR")} · 수정: {new Date(selectedSecret.updatedAt).toLocaleString("ko-KR")}
      </div>
    </div>
  );
}
