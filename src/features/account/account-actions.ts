// 계정 동작: 로그인·로그아웃을 하고 화면을 새로 연다. 계정마다 저장 칸이 달라, 세션을 바꾼 뒤에는 앱 데이터를 그 계정의 칸에서 처음부터 다시 읽어야 한다.
import { readAccountSession, writeAccountSession } from "@/lib/account/account-session"; // 계정 세션
import type { AuthAdapter, AuthResult, SignInInput } from "@/lib/account/auth-adapter"; // 로그인 계약
import { createPracticeAuthAdapter } from "@/lib/account/practice-auth-adapter"; // 연습용 로그인

export type Navigate = (href: string) => void; // 화면 이동(테스트에서 바꿔 끼움)

const reloadTo: Navigate = (href) => window.location.assign(href); // 새로 열기(앱 데이터를 계정 칸에서 다시 읽게 함)

export function getAuthAdapter(): AuthAdapter // 지금 쓰는 로그인 구현(실제 서비스를 연결하기 전이라 연습용)
{ // 함수 시작
    return createPracticeAuthAdapter(window.localStorage); // 연습용 로그인
} // 함수 종료

export async function signInAndEnter(adapter: AuthAdapter, input: SignInInput, navigate: Navigate = reloadTo, mode: "sign-in" | "sign-up" = "sign-in"): Promise<AuthResult> // 로그인(또는 가입)하고 메인으로 들어가기
{ // 함수 시작
    const result = mode === "sign-up" ? await adapter.signUp(input) : await adapter.signIn(input); // 로그인 시도
    if (result.ok) // 성공
    { // 조건 시작
        writeAccountSession(window.localStorage, result.session); // 세션 저장
        navigate("/"); // 그 계정의 데이터로 새로 열기
    } // 조건 종료
    return result; // 결과 반환(실패하면 화면이 이유를 보여 줌)
} // 함수 종료

export async function signOutAndLeave(adapter: AuthAdapter, navigate: Navigate = reloadTo): Promise<void> // 로그아웃하고 손님 화면으로 돌아가기
{ // 함수 시작
    const session = readAccountSession(window.localStorage); // 지금 세션
    if (session !== null) // 로그인해 있음
    { // 조건 시작
        await adapter.signOut(session).catch(() => undefined); // 서비스 쪽 정리(실패해도 이 기기에서는 로그아웃)
    } // 조건 종료
    writeAccountSession(window.localStorage, null); // 세션 지움
    navigate("/"); // 손님 데이터로 새로 열기
} // 함수 종료
