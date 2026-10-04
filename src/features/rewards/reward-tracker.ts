// 미션 진행 추적: 동작 전후 상태를 비교해 오늘의 미션 진행을 올리고, 방금 달성한 미션은 알림함에 알린다.
import { NOTIFICATION_LIMIT, type AppAction } from "@/features/core/app-reducer"; // 앱 동작
import type { AppNotification, AppState, MissionId } from "@/features/core/types"; // 상태 타입
import { recordInviteeMessages } from "@/features/rewards/referral-model"; // 초대받은 뒤 메시지 세기
import { dailyMissions, getMissionState, recordMissionProgress } from "@/features/rewards/reward-model"; // 미션 규칙
import { t } from "@/lib/i18n"; // 화면 글자 번역

function countMissionEvents(previous: AppState, next: AppState, action: AppAction): Array<[MissionId, number]> // 이번 동작으로 생긴 미션 진행
{ // 함수 시작
    if (action.type === "merge-chat-state") // 채팅 저장
    { // 조건 시작
        const known = new Set(previous.messages.filter((message) => message.conversationId === action.conversationId).map((message) => message.id)); // 이미 있던 메시지
        const sent = next.messages.filter((message) => message.conversationId === action.conversationId && message.role === "user" && !known.has(message.id)).length; // 새로 보낸 내 메시지
        const started = !previous.conversations.some((conversation) => conversation.id === action.conversationId) && next.conversations.some((conversation) => conversation.id === action.conversationId); // 처음 저장한 대화
        return [["send-messages", sent], ["start-conversation", started ? 1 : 0]]; // 메시지·새 대화
    } // 조건 종료
    if (action.type === "toggle-character-like") // 좋아요
    { // 조건 시작
        return [["favorite-work", next.likedCharacterIds.length > previous.likedCharacterIds.length ? 1 : 0]]; // 새로 누른 경우만
    } // 조건 종료
    if (action.type === "toggle-bookmark") // 보관
    { // 조건 시작
        return [["favorite-work", next.bookmarkedCharacterIds.length > previous.bookmarkedCharacterIds.length ? 1 : 0]]; // 새로 누른 경우만
    } // 조건 종료
    return []; // 그 밖의 동작(복원·설정 등)은 세지 않음
} // 함수 종료

export function trackRewardProgress(previous: AppState, next: AppState, action: AppAction, now: string): AppState // 동작 뒤 미션 진행 반영
{ // 함수 시작
    if (next === previous) // 변화 없음
    { // 조건 시작
        return next; // 그대로
    } // 조건 종료
    const date = new Date(now); // 기준 시각
    let rewards = next.rewards; // 보상 상태
    let referral = next.referral; // 친구 초대 상태
    const completed: MissionId[] = []; // 방금 달성한 미션
    for (const [missionId, amount] of countMissionEvents(previous, next, action)) // 진행 순회
    { // 순회 시작
        if (missionId === "send-messages") // 보낸 메시지
        { // 조건 시작
            referral = recordInviteeMessages(referral, amount); // 초대받은 사람이면 친구의 보상 조건으로도 셈
        } // 조건 종료
        const result = recordMissionProgress(rewards, missionId, amount, date); // 진행 기록
        rewards = result.rewards; // 반영
        if (result.completedNow) // 방금 달성
        { // 조건 시작
            completed.push(missionId); // 알림 대상
        } // 조건 종료
    } // 순회 종료
    if (rewards === next.rewards) // 미션 진행 없음
    { // 조건 시작
        return referral === next.referral ? next : { ...next, referral }; // 초대 조건만 반영
    } // 조건 종료
    const dateKey = getMissionState(rewards.missions, date).dateKey; // 미션 날짜
    const notices: AppNotification[] = completed.flatMap((missionId) => // 달성 알림
    { // 생성 시작
        const mission = dailyMissions.find((item) => item.id === missionId); // 미션 정의
        const id = `reward-mission-${dateKey}-${missionId}`; // 날짜·미션별 한 번
        return mission === undefined || next.notifications.some((item) => item.id === id) ? [] : [{ id, kind: "reward" as const, title: t("오늘의 미션 완료"), body: t("{0} · {1}토큰을 받을 수 있어요.", [mission.title, mission.reward]), href: "/rewards", read: false, createdAt: now }]; // 알림 반환
    }); // 생성 종료
    return { ...next, rewards, referral, notifications: notices.length === 0 ? next.notifications : [...notices, ...next.notifications].slice(0, NOTIFICATION_LIMIT) }; // 진행·알림 반영
} // 함수 종료
