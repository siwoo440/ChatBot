// 서버 통로: 브라우저와 AI 회사 사이에 서서 열쇠를 숨기고, 지시문을 조립해 보내고, 답을 글자 조각으로 흘려보낸다. 열쇠가 없거나 꺼져 있으면 브라우저가 연습용 AI로 답한다.
import { getChatTier } from "@/features/chat/chat-tiers"; // 채팅 등급
import { identifyCaller } from "@/lib/llm/chat-caller"; // 요청한 사람 확인
import { readChatBody, refuse, refuseProviderFailure } from "@/lib/llm/chat-request"; // 통로 공통
import { refundChat, reserveChat, settleChat } from "@/lib/wallet/chat-billing"; // 서버 사용 예약
import { getLocalModelNames, getTierAvailability, isRealChatEnabled, resolveModel } from "@/lib/llm/model-catalog"; // 모델 목록
import { buildChatPrompt, parseChatRequest } from "@/lib/llm/prompt-builder"; // 지시문 만들기
import { streamProviderReply } from "@/lib/llm/providers"; // AI 회사 연결

export const runtime = "nodejs"; // 서버(Node)에서 실행
export const dynamic = "force-dynamic"; // 요청마다 새로 실행(미리 만들어 두지 않음)

export async function GET(request: Request): Promise<Response> // 등급별로 실제 AI를 쓸 수 있는지 알려 주기(열쇠 값은 내보내지 않음)
{ // 함수 시작
    const caller = await identifyCaller(request); // 누가 묻는지
    const allowed = caller.kind !== "refused"; // 이 요청에 허용되는지(내 컴퓨터이거나, 공개를 켰고 로그인한 사람)
    const availability = getTierAvailability(); // 등급별 가능 여부
    const tiers = Object.fromEntries(Object.entries(availability).map(([tier, ready]) => [tier, allowed && ready])); // 허용되지 않으면 모두 불가
    const loginRequired = caller.kind === "refused" && caller.code === "login-required" && isRealChatEnabled() ? { loginRequired: true } : {}; // 공개를 켰는데 로그인하지 않았으면 로그인하면 된다고 알림
    return Response.json({ enabled: allowed && isRealChatEnabled(), tiers, models: allowed ? getLocalModelNames() : {}, ...loginRequired }, { headers: { "cache-control": "no-store" } }); // 상태 반환(내 컴퓨터 모델은 이름도 알려 줌)
} // 함수 종료

export async function POST(request: Request): Promise<Response> // 답변 받기
{ // 함수 시작
    const body = await readChatBody(request); // 스위치·보낸 곳·크기 확인
    if (!body.ok) // 거절
    { // 조건 시작
        return body.response; // 거절 응답
    } // 조건 종료
    const chat = parseChatRequest(body.payload); // 검사와 정리
    if (chat === null) // 모양이 다름
    { // 조건 시작
        return refuse(400, "bad-request"); // 거절
    } // 조건 종료
    if (chat.character.contentRating === "mature" && !getChatTier(chat.tier).mature) // 19세 작품을 외부 AI 등급으로 요청
    { // 조건 시작
        return refuse(422, "mature-not-supported"); // 외부 AI 약관 때문에 연습용으로(직접 돌리는 공개 모델 등급만 답함)
    } // 조건 종료
    const model = resolveModel(chat.tier); // 등급의 모델
    if (model === null) // 열쇠 없음
    { // 조건 시작
        return refuse(503, "no-key"); // 연습용으로
    } // 조건 종료
    const reservation = await reserveChat(request, body.caller, chat, body.payload); // 잔액·요청 중복·영속 한도 검사
    if (!reservation.ok) // 예약 실패
    { // 조건 시작
        return reservation.response; // 실제 호출 전 거절
    } // 조건 종료
    const signal = AbortSignal.any([request.signal, AbortSignal.timeout(120000)]); // 요청 중단과 2분 제한
    const iterator = streamProviderReply(model, buildChatPrompt(chat), fetch, signal)[Symbol.asyncIterator](); // 답 흐름
    let first: IteratorResult<string>; // 첫 조각
    try // 첫 조각 받기(여기서 실패하면 오류 코드로 알릴 수 있음)
    { // 시도 시작
        do // 빈 조각 건너뛰기
        { // 반복 시작
            first = await iterator.next(); // 첫 유효 조각
        } while (first.done !== true && first.value.trim().length === 0); // 공백 조각 제외
        if (first.done === true || signal.aborted) // 응답 전 실패·중단
        { // 조건 시작
            throw new Error("empty or cancelled reply"); // 반환 경로
        } // 조건 종료
        const denied = await settleChat(reservation.billing); // 응답 직전 차감 확정
        if (denied !== null) // 확정 실패·반환된 예약
        { // 조건 시작
            await iterator.return?.(); // 회사 흐름 닫기
            await refundChat(reservation.billing); // 남은 미확정 예약 반환
            return denied; // 무료 응답 방지
        } // 조건 종료
    } // 시도 종료
    catch (error) // 회사 오류
    { // 실패 시작
        await iterator.return?.().catch(() => undefined); // 응답 전 흐름 정리
        await refundChat(reservation.billing); // 응답 전 비용 반환
        return refuseProviderFailure(error, model.provider === "local"); // 이유 알림
    } // 실패 종료
    const encoder = new TextEncoder(); // 글자 변환
    const stream = new ReadableStream<Uint8Array>( // 브라우저로 보내는 흐름
    { // 흐름 시작
        async start(controller) // 보내기
        { // 함수 시작
            try // 보내기 시도
            { // 시도 시작
                for (let result: IteratorResult<string> = first; result.done !== true; result = await iterator.next()) // 조각 순회
                { // 순회 시작
                    controller.enqueue(encoder.encode(result.value)); // 조각 보냄
                } // 순회 종료
                controller.close(); // 끝
            } // 시도 종료
            catch (error) // 도중 오류
            { // 실패 시작
                controller.error(error); // 흐름을 오류로 끝냄(브라우저가 재시도 안내)
            } // 실패 종료
        }, // 함수 종료
        async cancel() // 브라우저가 중단함
        { // 함수 시작
            await iterator.return?.(); // 회사 쪽 흐름도 닫음
        }, // 함수 종료
    }); // 흐름 종료
    return new Response(stream, { headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store", "x-chat-model": model.model } }); // 답 반환
} // 함수 종료
