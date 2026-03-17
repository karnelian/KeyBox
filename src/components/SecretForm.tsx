import { useState, useEffect } from "react";
import { useSecretStore } from "@/stores/secretStore";
import { useCategoryStore } from "@/stores/categoryStore";
import { useProjectStore } from "@/stores/projectStore";
import type { CreateSecretInput } from "@/types";

interface SecretFormProps {
  editMode: boolean;
  onClose: () => void;
}

const ENVIRONMENTS = [
  { value: "", label: "없음" },
  { value: "dev", label: "Development" },
  { value: "staging", label: "Staging" },
  { value: "prod", label: "Production" },
] as const;

export function SecretForm({ editMode, onClose }: SecretFormProps) {
  const { selectedSecret, addSecret, editSecret, fetchSecrets } =
    useSecretStore();
  const { categories } = useCategoryStore();
  const { projects } = useProjectStore();
  const [tagInput, setTagInput] = useState("");
  const [form, setForm] = useState<CreateSecretInput>({
    name: "",
    secretValue: "",
    service: "",
    categoryId: null,
    projectId: null,
    tags: [],
    notes: "",
    environment: "",
  });

  useEffect(() => {
    if (editMode && selectedSecret) {
      setForm({
        name: selectedSecret.name,
        secretValue: selectedSecret.secretValue,
        service: selectedSecret.service,
        categoryId: selectedSecret.categoryId,
        projectId: selectedSecret.projectId,
        tags: selectedSecret.tags,
        notes: selectedSecret.notes,
        environment: selectedSecret.environment,
      });
    }
  }, [editMode, selectedSecret]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.secretValue.trim()) return;

    if (editMode && selectedSecret) {
      await editSecret({ id: selectedSecret.id, ...form });
    } else {
      await addSecret(form);
    }
    await fetchSecrets();
    onClose();
  };

  const handleAddTag = () => {
    const tag = tagInput.trim().replace(/^#/, "");
    if (tag && !form.tags.includes(tag)) {
      setForm({ ...form, tags: [...form.tags, tag] });
    }
    setTagInput("");
  };

  const handleRemoveTag = (tag: string) => {
    setForm({ ...form, tags: form.tags.filter((t) => t !== tag) });
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">
          {editMode ? "시크릿 편집" : "새 시크릿"}
        </h2>
        <button
          onClick={onClose}
          className="text-gray-500 dark:text-gray-400 hover:text-gray-200 text-xl"
        >
          ✕
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 이름 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            이름 *
          </label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="예: OpenAI API Key"
            className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary"
            autoFocus
          />
        </div>

        {/* 시크릿 값 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            시크릿 값 *
          </label>
          <textarea
            value={form.secretValue}
            onChange={(e) =>
              setForm({ ...form, secretValue: e.target.value })
            }
            placeholder="API 키 또는 토큰 입력"
            rows={3}
            className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary font-mono"
          />
        </div>

        {/* 서비스 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            서비스명
          </label>
          <input
            type="text"
            value={form.service}
            onChange={(e) => setForm({ ...form, service: e.target.value })}
            placeholder="예: OpenAI, AWS, GitHub"
            className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* 프로젝트 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            프로젝트
          </label>
          <select
            value={form.projectId ?? ""}
            onChange={(e) =>
              setForm({ ...form, projectId: e.target.value || null })
            }
            className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">없음</option>
            {projects.map((proj) => (
              <option key={proj.id} value={proj.id}>
                {proj.name}
              </option>
            ))}
          </select>
        </div>

        {/* 카테고리 + 환경 */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              카테고리
            </label>
            <select
              value={form.categoryId ?? ""}
              onChange={(e) =>
                setForm({
                  ...form,
                  categoryId: e.target.value || null,
                })
              }
              className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">없음</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              환경
            </label>
            <select
              value={form.environment}
              onChange={(e) =>
                setForm({
                  ...form,
                  environment: e.target.value as CreateSecretInput["environment"],
                })
              }
              className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {ENVIRONMENTS.map((env) => (
                <option key={env.value} value={env.value}>
                  {env.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 태그 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            태그
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
              placeholder="#태그 입력 후 Enter"
              className="flex-1 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              type="button"
              onClick={handleAddTag}
              className="px-3 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm rounded-lg transition-colors"
            >
              추가
            </button>
          </div>
          {form.tags.length > 0 && (
            <div className="flex gap-1.5 mt-2 flex-wrap">
              {form.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full"
                >
                  #{tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* 메모 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            메모
          </label>
          <textarea
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            placeholder="추가 메모 (선택)"
            rows={2}
            className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* 버튼 */}
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            className="flex-1 py-2.5 bg-primary hover:bg-primary-hover text-white font-semibold rounded-lg transition-colors"
          >
            {editMode ? "저장" : "추가"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-200 rounded-lg transition-colors"
          >
            취소
          </button>
        </div>
      </form>
    </div>
  );
}
