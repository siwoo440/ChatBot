import type { Message } from "@/features/core/types"; // 메시지 타입

interface MessageListProps // 메시지 목록 속성
{ // 구조 시작
    messages: Message[]; // 대화 메시지
    streamingMessageId?: string | null; // 스트리밍 메시지 식별자
    allowRegenerate?: boolean; // 다시 생성 허용
    onRegenerate?: () => void; // 다시 생성 처리
} // 구조 종료

export function MessageList({ messages, streamingMessageId = null, allowRegenerate = false, onRegenerate }: MessageListProps) // 메시지 목록
{ // 함수 시작
    const lastUserIndex = messages.findLastIndex((message) => message.role === "user"); // 마지막 사용자 위치
    const lastAssistantIndex = messages.findLastIndex((message) => message.role === "assistant"); // 마지막 응답 위치
    const lastAssistantId = lastAssistantIndex > lastUserIndex && lastUserIndex >= 0 ? messages[lastAssistantIndex]?.id ?? null : null; // 유효 응답 식별자
    return ( // 목록 반환
        <ol aria-label="대화 메시지" aria-live="polite" aria-busy={streamingMessageId !== null}> {/* 메시지 영역 */}
            {messages.map((message) => ( // 메시지 순회
                <li key={message.id} data-role={message.role} data-streaming={message.id === streamingMessageId ? "true" : undefined}> {/* 메시지 항목 */}
                    <strong>{message.role === "user" ? "나" : "캐릭터"}</strong> {/* 메시지 작성자 */}
                    <p>{message.content.length === 0 && message.id === streamingMessageId ? "응답 작성 중…" : message.content}</p> {/* 메시지 내용 */}
                    {allowRegenerate && message.id === lastAssistantId && onRegenerate !== undefined ? <button type="button" onClick={onRegenerate}>다시 생성</button> : null} {/* 다시 생성 버튼 */}
                </li> // 항목 종료
            ))} {/* 순회 종료 */}
        </ol> // 영역 종료
    ); // 반환 종료
} // 함수 종료
