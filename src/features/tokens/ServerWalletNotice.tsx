"use client"; // 브라우저 화면

import { useAppStore } from "@/features/core/AppProvider"; // 서버 지갑 상태
import { t } from "@/lib/i18n"; // 화면 번역
import styles from "@/features/settings/SettingsScreen.module.css"; // 기존 카드

export function ServerWalletNotice() // 서버 지갑 연결 상태
{ // 함수 시작
    const { walletMode, walletStatus, walletNotice, refreshWallet } = useAppStore(); // 연결 상태
    if (walletMode !== "server") // 연습 모드
    { // 조건 시작
        return null; // 별도 카드 생략
    } // 조건 종료
    return <section className={styles.card} aria-label={t("서버 계정 지갑")}><h2>{t("서버 계정 지갑")}</h2><p>{t(walletStatus === "login" ? "로그인하면 계정의 토큰 잔액을 확인할 수 있어요." : walletStatus === "loading" ? "서버 토큰을 확인하고 있어요." : "잔액과 이용 내역은 서버에서 확인한 값이에요. 시험용 토큰과 별도로 관리해요.")}</p>{walletNotice.length === 0 ? null : <p role="alert">{t(walletNotice)}</p>}<button className={styles.secondary} type="button" onClick={() => { void refreshWallet(); }} disabled={walletStatus === "login"}>{t("잔액 새로고침")}</button></section>; // 상태·오류·다시 시도
} // 함수 종료
