import type { Route } from "next"; // 경로 타입
import Link from "next/link"; // 내부 경로 링크
import type { AppSettings, RewardState, TokenWallet, UserProfile } from "@/features/core/types"; // 사용자 타입
import { ATTENDANCE_CYCLE, getAttendanceView, getBonusView, getClaimableCount } from "@/features/rewards/reward-model"; // 출석·미션 규칙
import { isAdultVerified } from "@/features/adult/adult-access"; // 성인 인증 판정
import { settingsNavigation } from "@/features/settings/settings-navigation"; // 공통 메뉴 정의
import { getDailyUsage } from "@/lib/story/token-policy"; // 오늘 사용량
import { t } from "@/lib/i18n"; // 화면 글자 번역

interface UserPanelProps // 패널 속성
{ // 구조 시작
    profile: UserProfile; // 사용자 프로필
    wallet: TokenWallet; // 토큰 지갑
    settings: AppSettings; // 앱 설정
    rewards?: RewardState; // 출석·미션(있으면 토큰 아래에 카드 표시)
    open: boolean; // 열림 상태
    onNavigate(): void; // 내부 이동 처리
    onHideMature?(): void; // 19+ 보기 끄기 처리(없거나 19+ 보기가 꺼져 있으면 버튼을 숨김. 로그인이 없어 로그아웃 버튼은 두지 않음)
} // 구조 종료

export function UserPanel({ profile, wallet, settings, rewards, open, onNavigate, onHideMature }: UserPanelProps) // 사용자 패널
{ // 함수 시작
    const adultVerified = isAdultVerified(profile, new Date()); // 성인 인증 상태
    const attendance = rewards === undefined ? null : getAttendanceView(rewards.attendance, new Date()); // 출석 상태
    const bonus = rewards === undefined ? null : getBonusView(rewards.missions, new Date()); // 미션 상태
    const rewardCount = rewards === undefined ? 0 : getClaimableCount(rewards, new Date()); // 받을 보상 수
    return ( // 패널 반환
        <aside id="user-panel" className="user-panel" role="complementary" aria-label={t("사용자 정보와 설정")} aria-hidden={!open}> {/* 사용자 패널 */}
            <section className="user-panel-profile" aria-label={t("프로필 요약")}> {/* 프로필 영역 */}
                <div className="profile-avatar" aria-hidden="true" /> {/* 빈 초상화 */}
                <div className="user-panel-profile-copy"> {/* 프로필 문구 */}
                    <span className="user-panel-eyebrow">MY PROFILE</span> {/* 프로필 표제 */}
                    <h2>{profile.nickname}</h2> {/* 사용자 이름 */}
                    <div className="user-panel-badges"> {/* 프로필 배지 묶음 */}
                        <span className="user-panel-membership">{profile.membership.toUpperCase()} {t("멤버십")}</span> {/* 멤버십 배지 */}
                        <Link href={"/settings/profile#adult" as Route} className="user-panel-membership user-panel-adult" data-state={adultVerified ? "on" : "off"} aria-label={t("성인 인증 {0}, 성인 인증 관리 열기", [adultVerified ? "ON" : "OFF"])} onClick={onNavigate}>{t("성인 인증")} {adultVerified ? "ON" : "OFF"}</Link> {/* 성인 인증 배지 */}
                    </div> {/* 배지 묶음 종료 */}
                </div> {/* 프로필 문구 종료 */}
            </section> {/* 프로필 영역 종료 */}
            <section className="user-panel-wallet" aria-label={t("토큰 정보")}> {/* 토큰 영역 */}
                <div className="user-panel-wallet-primary"> {/* 토큰 잔액 */}
                    <span className="user-panel-wallet-label">{t("보유 토큰")}</span> {/* 잔액 표제 */}
                    <strong>{wallet.balance.toLocaleString()}</strong> {/* 잔액 값 */}
                </div> {/* 토큰 잔액 종료 */}
                <div className="user-panel-wallet-secondary"> {/* 이미지 사용량 */}
                    <span className="user-panel-wallet-label">{t("오늘 이미지")}</span> {/* 이미지 표제 */}
                    <strong>{getDailyUsage(wallet, new Date()).image}{t("회")}</strong> {/* 이미지 값(날짜가 바뀌면 0) */}
                </div> {/* 이미지 사용량 종료 */}
            </section> {/* 토큰 영역 종료 */}
            {attendance === null || bonus === null ? null : ( // 출석·미션 카드 판정
                <Link href={"/rewards" as Route} className="user-panel-rewards" data-ready={rewardCount > 0 ? "true" : undefined} onClick={onNavigate}> {/* 출석·미션 카드 */}
                    <span className="user-panel-rewards-label">{t("출석·미션")}</span> {/* 표제 */}
                    <strong>{attendance.canCheck ? t("오늘 출석 전") : t("오늘 출석 완료")}</strong> {/* 출석 상태 */}
                    <span className="user-panel-rewards-meta">{t("도장")} {attendance.stamped}/{ATTENDANCE_CYCLE} {t("· 미션")} {bonus.done}/{bonus.total}{rewardCount > 0 ? t(" · 받을 보상 {0}개", [rewardCount]) : ""}</span> {/* 진행 */}
                </Link> // 카드 종료
            )} {/* 카드 판정 종료 */}
            {rewards === undefined ? null : <Link href={"/rewards#invite" as Route} className="user-panel-invite" onClick={onNavigate}><span>{t("친구 초대")}</span><span aria-hidden="true">›</span></Link>} {/* 친구 초대 칸으로 */}
            <nav className="user-panel-menu" aria-label={t("사용자 메뉴")}> {/* 사용자 메뉴 */}
                {settingsNavigation.map((group) => ( // 메뉴 묶음 순회
                    <section key={group.id} className="user-panel-group" aria-labelledby={`user-${group.id}-title`}> {/* 메뉴 묶음 */}
                        <h3 id={`user-${group.id}-title`} className="user-panel-group-title">{t(group.label)}</h3> {/* 묶음 표제 */}
                        <div className="user-panel-link-list"> {/* 링크 목록 */}
                            {group.items.filter((item) => item.href !== "/rewards" || rewards === undefined).map((item) => <Link key={item.href} href={item.href as Route} onClick={onNavigate}><span>{t(item.label)}</span>{item.href === "/settings/display" ? <span>{settings.layoutId ?? t("자동")}</span> : <span aria-hidden="true">›</span>}</Link>)} {/* 메뉴 링크 */}
                        </div> {/* 링크 목록 종료 */}
                    </section> // 메뉴 묶음 종료
                ))} {/* 묶음 순회 종료 */}
            </nav> {/* 메뉴 종료 */}
            {onHideMature === undefined || !settings.matureContentEnabled ? null : <button className="user-panel-logout" type="button" onClick={onHideMature}>{t("19+ 보기 끄기")}</button>} {/* 19+ 보기 끄기 버튼(켜져 있을 때만) */}
        </aside> // 패널 종료
    ); // 반환 종료
} // 함수 종료
