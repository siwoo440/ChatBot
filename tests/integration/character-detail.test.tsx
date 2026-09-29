import { fireEvent, screen } from "@testing-library/react"; // 화면 테스트 도구
import userEvent from "@testing-library/user-event"; // 사용자 동작 도구
import { describe, expect, it } from "vitest"; // 테스트 도구
import { createInitialState } from "@/features/core/initial-state"; // 초기 상태
import { CharacterDetail, ensureConversationForCharacter } from "@/features/character/CharacterDetail"; // 캐릭터 상세
import { renderWithApp } from "@/test/render-with-app"; // 앱 렌더 도구

describe("캐릭터 상세 대화 시작", () => // 상세 묶음
{ // 묶음 시작
    it("기존 대화방을 재사용한다", () => // 재사용 검증
    { // 검증 시작
        const state = createInitialState(); // 초기 상태
        const result = ensureConversationForCharacter(state, "rian", "2026-09-23T00:00:00.000Z"); // 대화 준비
        expect(result.conversation.id).toBe("conversation-rian"); // 기존 식별자
        expect(result.state.conversations).toHaveLength(state.conversations.length); // 개수 유지
        expect(result.href).toBe("/chat/rian"); // 이동 경로
    }); // 검증 종료

    it("대화방이 없으면 하나만 생성한다", () => // 생성 검증
    { // 검증 시작
        const state = createInitialState(); // 초기 상태
        const result = ensureConversationForCharacter(state, "harin", "2026-09-23T00:00:00.000Z"); // 첫 생성
        const repeated = ensureConversationForCharacter(result.state, "harin", "2026-09-23T00:01:00.000Z"); // 재호출
        expect(repeated.state.conversations.filter((conversation) => conversation.characterId === "harin")).toHaveLength(1); // 단일 생성
        expect(result.conversation.startSettings).toEqual({ profileId: "user-demo", presetId: "legacy-default", relationshipStage: "첫 만남", relationshipLevel: 0, emotion: "호기심", scene: "/images/scenes/fallback-scene.svg", greeting: "오늘은 평소보다 조금 지쳐 보여. 따뜻한 걸로 준비해도 될까?" }); // 시작 설정 확인
        expect(repeated.href).toBe("/chat/harin"); // 이동 경로
    }); // 검증 종료

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
}); // 묶음 종료
