export const WALLET_CHANGED_EVENT = "mateverse:wallet-changed"; // 서버 원장 갱신 알림

export function notifyWalletChanged(): void // 사용 종료 뒤 잔액 재조회
{ // 함수 시작
    if (typeof window !== "undefined") // 브라우저 실행
    { // 조건 시작
        window.dispatchEvent(new Event(WALLET_CHANGED_EVENT)); // 같은 탭에 알림
    } // 조건 종료
} // 함수 종료
