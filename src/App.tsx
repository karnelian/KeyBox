import { useEffect } from "react";
import { useAuthStore } from "@/stores/authStore";
import { SetupScreen } from "@/pages/SetupScreen";
import { LockScreen } from "@/pages/LockScreen";
import { MainScreen } from "@/pages/MainScreen";

export default function App() {
  const { isSetup, isUnlocked, checkSetup } = useAuthStore();

  useEffect(() => {
    checkSetup();
  }, [checkSetup]);

  // 로딩 중
  if (isSetup === null) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-950">
        <div className="text-gray-400 text-lg">로딩 중...</div>
      </div>
    );
  }

  // 최초 설정
  if (!isSetup) {
    return <SetupScreen />;
  }

  // 잠금 상태
  if (!isUnlocked) {
    return <LockScreen />;
  }

  // 메인 화면
  return <MainScreen />;
}
