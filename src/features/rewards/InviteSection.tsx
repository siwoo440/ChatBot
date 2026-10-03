"use client"; // 클라이언트 컴포넌트

import { useState, type FormEvent } from "react"; // 리액트 상태
import { useAppStore } from "@/features/core/AppProvider"; // 앱 상태
import { buildInviteLink, checkInviteRedeem, formatInviteCode, generateInviteCode, getInviteSummary, INVITE_FRIEND_REWARD, INVITE_MONTHLY_LIMIT, INVITE_QUALIFY_MESSAGES, INVITE_WELCOME_REWARD, type InviteRedeemCheck } from "@/features/rewards/referral-model"; // 친구 초대 규칙
import settings from "@/features/settings/SettingsScreen.module.css"; // 설정 공통 스타일
import styles from "@/features/rewards/RewardsScreen.module.css"; // 보상 화면 스타일

const redeemErrors: Record<Exclude<InviteRedeemCheck, "ok">, string> = // 초대 코드 입력 오류 문구
{ // 문구 시작
    invalid: "초대 코드는 영문과 숫자 여덟 글자예요. 다시 확인해 주세요.", // 형식 오류
    own: "내 초대 코드는 넣을 수 없어요.", // 내 코드
    used: "초대 보너스는 한 번만 받을 수 있어요.", // 이미 받음
}; // 문구 종료

export function InviteSection() // 친구 초대 칸(출석과 미션 화면 안)
{ // 함수 시작
    const { state, dispatch } = useAppStore(); // 앱 상태
    const [status, setStatus] = useState(""); // 복사·받기 안내
    const [input, setInput] = useState(""); // 입력한 초대 코드
    const [error, setError] = useState(""); // 입력 오류
    const referral = state.referral; // 친구 초대 상태
    const summary = getInviteSummary(referral, new Date()); // 초대 요약
    const link = referral.code === null || typeof window === "undefined" ? "" : buildInviteLink(window.location.origin, referral.code); // 내 초대 링크
    const canShare = typeof navigator !== "undefined" && typeof navigator.share === "function"; // 기기 공유 창 지원
    const create = () => // 내 초대 링크 만들기
    { // 함수 시작
        dispatch({ type: "create-invite-code", code: generateInviteCode(), now: new Date().toISOString() }); // 코드 저장
        setStatus("초대 링크를 만들었습니다. 친구에게 보내 보세요."); // 안내
    }; // 함수 종료
    const copy = async (text: string, label: string) => // 복사
    { // 함수 시작
        try // 복사 시도
        { // 시도 시작
            await navigator.clipboard.writeText(text); // 클립보드 쓰기
            setStatus(`${label} 복사했습니다.`); // 성공 안내
        } // 시도 종료
        catch // 복사 실패
        { // 실패 시작
            setStatus(`${label} 복사하지 못했습니다. 길게 눌러 직접 복사해 주세요.`); // 실패 안내
        } // 실패 종료
    }; // 함수 종료
    const share = async () => // 기기 공유 창 열기
    { // 함수 시작
        try // 공유 시도
        { // 시도 시작
            await navigator.share({ title: "Mate Verse 초대", text: `Mate Verse에서 같이 이야기해요. 이 링크로 들어오면 ${INVITE_WELCOME_REWARD}토큰을 받아요.`, url: link }); // 공유
        } // 시도 종료
        catch // 공유 취소·실패
        { // 실패 시작
            // 사용자가 닫은 경우가 대부분이라 안내하지 않음
        } // 실패 종료
    }; // 함수 종료
    const redeem = (event: FormEvent) => // 친구의 초대 코드 넣기
    { // 함수 시작
        event.preventDefault(); // 기본 제출 차단
        const check = checkInviteRedeem(referral, input); // 입력 판정
        if (check !== "ok") // 받을 수 없음
        { // 조건 시작
            setError(redeemErrors[check]); // 오류 안내
            return; // 중단
        } // 조건 종료
        dispatch({ type: "redeem-invite-code", code: input, now: new Date().toISOString() }); // 환영 보너스
        setError(""); // 오류 해제
        setInput(""); // 입력 비움
        setStatus(`초대 보너스 ${INVITE_WELCOME_REWARD}토큰을 받았습니다.`); // 안내
    }; // 함수 종료
    return ( // 칸 반환
        <section className={`${settings.card} ${styles.inviteSection}`} id="invite" aria-labelledby="rewards-invite-title"> {/* 친구 초대 */}
            <h2 id="rewards-invite-title">친구 초대</h2> {/* 제목 */}
            <p>내 초대 링크로 들어온 친구는 {INVITE_WELCOME_REWARD}토큰을 받아요. 친구가 메시지를 {INVITE_QUALIFY_MESSAGES}번 보내면 나도 {INVITE_FRIEND_REWARD}토큰을 받아요(한 달 최대 {INVITE_MONTHLY_LIMIT}명).</p> {/* 설명 */}
            <p className={settings.note}>친구가 들어왔는지 확인하려면 계정 로그인이 필요해요. 그래서 내가 받는 보상은 로그인이 연결된 뒤부터 지급되고, 지금은 초대받은 친구의 환영 보너스만 바로 지급돼요.</p> {/* 준비 안내 */}
            {referral.code === null ? <button type="button" className={settings.primary} onClick={create}>내 초대 링크 만들기</button> : ( // 코드 판정
                <div className={styles.inviteBox}> {/* 내 초대 링크 */}
                    <p className={styles.inviteCode}><span>내 초대 코드</span><strong>{formatInviteCode(referral.code)}</strong></p> {/* 초대 코드 */}
                    <label className={styles.inviteField}>내 초대 링크<input readOnly value={link} onFocus={(event) => event.target.select()} /></label> {/* 초대 링크 */}
                    <div className={settings.actionRow}> {/* 동작 */}
                        <button type="button" className={settings.primary} onClick={() => void copy(link, "초대 링크를")}>링크 복사</button> {/* 링크 복사 */}
                        <button type="button" className={settings.secondary} onClick={() => void copy(referral.code ?? "", "초대 코드를")}>코드 복사</button> {/* 코드 복사 */}
                        {canShare ? <button type="button" className={settings.secondary} onClick={() => void share()}>공유하기</button> : null} {/* 기기 공유 */}
                    </div> {/* 동작 종료 */}
                </div> // 내 초대 링크 종료
            )} {/* 코드 판정 종료 */}
            <p className={styles.notice} role="status">{status}</p> {/* 안내 */}
            <dl className={settings.infoGrid} aria-label="초대 현황"> {/* 초대 현황 */}
                <div><dt>초대한 친구</dt><dd>{summary.friendCount}명</dd></div> {/* 친구 수 */}
                <div><dt>이번 달 받은 보상</dt><dd>{summary.rewardedThisMonth}/{summary.monthlyLimit}명</dd></div> {/* 이번 달 보상 */}
            </dl> {/* 초대 현황 종료 */}
            {referral.friends.length === 0 ? null : ( // 친구 목록 판정
                <ol className={styles.records} aria-label="초대한 친구 목록"> {/* 친구 목록 */}
                    {referral.friends.slice(0, 10).map((friend) => <li key={friend.id}><div><strong>{friend.nickname}</strong><small>{friend.rewardedAt === null ? "이번 달 한도를 넘어 보상 없이 기록만 남겼어요" : "조건을 채워 보상을 받았어요"}</small></div><b>{friend.rewardedAt === null ? "—" : `+${INVITE_FRIEND_REWARD}`}</b></li>)} {/* 친구 */}
                </ol> // 친구 목록 종료
            )} {/* 친구 목록 판정 종료 */}
            <div className={styles.inviteRedeem}> {/* 초대받은 사람 */}
                <h3>초대받았나요?</h3> {/* 소제목 */}
                {referral.redeemedCode === null ? ( // 받기 전
                    <form className={styles.inviteForm} onSubmit={redeem}> {/* 초대 코드 입력 */}
                        <label className={styles.inviteField}>친구의 초대 코드<input value={input} maxLength={12} placeholder="예: ABCD-2345" autoComplete="off" autoCapitalize="characters" spellCheck={false} onChange={(event) => { setInput(event.target.value); setError(""); }} /></label> {/* 코드 입력 */}
                        <button type="submit" className={settings.secondary} disabled={input.trim().length === 0}>보너스 {INVITE_WELCOME_REWARD}토큰 받기</button> {/* 받기 */}
                        {error.length === 0 ? null : <p className={settings.error} role="alert">{error}</p>} {/* 오류 */}
                    </form> // 입력 종료
                ) : ( // 받은 뒤
                    <div className={styles.inviteDone}> {/* 받은 안내 */}
                        <p>초대 보너스 {INVITE_WELCOME_REWARD}토큰을 받았어요. 받은 코드 {formatInviteCode(referral.redeemedCode)}</p> {/* 받음 */}
                        <div className={styles.missionProgress}><div role="progressbar" aria-label="초대해 준 친구의 보상 조건" aria-valuemin={0} aria-valuemax={INVITE_QUALIFY_MESSAGES} aria-valuenow={referral.qualifyingMessages}><span style={{ width: `${(referral.qualifyingMessages / INVITE_QUALIFY_MESSAGES) * 100}%` }} /></div><span>{referral.qualifyingMessages}/{INVITE_QUALIFY_MESSAGES}</span></div> {/* 조건 진행 */}
                        <small>메시지를 {INVITE_QUALIFY_MESSAGES}번 보내면 초대해 준 친구도 보상을 받아요. 계정 로그인이 연결되면 친구에게 전달돼요.</small> {/* 조건 안내 */}
                    </div> // 받은 안내 종료
                )} {/* 판정 종료 */}
            </div> {/* 초대받은 사람 종료 */}
        </section> // 친구 초대 종료
    ); // 반환 종료
} // 함수 종료
