/**
 * 공통 유틸리티 함수
 */

/** ISO 8601 날짜 문자열을 사람이 읽기 쉬운 상대 시간으로 변환합니다. */
export function formatRelativeTime(isoDate: string): string {
  const date = new Date(isoDate);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return "방금 전";
  if (diffMin < 60) return `${diffMin}분 전`;
  if (diffHour < 24) return `${diffHour}시간 전`;
  if (diffDay < 7) return `${diffDay}일 전`;

  return date.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/** ISO 8601 날짜 문자열을 로컬 날짜로 포맷합니다. */
export function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

/** 환경 값을 한국어 레이블로 변환합니다. */
export function formatEnvironment(env: string): string {
  const map: Record<string, string> = {
    dev: "개발",
    staging: "스테이징",
    prod: "프로덕션",
    "": "없음",
  };
  return map[env] ?? env;
}

/** 문자열을 클립보드에 복사합니다 (브라우저 환경). */
export async function copyToClipboard(text: string): Promise<void> {
  await navigator.clipboard.writeText(text);
}

/** 태그 배열을 쉼표 구분 문자열로 변환합니다. */
export function tagsToString(tags: string[]): string {
  return tags.join(", ");
}

/** 쉼표/공백 구분 문자열을 태그 배열로 변환합니다. */
export function stringToTags(value: string): string[] {
  return value
    .split(/[,\s]+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 0);
}

/** UUID v4 생성 (브라우저 내장 crypto 사용). */
export function generateId(): string {
  return crypto.randomUUID();
}

/** 값이 비어 있는지 확인합니다 (null, undefined, 빈 문자열). */
export function isEmpty(value: unknown): boolean {
  return value === null || value === undefined || value === "";
}
