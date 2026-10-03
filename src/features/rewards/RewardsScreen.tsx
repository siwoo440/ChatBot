"use client"; // 클라이언트 컴포넌트

import type { Route } from "next"; // 경로 타입
import Link from "next/link"; // 내부 경로 링크
import { useState } from "react"; // 리액트 상태
import { useAppStore } from "@/features/core/AppProvider"; // 앱 상태
import { ATTENDANCE_CYCLE, attendanceRewards, getAttendanceView, getBonusView, getClaimableTokens, getMissionViews, type MissionView } from "@/features/rewards/reward-model"; // 출석·미션 규칙
import { SettingsPageHeader } from "@/features/settings/SettingsShell"; // 페이지 머리말
import settings from "@/features/settings/SettingsScreen.module.css"; // 설정 공통 스타일
import styles from "@/features/rewards/RewardsScreen.module.css"; // 보상 화면 스타일

const RECORD_PREVIEW = 10; // 화면에 보여 줄 받은 기록 수

function formatDateTime(value: string): string // 시각 표시
{ // 함수 시작
    return new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Seoul" }).format(new Date(value)); // 한국 시각 반환
} // 함수 종료

export function RewardsScreen() // 출석과 미션 화면
{ // 함수 시작
    const { state, dispatch } = useAppStore(); // 앱 상태
    const [notice, setNotice] = useState(""); // 받은 안내
    const today = new Date(); // 지금
    const attendance = getAttendanceView(state.rewards.attendance, today); // 출석 상태
    const missions = getMissionViews(state.rewards.missions, today); // 미션 상태
    const bonus = getBonusView(state.rewards.missions, today); // 보너스 상태
    const waiting = getClaimableTokens(state.rewards, today); // 지금 받을 수 있는 토큰
    const missionReady = missions.some((view) => view.claimable) || bonus.claimable; // 받을 미션 보상 여부
    const stamp = () => // 출석하기
    { // 함수 시작
        dispatch({ type: "check-attendance", now: new Date().toISOString() }); // 도장과 보상
        setNotice(`출석 ${attendance.nextDay}일차 도장을 찍고 ${attendance.nextReward}토큰을 받았습니다.`); // 안내
    }; // 함수 종료
    const claim = (view: MissionView) => // 미션 보상 받기
    { // 함수 시작
        dispatch({ type: "claim-mission", missionId: view.definition.id, now: new Date().toISOString() }); // 보상 지급
        setNotice(`‘${view.definition.title}’ 보상 ${view.definition.reward}토큰을 받았습니다.`); // 안내
    }; // 함수 종료
    const claimBonus = () => // 보너스 받기
    { // 함수 시작
        dispatch({ type: "claim-mission-bonus", now: new Date().toISOString() }); // 보너스 지급
        setNotice(`미션을 모두 끝낸 보너스 ${bonus.reward}토큰을 받았습니다.`); // 안내
    }; // 함수 종료
    const claimAll = () => // 받을 수 있는 미션 보상 모두 받기
    { // 함수 시작
        const now = new Date().toISOString(); // 받은 시각
        const ready = missions.filter((view) => view.claimable); // 받을 미션
        ready.forEach((view) => dispatch({ type: "claim-mission", missionId: view.definition.id, now })); // 미션 보상
        if (bonus.claimable) // 보너스 판정
        { // 조건 시작
            dispatch({ type: "claim-mission-bonus", now }); // 보너스
        } // 조건 종료
        setNotice(`미션 보상 ${ready.reduce((sum, view) => sum + view.definition.reward, 0) + (bonus.claimable ? bonus.reward : 0)}토큰을 한 번에 받았습니다.`); // 안내
    }; // 함수 종료
    return ( // 화면 반환
        <> {/* 출석과 미션 */}
            <SettingsPageHeader kicker="ACCOUNT · REWARDS" title="출석과 미션" description="매일 출석 도장을 찍고 오늘의 미션을 채우면 토큰을 조금씩 받을 수 있어요." /> {/* 페이지 머리말 */}
            <section className={settings.statGrid} aria-label="보상 요약"> {/* 요약 */}
                <div className={settings.stat}><span>보유 토큰</span><strong>{state.wallet.balance.toLocaleString()}</strong><small>{waiting > 0 ? `지금 ${waiting}토큰을 받을 수 있어요` : "오늘 받을 보상을 모두 받았어요"}</small></div> {/* 잔액 */}
                <div className={settings.stat}><span>이번 도장판</span><strong>{attendance.stamped}/{ATTENDANCE_CYCLE}</strong><small>누적 출석 {attendance.totalDays}일</small></div> {/* 출석 */}
                <div className={settings.stat}><span>오늘의 미션</span><strong>{bonus.done}/{bonus.total}</strong><small>지금까지 받은 토큰 {state.rewards.totalEarned.toLocaleString()}</small></div> {/* 미션 */}
            </section> {/* 요약 종료 */}
            <p className={styles.notice} role="status">{notice}</p> {/* 받은 안내 */}
            <section className={settings.card} aria-labelledby="rewards-attendance-title"> {/* 출석 */}
                <h2 id="rewards-attendance-title">출석 도장판</h2> {/* 제목 */}
                <p>하루에 한 번 도장을 찍어요. 7일을 이어서 채우면 7일차에 20토큰을 받고, 하루라도 빠지면 1일차부터 다시 시작해요.</p> {/* 설명 */}
                <ol className={styles.stampBoard} aria-label="출석 도장판"> {/* 도장판 */}
                    {attendanceRewards.map((reward, index) => // 칸 순회
                    { // 순회 시작
                        const day = index + 1; // 일차
                        const status = day <= attendance.stamped ? "done" : day === attendance.nextDay && attendance.canCheck ? "today" : "todo"; // 칸 상태
                        const statusLabel = status === "done" ? "출석 완료" : status === "today" ? "오늘 찍을 칸" : "아직"; // 상태 이름
                        return <li key={day} data-state={status} data-final={day === ATTENDANCE_CYCLE ? "true" : undefined} aria-label={`${day}일차, ${reward}토큰, ${statusLabel}`}><span>{day}일차</span><strong aria-hidden="true">{status === "done" ? "✓" : `+${reward}`}</strong></li>; // 칸
                    })} {/* 순회 종료 */}
                </ol> {/* 도장판 종료 */}
                <button type="button" className={settings.primary} disabled={!attendance.canCheck} onClick={stamp}>{attendance.canCheck ? `출석하기 · +${attendance.nextReward}토큰` : "오늘 출석 완료"}</button> {/* 출석 버튼 */}
            </section> {/* 출석 종료 */}
            <section className={settings.card} aria-labelledby="rewards-mission-title"> {/* 미션 */}
                <h2 id="rewards-mission-title">오늘의 미션</h2> {/* 제목 */}
                <p>매일 자정(한국 시간)에 새로 시작해요. 받지 않은 보상은 날짜가 바뀌면 사라지니 잊지 말고 받아 주세요.</p> {/* 설명 */}
                <ul className={styles.missionList} aria-label="오늘의 미션 목록"> {/* 미션 목록 */}
                    {missions.map((view) => ( // 미션 순회
                        <li key={view.definition.id} data-state={view.claimed ? "claimed" : view.claimable ? "ready" : "open"}> {/* 미션 */}
                            <div className={styles.missionCopy}><strong>{view.definition.title}</strong><small>{view.definition.description}</small></div> {/* 이름과 설명 */}
                            <div className={styles.missionProgress}><div role="progressbar" aria-label={`${view.definition.title} 진행`} aria-valuemin={0} aria-valuemax={view.definition.target} aria-valuenow={view.progress}><span style={{ width: `${(view.progress / view.definition.target) * 100}%` }} /></div><span>{view.progress}/{view.definition.target}</span></div> {/* 진행 */}
                            {view.claimed ? <span className={styles.claimed}>받음</span> : view.claimable ? <button type="button" className={styles.claim} aria-label={`${view.definition.title} 보상 ${view.definition.reward}토큰 받기`} onClick={() => claim(view)}>받기 · +{view.definition.reward}</button> : <Link href={view.definition.href as Route} className={styles.go} aria-label={`${view.definition.title}, ${view.definition.actionLabel}`}>+{view.definition.reward} · {view.definition.actionLabel}</Link>} {/* 받기·이동 */}
                        </li> // 미션 종료
                    ))} {/* 순회 종료 */}
                    <li data-state={bonus.claimed ? "claimed" : bonus.claimable ? "ready" : "open"} data-bonus="true"> {/* 보너스 */}
                        <div className={styles.missionCopy}><strong>세 가지 모두 완료 보너스</strong><small>오늘의 미션을 모두 채우면 받을 수 있어요.</small></div> {/* 이름과 설명 */}
                        <div className={styles.missionProgress}><div role="progressbar" aria-label="모두 완료 보너스 진행" aria-valuemin={0} aria-valuemax={bonus.total} aria-valuenow={bonus.done}><span style={{ width: `${(bonus.done / bonus.total) * 100}%` }} /></div><span>{bonus.done}/{bonus.total}</span></div> {/* 진행 */}
                        {bonus.claimed ? <span className={styles.claimed}>받음</span> : bonus.claimable ? <button type="button" className={styles.claim} aria-label={`모두 완료 보너스 ${bonus.reward}토큰 받기`} onClick={claimBonus}>받기 · +{bonus.reward}</button> : <span className={styles.locked}>+{bonus.reward}</span>} {/* 받기 */}
                    </li> {/* 보너스 종료 */}
                </ul> {/* 미션 목록 종료 */}
                <button type="button" className={settings.secondary} disabled={!missionReady} onClick={claimAll}>미션 보상 모두 받기</button> {/* 모두 받기 */}
            </section> {/* 미션 종료 */}
            <section className={settings.card} aria-labelledby="rewards-record-title"> {/* 받은 기록 */}
                <h2 id="rewards-record-title">받은 기록</h2> {/* 제목 */}
                {state.tokenRecords.length === 0 ? <p>아직 받은 토큰이 없어요. 출석 도장부터 찍어 보세요.</p> : ( // 기록 판정
                    <ol className={styles.records} aria-label="받은 토큰 기록"> {/* 기록 목록 */}
                        {state.tokenRecords.slice(0, RECORD_PREVIEW).map((record) => <li key={record.id}><div><strong>{record.label}</strong><small>{formatDateTime(record.createdAt)} · 잔액 {record.balance.toLocaleString()}</small></div><b>+{record.amount}</b></li>)} {/* 기록 */}
                    </ol> // 기록 목록 종료
                )} {/* 기록 판정 종료 */}
                <p className={settings.note}>출석과 미션 기록은 지금 사용하는 브라우저에만 저장돼요. 계정 로그인이 연결되면 다른 기기에서도 이어집니다.</p> {/* 저장 안내 */}
            </section> {/* 받은 기록 종료 */}
        </> // 출석과 미션 종료
    ); // 반환 종료
} // 함수 종료
