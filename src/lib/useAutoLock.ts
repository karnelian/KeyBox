import { useEffect, useRef, useCallback } from "react";
import { useAuthStore } from "@/stores/authStore";

/**
 * 자동 잠금 훅
 * 마우스/키보드 활동이 없으면 지정 시간 후 자동 잠금
 */
export function useAutoLock(minutes: number) {
  const { lock, isUnlocked } = useAuthStore();
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (minutes <= 0 || !isUnlocked) return;

    timerRef.current = setTimeout(() => {
      lock();
    }, minutes * 60 * 1000);
  }, [minutes, isUnlocked, lock]);

  useEffect(() => {
    if (minutes <= 0 || !isUnlocked) return;

    const events = ["mousemove", "keydown", "mousedown", "scroll", "touchstart"];
    events.forEach((e) => window.addEventListener(e, resetTimer));
    resetTimer();

    return () => {
      events.forEach((e) => window.removeEventListener(e, resetTimer));
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [minutes, isUnlocked, resetTimer]);
}
