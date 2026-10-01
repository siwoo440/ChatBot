import type { Route } from "next"; // 경로 타입
import Link from "next/link"; // 내부 경로 링크
import { canViewMatureContent, isMatureCharacter } from "@/features/adult/adult-access"; // 19세 콘텐츠 판정
import { createConversationHref } from "@/features/character/character-detail-model"; // 대화 주소 생성
import { getConversationSummary } from "@/features/conversation/conversation-versioning"; // 대화 요약 조회
import type { AppState } from "@/features/core/types"; // 앱 상태 타입
import { getGenreKey } from "@/lib/theme/genre-theme"; // 장르 색 조회

interface ConversationPanelProps // 패널 속성
{ // 구조 시작
    state: AppState; // 앱 상태
    open: boolean; // 열림 상태
    onNavigate(): void; // 내부 이동 처리
} // 구조 종료

export function ConversationPanel({ state, open, onNavigate }: ConversationPanelProps) // 대화 패널
{ // 함수 시작
    const showMature = canViewMatureContent(state, new Date()); // 19세 콘텐츠 표시 여부
    return ( // 패널 반환
        <aside id="conversation-panel" className="conversation-panel" role="complementary" aria-label="진행 중인 대화방" aria-hidden={!open}> {/* 대화 패널 */}
            <div className="conversation-panel-heading"> {/* 제목 영역 */}
                <span>MY CHATS</span> {/* 제목 표제 */}
                <h2>대화방</h2> {/* 패널 제목 */}
            </div> {/* 제목 영역 종료 */}
            <Link href={"/characters/new" as Route} className="conversation-create" onClick={onNavigate}>＋ 새 캐릭터 만들기</Link> {/* 제작 링크 */}
            <ul className="conversation-list"> {/* 대화 목록 */}
                {state.conversations.map((conversation, index) => // 대화 순회
                { // 순회 시작
                    const summary = getConversationSummary(state, conversation.id); // 대화 요약 조회
                    const character = state.characters.find((item) => item.id === conversation.characterId); // 대화 캐릭터 조회
                    const locked = character !== undefined && isMatureCharacter(character) && !showMature; // 19세 잠금 여부
                    return summary === null ? null : ( // 요약 존재 판정
                        <li key={conversation.id} className="conversation-card" data-tone={index % 2 === 0 ? "primary" : "secondary"} data-genre={getGenreKey(character?.tags ?? [])} data-locked={locked ? "true" : undefined}> {/* 대화 항목 */}
                            <Link href={createConversationHref(conversation.characterId, conversation.id, conversation.currentVersionId) as Route} className="conversation-card-link" onClick={onNavigate}> {/* 대화 링크 */}
                                <strong>{conversation.title}</strong> {/* 대화 제목 */}
                                <span>{locked ? "19+ 잠금 · 19+를 켜면 대화를 볼 수 있습니다." : summary.lastMessage}</span> {/* 최근 메시지 */}
                            </Link> {/* 링크 종료 */}
                        </li> // 항목 종료
                    ); // 요약 조건 종료
                })} {/* 순회 종료 */}
            </ul> {/* 목록 종료 */}
            <Link href={"/library" as Route} className="conversation-library" onClick={onNavigate}>보관함</Link> {/* 보관함 링크 */}
        </aside> // 패널 종료
    ); // 반환 종료
} // 함수 종료
