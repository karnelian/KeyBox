import { useState } from "react";
import { useAuthStore } from "@/stores/authStore";

export function SetupScreen() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [localError, setLocalError] = useState("");
  const { setup, error } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError("");
    if (password.length < 8) {
      setLocalError("패스워드는 8자 이상이어야 합니다");
      return;
    }
    if (password !== confirm) {
      setLocalError("패스워드가 일치하지 않습니다");
      return;
    }
    await setup(password);
  };

  const displayError = localError || error;

  return (
    <div className="h-full flex items-center justify-center bg-gray-50 dark:bg-gray-950">
      <div className="w-full max-w-md px-8">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🔐</div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">KeyBox</h1>
          <p className="text-gray-500 dark:text-gray-400">
            마스터 패스워드를 설정하세요. 이 패스워드로 모든 시크릿이 암호화됩니다.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">마스터 패스워드</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="8자 이상 입력"
              className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary" autoFocus />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">패스워드 확인</label>
            <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="다시 입력"
              className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          {displayError && (
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg">
              <span className="text-danger">⚠️</span>
              <p className="text-danger text-sm font-medium">{displayError}</p>
            </div>
          )}
          <button type="submit" className="w-full py-3 bg-primary hover:bg-primary-hover text-white font-semibold rounded-lg transition-colors">설정 완료</button>
        </form>
        <p className="mt-6 text-xs text-gray-400 dark:text-gray-500 text-center">패스워드를 분실하면 데이터를 복구할 수 없습니다</p>
      </div>
    </div>
  );
}
