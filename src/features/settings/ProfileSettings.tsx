"use client"; // 클라이언트 컴포넌트

import { useState } from "react"; // 리액트 상태
import { useAppStore } from "@/features/core/AppProvider"; // 앱 상태
import { SettingsPageHeader } from "@/features/settings/SettingsShell"; // 페이지 머리말
import { validateProfileSettings, type ProfileSettingsErrors } from "@/features/settings/settings-validation"; // 프로필 검증
import styles from "@/features/settings/SettingsScreen.module.css"; // 설정 스타일

const membershipLabels = { free: "FREE", plus: "PLUS", creator: "CREATOR" } as const; // 멤버십 표시

function formatDate(value: string): string // 날짜 표시
{ // 함수 시작
    return new Intl.DateTimeFormat("ko-KR", { dateStyle: "long", timeZone: "Asia/Seoul" }).format(new Date(value)); // 한국 날짜 반환
} // 함수 종료

export function ProfileSettings() // 프로필 관리 화면
{ // 함수 시작
    const { state, dispatch } = useAppStore(); // 앱 상태 조회
    const [draft, setDraft] = useState({ nickname: state.profile.nickname, avatar: state.profile.avatar }); // 프로필 초안
    const [errors, setErrors] = useState<ProfileSettingsErrors>({}); // 입력 오류
    const [status, setStatus] = useState(""); // 저장 상태
    const save = () => // 프로필 저장 함수
    { // 함수 시작
        const nextErrors = validateProfileSettings(draft); // 입력 검증
        setErrors(nextErrors); // 오류 반영
        if (Object.keys(nextErrors).length > 0) // 오류 존재 확인
        { // 조건 시작
            setStatus(""); // 성공 상태 해제
            return; // 저장 중단
        } // 조건 종료
        dispatch({ type: "update-profile", profile: { nickname: draft.nickname.trim(), avatar: draft.avatar.trim() } }); // 프로필 변경
        setStatus("저장했습니다."); // 성공 상태 반영
    }; // 함수 종료
    return ( // 화면 반환
        <> {/* 프로필 화면 */}
            <SettingsPageHeader kicker="ACCOUNT · PROFILE" title="프로필 관리" description="대화와 탐색 화면에 보이는 이름과 프로필 글자를 관리합니다." /> {/* 페이지 머리말 */}
            <section className={styles.profileCard} aria-label="프로필 미리보기"> {/* 프로필 미리보기 */}
                <span className={styles.avatar} aria-hidden="true">{draft.avatar.trim() || "?"}</span> {/* 아바타 미리보기 */}
                <div> {/* 프로필 정보 */}
                    <h2>{draft.nickname.trim() || "이름 없음"}</h2> {/* 이름 미리보기 */}
                    <span className={styles.badge}>{membershipLabels[state.profile.membership]} 멤버십</span> {/* 멤버십 배지 */}
                    <p>가입일 {formatDate(state.profile.createdAt)} · 이 브라우저에만 저장</p> {/* 가입 정보 */}
                </div> {/* 프로필 정보 종료 */}
            </section> {/* 프로필 미리보기 종료 */}
            <section className={styles.section} aria-labelledby="profile-form-title"> {/* 기본 정보 */}
                <h2 id="profile-form-title">기본 정보</h2> {/* 영역 제목 */}
                <label>닉네임<input value={draft.nickname} maxLength={21} onChange={(event) => setDraft({ ...draft, nickname: event.target.value })} /></label> {/* 닉네임 입력 */}
                {errors.nickname === undefined ? null : <p className={styles.error}>{errors.nickname}</p>} {/* 닉네임 오류 */}
                <label>프로필 글자<input value={draft.avatar} maxLength={8} onChange={(event) => setDraft({ ...draft, avatar: event.target.value })} /></label> {/* 프로필 글자 입력 */}
                {errors.avatar === undefined ? null : <p className={styles.error}>{errors.avatar}</p>} {/* 프로필 글자 오류 */}
                <p>프로필 사진 대신 보이는 글자입니다. 한두 글자를 권장합니다.</p> {/* 입력 안내 */}
                <button type="button" className={styles.primary} onClick={save}>프로필 저장</button> {/* 저장 버튼 */}
                {status.length === 0 ? null : <p className={styles.status} role="status">{status}</p>} {/* 저장 안내 */}
            </section> {/* 기본 정보 종료 */}
        </> // 프로필 화면 종료
    ); // 반환 종료
} // 함수 종료
