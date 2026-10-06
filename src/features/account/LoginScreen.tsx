"use client"; // 클라이언트 컴포넌트

import Link from "next/link"; // 내부 링크
import { useState, type FormEvent } from "react"; // 리액트 상태
import { getAuthAdapter, signInAndEnter, signOutAndLeave, type Navigate } from "@/features/account/account-actions"; // 계정 동작
import { useAccountSession } from "@/features/account/use-account-session"; // 계정 세션
import styles from "@/features/account/LoginScreen.module.css"; // 로그인 화면 스타일
import type { AuthAdapter, AuthFailure } from "@/lib/account/auth-adapter"; // 로그인 계약
import { PRACTICE_NAME_LIMIT } from "@/lib/account/practice-auth-adapter"; // 계정 이름 한도
import { t } from "@/lib/i18n"; // 화면 글자 번역

const failureMessages: Record<AuthFailure, string> = // 실패 이유별 안내
{ // 안내 시작
    "invalid-name": "계정 이름을 1~20자로 적어 주세요.", // 이름 오류
    "invalid-email": "이메일 주소를 확인해 주세요.", // 이메일 오류
    "weak-password": "비밀번호를 더 길게 정해 주세요.", // 약한 비밀번호
    "wrong-credentials": "이메일이나 비밀번호가 맞지 않아요.", // 틀린 정보
    "email-taken": "이미 가입한 이메일이에요. 로그인해 주세요.", // 가입된 이메일
    "confirm-email": "받은 메일의 확인 버튼을 누른 뒤 로그인해 주세요.", // 메일 확인 필요
    unavailable: "지금은 로그인할 수 없어요. 잠시 뒤 다시 시도해 주세요.", // 서비스 오류
}; // 안내 종료

export function LoginScreen({ adapter, navigate }: { adapter?: AuthAdapter; navigate?: Navigate }) // 로그인 화면(연습용: 이름만 정해 계정을 나눠 씀)
{ // 함수 시작
    const session = useAccountSession(); // 지금 로그인한 계정
    const [auth] = useState<AuthAdapter | null>(() => adapter ?? (typeof window === "undefined" ? null : getAuthAdapter())); // 로그인 구현(서버에서 그릴 때는 없음)
    const [name, setName] = useState(""); // 계정 이름
    const [error, setError] = useState(""); // 오류 안내
    const [busy, setBusy] = useState(false); // 처리 중
    const accounts = auth?.listAccounts() ?? []; // 이 브라우저에서 쓴 연습용 계정
    const enter = async (accountName: string) => // 그 이름의 계정으로 들어가기
    { // 함수 시작
        if (auth === null || busy) // 준비 전·처리 중
        { // 조건 시작
            return; // 생략
        } // 조건 종료
        setBusy(true); // 처리 시작
        const result = await signInAndEnter(auth, { name: accountName }, navigate); // 로그인
        setBusy(false); // 처리 끝
        setError(result.ok ? "" : t(failureMessages[result.reason])); // 실패 이유 안내
    }; // 함수 종료
    const submit = (event: FormEvent<HTMLFormElement>) => // 로그인 제출
    { // 함수 시작
        event.preventDefault(); // 기본 제출 차단
        void enter(name); // 입력한 이름으로 로그인
    }; // 함수 종료
    return ( // 화면 반환
        <main className={styles.page}> {/* 로그인 본문 */}
            <section className={styles.card} aria-labelledby="login-title"> {/* 로그인 카드 */}
                <span className={styles.eyebrow}>ACCOUNT</span> {/* 표제 */}
                <h1 id="login-title">{t("로그인")}</h1> {/* 제목 */}
                {session !== null ? ( // 로그인해 있음
                    <> {/* 로그인 상태 */}
                        <p className={styles.lead}>{t("지금 {0} 계정으로 로그인해 있어요.", [session.name])}</p> {/* 지금 계정 */}
                        <div className={styles.actions}> {/* 동작 */}
                            <Link href="/" className={styles.primary}>{t("메인으로 이동")}</Link> {/* 메인 */}
                            <button type="button" className={styles.secondary} disabled={auth === null} onClick={() => { if (auth !== null) { void signOutAndLeave(auth, navigate); } }}>{t("로그아웃")}</button> {/* 로그아웃 */}
                        </div> {/* 동작 종료 */}
                    </> // 로그인 상태 종료
                ) : ( // 로그인 전
                    <> {/* 로그인 양식 */}
                        <p className={styles.note} role="note"><strong>{t("연습용 로그인")}</strong><span>{t("실제 로그인 서비스를 연결하기 전이에요. 이름만 정하면 이 브라우저 안에서 계정을 나눠 써 볼 수 있어요. 비밀번호가 없으니 중요한 내용은 넣지 마세요.")}</span></p> {/* 연습용 안내 */}
                        <form className={styles.form} onSubmit={submit} noValidate> {/* 로그인 양식 */}
                            <label className={styles.field}><span>{t("계정 이름")}</span><input value={name} maxLength={PRACTICE_NAME_LIMIT} autoComplete="off" spellCheck={false} placeholder={t("예: 소하")} aria-invalid={error.length > 0} onChange={(event) => { setName(event.target.value); setError(""); }} /></label> {/* 계정 이름 */}
                            {error.length === 0 ? null : <p className={styles.error} role="alert">{error}</p>} {/* 오류 안내 */}
                            <button type="submit" className={styles.primary} disabled={busy}>{t("로그인")}</button> {/* 로그인 버튼 */}
                        </form> {/* 양식 종료 */}
                        {accounts.length === 0 ? null : ( // 쓴 계정 판정
                            <div className={styles.accounts}> {/* 쓴 계정 */}
                                <h2>{t("이 브라우저에서 쓴 계정")}</h2> {/* 목록 제목 */}
                                <ul aria-label={t("이 브라우저에서 쓴 계정")}>{accounts.map((account) => <li key={account.accountId}><button type="button" disabled={busy} onClick={() => void enter(account.name)}>{account.name}</button></li>)}</ul> {/* 계정 목록 */}
                            </div> // 쓴 계정 종료
                        )} {/* 쓴 계정 판정 종료 */}
                        <p className={styles.hint}>{t("로그인하지 않아도 지금처럼 쓸 수 있어요. 로그인하면 계정마다 캐릭터와 대화, 토큰이 따로 저장돼요.")}</p> {/* 손님 안내 */}
                    </> // 로그인 양식 종료
                )} {/* 판정 종료 */}
            </section> {/* 카드 종료 */}
        </main> // 본문 종료
    ); // 반환 종료
} // 함수 종료
