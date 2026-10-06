// 계정별 저장 칸: 로그인한 계정마다 앱 데이터(상태·백업)를 다른 열쇠 이름으로 저장하게 한다. 로그인하지 않은 손님은 지금까지 쓰던 열쇠를 그대로 쓴다.
import { getAccountServiceConfig } from "@/lib/account/account-config"; // 계정 서비스 설정
import { ACCOUNT_SESSION_KEY, readActiveSession } from "@/lib/account/account-session"; // 계정 세션

const APP_PREFIX = "mateverse:v1:"; // 앱 데이터 열쇠의 앞부분
const sharedKeys = new Set([ACCOUNT_SESSION_KEY, "mateverse:v1:usage-time", "mateverse:v1:practice-accounts", "mateverse:v1:auth", "mateverse:v1:auth-verifier"]); // 계정과 상관없이 기기 전체가 함께 쓰는 열쇠

export function scopeKey(key: string, scope: string): string // 계정 칸의 열쇠 이름 만들기(앱 데이터 열쇠만 바꿈)
{ // 함수 시작
    return !key.startsWith(APP_PREFIX) || sharedKeys.has(key) || key.startsWith(`${APP_PREFIX}u:`) || key.startsWith(`${APP_PREFIX}practice-`) ? key : `${APP_PREFIX}u:${scope}:${key.slice(APP_PREFIX.length)}`; // 공용 열쇠·이미 칸이 붙은 열쇠는 그대로
} // 함수 종료

export function createScopedStorage(storage: Storage, scope: string | null): Storage // 계정 칸을 쓰는 저장소 만들기(손님이면 원래 저장소 그대로)
{ // 함수 시작
    if (scope === null) // 손님
    { // 조건 시작
        return storage; // 지금까지 쓰던 칸
    } // 조건 종료
    return { // 열쇠 이름만 바꿔 원래 저장소에 맡기는 저장소
        get length() { return storage.length; }, // 항목 수
        clear: () => storage.clear(), // 전체 삭제
        key: (index: number) => storage.key(index), // 위치의 열쇠
        getItem: (key: string) => storage.getItem(scopeKey(key, scope)), // 읽기
        setItem: (key: string, value: string) => storage.setItem(scopeKey(key, scope), value), // 쓰기
        removeItem: (key: string) => storage.removeItem(scopeKey(key, scope)), // 지우기
    }; // 저장소 반환
} // 함수 종료

export function getAppStorage(): Storage // 지금 로그인한 계정의 저장소(브라우저에서만 부름)
{ // 함수 시작
    return createScopedStorage(window.localStorage, readActiveSession(window.localStorage, getAccountServiceConfig().mode === "supabase")?.accountId ?? null); // 세션의 계정 칸
} // 함수 종료
