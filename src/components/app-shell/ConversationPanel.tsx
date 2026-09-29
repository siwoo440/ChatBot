import type { Route } from "next"; // 경로 타입
import Link from "next/link"; // 내부 경로 링크
import { createConversationHref } from "@/features/character/character-detail-model"; // 대화 주소 생성
import { getConversationSummary } from "@/features/conversation/conversation-versioning"; // 대화 요약 조회
import type { AppState } from "@/features/core/types"; // 앱 상태 타입

interface ConversationPanelProps // 패널 속성
{ // 구조 시작
    state: AppState; // 앱 상태
    open: boolean; // 열림 상태
    onNavigate(): void; // 내부 이동 처리
} // 구조 종료

export function ConversationPanel({ state, open, onNavigate }: ConversationPanelProps) // 대화 패널
{ // 함수 시작
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
                    return summary === null ? null : ( // 요약 존재 판정
                        <li key={conversation.id} className="conversation-card" data-tone={index % 2 === 0 ? "primary" : "secondary"}> {/* 대화 항목 */}
                            <Link href={createConversationHref(conversation.characterId, conversation.id, conversation.currentVersionId) as Route} className="conversation-card-link" onClick={onNavigate}> {/* 대화 링크 */}
                                <strong>{conversation.title}</strong> {/* 대화 제목 */}
                                <span>{summary.lastMessage}</span> {/* 최근 메시지 */}
                            </Link> {/* 링크 종료 */}
                        </li> // 항목 종료
                    ); // 요약 조건 종료
                })} {/* 순회 종료 */}
            </ul> {/* 목록 종료 */}
            <Link href={"/library" as Route} className="conversation-library" onClick={onNavigate}>보관함</Link> {/* 보관함 링크 */}
        </aside> // 패널 종료
    ); // 반환 종료
} // 함수 종료
