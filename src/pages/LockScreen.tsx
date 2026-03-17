import { useState } from "react";
import { useAuthStore } from "@/stores/authStore";

export function LockScreen() {
  const [password, setPassword] = useState("");
  const [shake, setShake] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const { unlock, error, clearError } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;
    clearError();

    try {
      await unlock(password);
    } catch {
      // error는 스토어에서 이미 설정됨
    }

    // unlock 후 스토어 상태 확인 — 여전히 잠겨있으면 실패
    const state = useAuthStore.getState();
    if (!state.isUnlocked) {
      setAttempts((prev) => prev + 1);
      setShake(true);
      setTimeout(() => setShake(false), 500);
      setPassword("");
    }
  };

  return (
    <div className="h-full flex items-center justify-center bg-gray-50 dark:bg-gray-950">
      <div className={`w-full max-w-sm px-8 ${shake ? "animate-shake" : ""}`}>
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">KeyBox</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) clearError();
              }}
              placeholder="마스터 패스워드"
              className={`w-full px-4 py-3 bg-white dark:bg-gray-800 border rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 transition-colors ${
                error
                  ? "border-danger focus:ring-danger"
                  : "border-gray-300 dark:border-gray-700 focus:ring-primary"
              }`}
              autoFocus
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg">
              <span className="text-lg">⚠️</span>
              <div>
                <p className="text-danger text-sm font-medium">패스워드가 틀렸습니다</p>
                {attempts >= 3 && (
                  <p className="text-red-400 dark:text-red-300 text-xs mt-0.5">
                    패스워드를 잊으셨다면 데이터 복구가 불가능합니다
                  </p>
                )}
              </div>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3 bg-primary hover:bg-primary-hover text-white font-semibold rounded-lg transition-colors"
          >
            잠금 해제
          </button>
        </form>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-8px); }
          40%, 80% { transform: translateX(8px); }
        }
        .animate-shake {
          animation: shake 0.4s ease-in-out;
        }
      `}</style>
    </div>
  );
}
