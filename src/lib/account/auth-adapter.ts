// 로그인 계약: 화면은 이 계약만 보고 로그인·로그아웃을 한다. 지금은 연습용 구현만 있고, 실제 서비스(Supabase)를 연결하면 같은 계약의 다른 구현을 끼운다.
import type { AccountSession } from "@/lib/account/account-session"; // 계정 세션

export type AuthFailure = "invalid-name" | "invalid-email" | "weak-password" | "wrong-credentials" | "email-taken" | "confirm-email" | "unavailable"; // 로그인 실패 이유
export type AuthResult = { ok: true; session: AccountSession } | { ok: false; reason: AuthFailure }; // 로그인 결과
export type SocialProvider = "google" | "kakao"; // 간편 로그인 서비스

export interface SignInInput // 로그인 입력
{ // 구조 시작
    name?: string; // 계정 이름(연습용)
    email?: string; // 이메일(실제 서비스)
    password?: string; // 비밀번호(실제 서비스)
} // 구조 종료

export interface PracticeAccount // 연습용 계정
{ // 구조 시작
    accountId: string; // 계정 식별자
    name: string; // 계정 이름
    usedAt: string; // 마지막으로 쓴 시각
} // 구조 종료

export interface AuthAdapter // 로그인 계약
{ // 구조 시작
    readonly mode: "practice" | "live"; // 연습용인지 실제 서비스인지
    socialProviders(): SocialProvider[]; // 쓸 수 있는 간편 로그인(연습용은 없음)
    signIn(input: SignInInput): Promise<AuthResult>; // 로그인
    signUp(input: SignInInput): Promise<AuthResult>; // 회원가입
    signOut(session: AccountSession): Promise<void>; // 로그아웃(서비스 쪽 정리)
    listAccounts(): PracticeAccount[]; // 이 브라우저에서 쓴 연습용 계정(실제 서비스는 빈 목록)
} // 구조 종료
