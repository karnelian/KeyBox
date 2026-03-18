import { useState } from "react";
import { changePassword } from "@/lib/commands";
import type { AppConfig } from "@/types";

type Theme = AppConfig["theme"];

interface SettingsModalProps {
  onClose: () => void;
  autoLockMinutes: number;
  clipboardClearSeconds: number;
  theme: Theme;
  onSave: (settings: {
    autoLockMinutes: number;
    clipboardClearSeconds: number;
    theme: Theme;
  }) => void;
}

export function SettingsModal({
  onClose,
  autoLockMinutes,
  clipboardClearSeconds,
  theme,
  onSave,
}: SettingsModalProps) {
  const [lockMin, setLockMin] = useState(autoLockMinutes);
  const [clipSec, setClipSec] = useState(clipboardClearSeconds);
  const [selectedTheme, setSelectedTheme] = useState<Theme>(theme);

  // 비밀번호 변경
  const [showPwChange, setShowPwChange] = useState(false);
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);

  const handleChangePassword = async () => {
    setPwError("");
    setPwSuccess(false);

    if (newPw.length < 8) {
      setPwError("새 비밀번호는 8자 이상이어야 합니다");
      return;
    }
    if (newPw !== confirmPw) {
      setPwError("새 비밀번호가 일치하지 않습니다");
      return;
    }

    setPwLoading(true);
    try {
      await changePassword(currentPw, newPw);
      setPwSuccess(true);
      setCurrentPw("");
      setNewPw("");
      setConfirmPw("");
      setTimeout(() => {
        setPwSuccess(false);
        setShowPwChange(false);
      }, 2000);
    } catch (e: unknown) {
      const msg = typeof e === "string" ? e : (e as Error).message;
      setPwError(msg);
    } finally {
      setPwLoading(false);
    }
  };

  const handleSave = () => {
    onSave({ autoLockMinutes: lockMin, clipboardClearSeconds: clipSec, theme: selectedTheme });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl w-full max-w-md max-h-[85vh] flex flex-col p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">설정</h2>
          <button
            onClick={onClose}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-200 text-xl"
          >
            ✕
          </button>
        </div>

        <div className="space-y-5 overflow-y-auto flex-1 min-h-0 pr-1">
          {/* 테마 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              테마
            </label>
            <div className="flex gap-2">
              {(["light", "dark", "system"] as Theme[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setSelectedTheme(t)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    selectedTheme === t
                      ? "bg-primary border-primary text-white"
                      : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700"
                  }`}
                >
                  {t === "light" ? "라이트" : t === "dark" ? "다크" : "시스템"}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              앱 전체 색상 테마를 설정합니다
            </p>
          </div>

          {/* 자동 잠금 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              자동 잠금 (분)
            </label>
            <select
              value={lockMin}
              onChange={(e) => setLockMin(Number(e.target.value))}
              className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value={1}>1분</option>
              <option value={3}>3분</option>
              <option value={5}>5분 (기본)</option>
              <option value={10}>10분</option>
              <option value={15}>15분</option>
              <option value={30}>30분</option>
              <option value={0}>사용 안 함</option>
            </select>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              비활성 시간 초과 시 자동으로 잠급니다
            </p>
          </div>

          {/* 클립보드 자동 클리어 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              클립보드 자동 클리어 (초)
            </label>
            <select
              value={clipSec}
              onChange={(e) => setClipSec(Number(e.target.value))}
              className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value={10}>10초</option>
              <option value={30}>30초 (기본)</option>
              <option value={60}>60초</option>
              <option value={120}>2분</option>
              <option value={0}>사용 안 함</option>
            </select>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              복사 후 지정 시간이 지나면 클립보드를 비웁니다
            </p>
          </div>

          {/* 비밀번호 변경 */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <button
              onClick={() => { setShowPwChange(!showPwChange); setPwError(""); setPwSuccess(false); }}
              className="flex items-center justify-between w-full text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              <span>비밀번호 변경</span>
              <span className="text-gray-400">{showPwChange ? "▲" : "▼"}</span>
            </button>
            {showPwChange && (
              <div className="mt-3 space-y-3">
                <input
                  type="password"
                  placeholder="현재 비밀번호"
                  value={currentPw}
                  onChange={(e) => setCurrentPw(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <input
                  type="password"
                  placeholder="새 비밀번호 (8자 이상)"
                  value={newPw}
                  onChange={(e) => setNewPw(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <input
                  type="password"
                  placeholder="새 비밀번호 확인"
                  value={confirmPw}
                  onChange={(e) => setConfirmPw(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                />
                {pwError && <p className="text-xs text-danger">{pwError}</p>}
                {pwSuccess && <p className="text-xs text-success">비밀번호가 변경되었습니다</p>}
                <button
                  onClick={handleChangePassword}
                  disabled={pwLoading || !currentPw || !newPw || !confirmPw}
                  className="w-full py-2 bg-primary hover:bg-primary-hover disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors"
                >
                  {pwLoading ? "변경 중..." : "비밀번호 변경"}
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={handleSave}
            className="flex-1 py-2.5 bg-primary hover:bg-primary-hover text-white font-semibold rounded-lg transition-colors"
          >
            저장
          </button>
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-200 rounded-lg transition-colors"
          >
            취소
          </button>
        </div>
      </div>
    </div>
  );
}
