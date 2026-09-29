import { fireEvent, screen } from "@testing-library/react"; // 화면 테스트 도구
import userEvent from "@testing-library/user-event"; // 사용자 동작 도구
import { beforeEach, describe, expect, it, vi } from "vitest"; // 테스트 도구
import { createInitialState } from "@/features/core/initial-state"; // 초기 상태
import { CharacterDetail } from "@/features/character/CharacterDetail"; // 캐릭터 상세
import { useAppStore } from "@/features/core/AppProvider"; // 앱 상태 훅
import { renderWithApp } from "@/test/render-with-app"; // 앱 렌더 도구

const routerPush = vi.hoisted(() => vi.fn()); // 경로 이동 기록

vi.mock("next/navigation", () => // 경로 도구 대체
({ // 대체 시작
    useRouter: () => ({ push: routerPush }), // 이동 함수 제공
})); // 대체 종료

function CharacterConversationProbe({ characterId }: { characterId: string }) // 대화 확인 요소
{ // 함수 시작
    const { state } = useAppStore(); // 앱 상태 조회
    const conversations = state.conversations.filter((conversation) => conversation.characterId === characterId); // 캐릭터 대화 조회
    return <output aria-label={`${characterId} 대화 식별자`}>{conversations.map((conversation) => conversation.id).join("|")}</output>; // 식별자 출력
} // 함수 종료

describe("캐릭터 상세 대화 시작", () => // 상세 묶음
{ // 묶음 시작
    beforeEach(() => // 테스트 초기화
    { // 초기화 시작
        routerPush.mockReset(); // 이동 기록 초기화
    }); // 초기화 종료

    it("하린의 히어로 정보와 샘플 지표를 표시한다", () => // 히어로 표시 검증
    { // 검증 시작
        renderWithApp(<CharacterDetail characterId="harin" />); // 상세 화면 렌더
        expect(screen.getByRole("heading", { level: 1, name: "퇴근길 카페의 하린" })).toBeVisible(); // 캐릭터 이름 확인
        expect(screen.getByText("저녁다섯시")).toBeVisible(); // 제작자 확인
        expect(screen.getByText("매일 같은 시간 당신의 표정을 먼저 알아보는 바리스타")).toBeVisible(); // 소개 확인
        expect(screen.getByText("따뜻한 위로")).toBeVisible(); // 배지 확인
        expect(screen.getByText("전체 이용가")).toBeVisible(); // 등급 확인
        expect(screen.getByText("#일상")).toBeVisible(); // 태그 확인
        expect(screen.getByText("샘플 데이터")).toBeVisible(); // 샘플 표시 확인
        expect(screen.getByRole("button", { name: "퇴근길 카페의 하린 좋아요" })).toBeVisible(); // 좋아요 동작 확인
        expect(screen.getByRole("button", { name: "퇴근길 카페의 하린 공유" })).toBeVisible(); // 공유 동작 확인
    }); // 검증 종료

    it("성격과 세계관을 포함한 스토리 정보를 표시한다", () => // 스토리 정보 검증
    { // 검증 시작
        renderWithApp(<CharacterDetail characterId="harin" />); // 상세 화면 렌더
        expect(screen.getByRole("heading", { name: "캐릭터 소개" })).toBeVisible(); // 소개 제목 확인
        expect(screen.getByRole("heading", { name: "성격" })).toBeVisible(); // 성격 제목 확인
        expect(screen.getByRole("heading", { name: "세계관" })).toBeVisible(); // 세계관 제목 확인
        expect(screen.getByRole("heading", { name: "관계 설정" })).toBeVisible(); // 관계 제목 확인
        expect(screen.getByRole("heading", { name: "대화 스타일" })).toBeVisible(); // 대화 제목 확인
        expect(screen.getByRole("heading", { name: "콘텐츠 주의 사항" })).toBeVisible(); // 주의 제목 확인
        expect(screen.getByText("직장 피로 언급")).toBeVisible(); // 주의 내용 확인
    }); // 검증 종료

    it("긴 상세 설명을 전체 보기와 접기로 전환한다", async () => // 설명 확장 검증
    { // 검증 시작
        const user = userEvent.setup(); // 사용자 도구 생성
        const state = createInitialState(); // 초기 상태 생성
        const index = state.characters.findIndex((character) => character.id === "harin"); // 하린 위치 조회
        state.characters[index] = { ...state.characters[index], description: "아주 긴 하루의 이야기를 천천히 들어 주는 장면. ".repeat(24) }; // 긴 설명 적용
        renderWithApp(<CharacterDetail characterId="harin" />, state); // 상세 화면 렌더
        const expand = screen.getByRole("button", { name: "캐릭터 상세 전체 보기" }); // 확장 버튼 조회
        expect(expand).toHaveAttribute("aria-expanded", "false"); // 접힌 상태 확인
        await user.click(expand); // 전체 보기 실행
        expect(screen.getByRole("button", { name: "캐릭터 상세 접기" })).toHaveAttribute("aria-expanded", "true"); // 펼친 상태 확인
    }); // 검증 종료

    it("상세 프로필이 없는 캐릭터도 기본 상세 화면을 표시한다", () => // 기본 화면 검증
    { // 검증 시작
        const state = createInitialState(); // 초기 상태 생성
        const character = state.characters.find((item) => item.id === "rank-008")!; // 랭킹 캐릭터 조회
        renderWithApp(<CharacterDetail characterId={character.id} />, state); // 상세 화면 렌더
        expect(screen.getByRole("heading", { level: 1, name: character.name })).toBeVisible(); // 이름 확인
        expect(screen.getAllByText(character.summary)[0]).toBeVisible(); // 기존 소개 확인
        expect(screen.getAllByText("확인되지 않음")).toHaveLength(2); // 미확인 지표 확인
    }); // 검증 종료

    it("대표 이미지 오류 시 캐릭터 색상의 대체 화면을 표시한다", () => // 이미지 오류 검증
    { // 검증 시작
        renderWithApp(<CharacterDetail characterId="harin" />); // 상세 화면 렌더
        fireEvent.error(screen.getByRole("img", { name: "퇴근길 카페의 하린 대표 이미지" })); // 이미지 오류 발생
        expect(screen.getByRole("img", { name: "퇴근길 카페의 하린 이미지 대체 화면" })).toBeVisible(); // 대체 화면 확인
        expect(screen.getByText("장면 이미지를 불러오지 못했습니다.")).toBeVisible(); // 오류 안내 확인
    }); // 검증 종료

    it("시작 설정을 바꾸면 연결된 프롤로그와 첫 대사를 함께 갱신한다", async () => // 프리셋 전환 검증
    { // 검증 시작
        const user = userEvent.setup(); // 사용자 도구 생성
        renderWithApp(<CharacterDetail characterId="harin" />); // 상세 화면 렌더
        expect(screen.getByRole("heading", { name: "비가 머무는 저녁" })).toBeVisible(); // 기본 프롤로그 확인
        await user.click(screen.getByRole("radio", { name: /마감 뒤의 한 잔/ })); // 둘째 프리셋 선택
        expect(screen.getByRole("heading", { name: "마지막 손님" })).toBeVisible(); // 변경 제목 확인
        expect(screen.getByText("마감 표지판이 뒤집힌 뒤 하린이 조용히 맞은편 자리를 권한다.")).toBeVisible(); // 변경 설명 확인
        expect(screen.getByText("오늘 마지막 잔은 네 거야. 천천히 마시면서 이야기해 줘.")).toBeVisible(); // 변경 대사 확인
    }); // 검증 종료

    it("최근 활성 대화를 선택해 이어하기로 이동한다", async () => // 이어하기 검증
    { // 검증 시작
        const user = userEvent.setup(); // 사용자 도구 생성
        const state = createInitialState(); // 초기 상태 생성
        const base = state.conversations[0]; // 기준 대화 조회
        state.conversations.push({ ...base, id: "conversation-harin-older", characterId: "harin", title: "오래된 하린 대화", updatedAt: "2026-09-28T09:00:00.000Z" }); // 이전 대화 추가
        state.conversations.push({ ...base, id: "conversation-harin-latest", characterId: "harin", title: "최근 하린 대화", updatedAt: "2026-09-29T09:00:00.000Z" }); // 최신 대화 추가
        renderWithApp(<><CharacterDetail characterId="harin" /><CharacterConversationProbe characterId="harin" /></>, state); // 상세 화면 렌더
        expect(screen.getByText("최근 하린 대화")).toBeVisible(); // 최근 대화 표시 확인
        await user.click(screen.getByRole("button", { name: "최근 대화 이어하기" })); // 이어하기 실행
        expect(routerPush).toHaveBeenCalledWith("/chat/harin"); // 대화 경로 확인
    }); // 검증 종료

    it("새 대화 시작을 빠르게 두 번 눌러도 대화를 하나만 만든다", async () => // 중복 생성 검증
    { // 검증 시작
        const user = userEvent.setup(); // 사용자 도구 생성
        renderWithApp(<><CharacterDetail characterId="harin" /><CharacterConversationProbe characterId="harin" /></>); // 상세 화면 렌더
        await user.dblClick(screen.getByRole("button", { name: "새 대화 시작" })); // 빠른 두 번 클릭
        const identifiers = screen.getByLabelText("harin 대화 식별자").textContent?.split("|").filter(Boolean) ?? []; // 생성 식별자 조회
        expect(identifiers).toHaveLength(1); // 단일 생성 확인
        expect(routerPush).toHaveBeenCalledTimes(1); // 단일 이동 확인
    }); // 검증 종료
}); // 묶음 종료
