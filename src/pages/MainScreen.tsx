import { useEffect, useState, useCallback } from "react";
import { useSecretStore } from "@/stores/secretStore";
import { useCategoryStore } from "@/stores/categoryStore";
import { useAuthStore } from "@/stores/authStore";
import { Sidebar } from "@/components/Sidebar";
import { SecretList } from "@/components/SecretList";
import { SecretDetail } from "@/components/SecretDetail";
import { SecretForm } from "@/components/SecretForm";
import { SearchBar } from "@/components/SearchBar";
import { SettingsModal } from "@/components/SettingsModal";
import { CategoryForm } from "@/components/CategoryForm";
import { ProjectForm } from "@/components/ProjectForm";
import { ToastContainer } from "@/components/Toast";
import { useAutoLock } from "@/lib/useAutoLock";
import { useProjectStore } from "@/stores/projectStore";
import { useToast } from "@/components/Toast";
import * as commands from "@/lib/commands";
import type { AppConfig, Project } from "@/types";

const isTauri = typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

export function MainScreen() {
  const { fetchSecrets, fetchCounts, selectedSecret, clearSelection } = useSecretStore();
  const { fetchCategories } = useCategoryStore();
  const { fetchProjects } = useProjectStore();
  const { lock } = useAuthStore();
  const [showForm, setShowForm] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | undefined>(undefined);

  // 설정 상태
  const [autoLockMinutes, setAutoLockMinutes] = useState(5);
  const [clipboardClearSeconds, setClipboardClearSeconds] = useState(30);
  const [theme, setTheme] = useState<AppConfig["theme"]>("dark");
  // 설정 로드 (최초 1회)
  useEffect(() => {
    commands.loadSettings().then((s) => {
      if (s) {
        if (typeof s.autoLockMinutes === "number") setAutoLockMinutes(s.autoLockMinutes);
        if (typeof s.clipboardClearSeconds === "number") setClipboardClearSeconds(s.clipboardClearSeconds);
        if (s.theme === "light" || s.theme === "dark" || s.theme === "system") setTheme(s.theme);
      }
    });
  }, []);

  // 테마 적용
  useEffect(() => {
    const html = document.documentElement;
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const isDark = theme === "dark" || (theme === "system" && prefersDark);
    html.classList.toggle("dark", isDark);
  }, [theme]);

  useAutoLock(autoLockMinutes);

  // 트레이 잠금 이벤트 수신 (X 버튼 → 트레이 최소화 시 자동 잠금)
  useEffect(() => {
    if (!isTauri) return;
    let unlisten: (() => void) | undefined;
    (async () => {
      const { listen } = await import("@tauri-apps/api/event");
      unlisten = await listen("tray-lock", () => {
        lock();
      });
    })();
    return () => { unlisten?.(); };
  }, [lock]);

  useEffect(() => {
    fetchCategories();
    fetchProjects();
    fetchSecrets();
    fetchCounts();
  }, [fetchCategories, fetchProjects, fetchSecrets, fetchCounts]);

  const handleAdd = useCallback(() => {
    setEditMode(false);
    setShowForm(true);
  }, []);

  const handleEdit = () => {
    setEditMode(true);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditMode(false);
  };

  const toast = useToast();
  const { selectedProjectId } = useProjectStore();

  const handleImportEnv = useCallback(async () => {
    if (!isTauri) {
      toast.show("브라우저 모드에서는 .env 가져오기를 사용할 수 없습니다", "error");
      return;
    }
    try {
      const { open } = await import("@tauri-apps/plugin-dialog");
      const path = await open({
        title: ".env 파일 선택",
        filters: [
          { name: "Env Files", extensions: ["env", "env.local", "env.development", "env.production"] },
          { name: "All Files", extensions: ["*"] },
        ],
      });
      if (!path) return; // 취소
      const result = await commands.importEnvFile(
        path as string,
        selectedProjectId ?? undefined
      );
      toast.show(
        `${result.imported}개 시크릿 가져옴${result.skipped > 0 ? ` (${result.skipped}개 건너뜀)` : ""}`,
        "success"
      );
      await fetchSecrets();
      await fetchCounts();
    } catch (e: unknown) {
      const msg = typeof e === "string" ? e : (e as Error).message;
      toast.show(msg, "error");
    }
  }, [selectedProjectId, fetchSecrets, fetchCounts, toast]);

  const handleSettingsSave = (settings: {
    autoLockMinutes: number;
    clipboardClearSeconds: number;
    theme: AppConfig["theme"];
  }) => {
    setAutoLockMinutes(settings.autoLockMinutes);
    setClipboardClearSeconds(settings.clipboardClearSeconds);
    setTheme(settings.theme);
    // DB에 영속 저장
    commands.saveSettings(settings);
  };

  // 키보드 단축키
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+N: 새 시크릿
      if (e.ctrlKey && e.key === "n") {
        e.preventDefault();
        handleAdd();
      }
      // Ctrl+F: 검색 포커스
      if (e.ctrlKey && e.key === "f") {
        e.preventDefault();
        document.getElementById("search-input")?.focus();
      }
      // Ctrl+I: .env 가져오기
      if (e.ctrlKey && e.key === "i") {
        e.preventDefault();
        handleImportEnv();
      }
      // Ctrl+L: 잠금
      if (e.ctrlKey && e.key === "l") {
        e.preventDefault();
        lock();
      }
      // Ctrl+,: 설정
      if (e.ctrlKey && e.key === ",") {
        e.preventDefault();
        setShowSettings(true);
      }
      // Escape: 모달/폼 닫기
      if (e.key === "Escape") {
        if (showSettings) setShowSettings(false);
        else if (showCategoryForm) setShowCategoryForm(false);
        else if (showProjectForm) setShowProjectForm(false);
        else if (showForm) handleFormClose();
        else clearSelection();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleAdd, handleImportEnv, lock, clearSelection, showSettings, showCategoryForm, showProjectForm, showForm]);

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      {/* 헤더 */}
      <header className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
        <SearchBar />
        <button
          onClick={handleAdd}
          className="px-3 py-2 bg-primary hover:bg-primary-hover text-white text-sm font-medium rounded-lg transition-colors shrink-0"
          title="새 시크릿 (Ctrl+N)"
        >
          + 추가
        </button>
        <button
          onClick={handleImportEnv}
          className="px-3 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 text-sm rounded-lg transition-colors shrink-0"
          title=".env 파일 가져오기"
        >
          📄 .env
        </button>
        <button
          onClick={() => setShowSettings(true)}
          className="px-3 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 text-sm rounded-lg transition-colors shrink-0"
          title="설정 (Ctrl+,)"
        >
          ⚙️
        </button>
        <button
          onClick={lock}
          className="px-3 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 text-sm rounded-lg transition-colors shrink-0"
          title="잠금 (Ctrl+L)"
        >
          🔒
        </button>
      </header>

      {/* 3-pane */}
      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          onAddCategory={() => setShowCategoryForm(true)}
          onAddProject={() => { setEditingProject(undefined); setShowProjectForm(true); }}
          onEditProject={(proj) => { setEditingProject(proj); setShowProjectForm(true); }}
        />
        <SecretList />
        <div className="flex-1 border-l border-gray-200 dark:border-gray-800 overflow-y-auto">
          {showForm ? (
            <SecretForm editMode={editMode} onClose={handleFormClose} />
          ) : selectedSecret ? (
            <SecretDetail onEdit={handleEdit} clipboardClearSeconds={clipboardClearSeconds} />
          ) : (
            <div className="h-full flex items-center justify-center text-gray-400 dark:text-gray-600">
              <div className="text-center">
                <div className="text-4xl mb-3">🔑</div>
                <p>시크릿을 선택하거나 새로 추가하세요</p>
                <p className="text-xs mt-2 text-gray-400">Ctrl+N 새 시크릿 · Ctrl+F 검색</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 모달 */}
      {showSettings && (
        <SettingsModal
          onClose={() => setShowSettings(false)}
          autoLockMinutes={autoLockMinutes}
          clipboardClearSeconds={clipboardClearSeconds}
          theme={theme}
          onSave={handleSettingsSave}
        />
      )}
      {showCategoryForm && (
        <CategoryForm onClose={() => setShowCategoryForm(false)} />
      )}
      {showProjectForm && (
        <ProjectForm
          onClose={() => { setShowProjectForm(false); setEditingProject(undefined); }}
          editProject={editingProject}
        />
      )}
      <ToastContainer />
    </div>
  );
}
