import { describe, expect, it } from "vitest"; // 테스트 도구
import { getCharacterDetailProfile, getLatestActiveConversation, getRelatedCharacters } from "@/features/character/character-detail-model"; // 상세 선택 함수
import { createInitialState } from "@/features/core/initial-state"; // 초기 상태 함수

describe("캐릭터 상세 모델", () => // 상세 모델 묶음
{ // 묶음 시작
    it("하린의 상세 프로필과 기본 시작 구성을 반환한다", () => // 하린 프로필 검증
    { // 검증 시작
        const character = createInitialState().characters.find((item) => item.id === "harin"); // 하린 조회
        expect(character).toBeDefined(); // 하린 존재 확인
        const profile = getCharacterDetailProfile(character!); // 상세 프로필 조회
        expect(profile.characterId).toBe("harin"); // 식별자 확인
        expect(profile.accentColor).toBe("#f4a261"); // 강조색 확인
        expect(profile.contentRating).toBe("all"); // 콘텐츠 등급 확인
        expect(profile.startPresets[0]?.id).toBe("after-work-comfort"); // 기본 프리셋 확인
        expect(profile.prologues[0]?.image).toBe("/images/characters/prologues/harin-prologue-v1.png"); // 프롤로그 경로 확인
        expect(profile.releaseNotes[0]?.version).toBe("1.2.0"); // 업데이트 버전 확인
    }); // 검증 종료

    it("상세 데이터가 없는 캐릭터는 기존 정보만으로 안전한 기본 프로필을 만든다", () => // 기본 프로필 검증
    { // 검증 시작
        const character = createInitialState().characters.find((item) => item.id === "rank-008"); // 랭킹 캐릭터 조회
        expect(character).toBeDefined(); // 캐릭터 존재 확인
        const profile = getCharacterDetailProfile(character!); // 기본 프로필 조회
        expect(profile.characterId).toBe("rank-008"); // 식별자 확인
        expect(profile.badges).toEqual(character!.tags); // 태그 배지 확인
        expect(profile.contentWarnings).toEqual([]); // 미확인 경고 제외
        expect(profile.dialogueStyle).toBe(character!.summary); // 기존 소개 활용 확인
        expect(profile.relationshipSetup).toBe(character!.worldSetting); // 기존 세계관 활용 확인
        expect(profile.startPresets[0]?.greeting).toBe(character!.greeting); // 기존 첫 대사 확인
        expect(profile.prologues[0]?.image).toBe(character!.coverImage); // 기존 이미지 확인
        expect(profile.sampleMetrics).toEqual({ conversations: character!.popularity, bookmarks: null, ratings: null }); // 확인 가능 지표 확인
    }); // 검증 종료

    it("연관 캐릭터는 자신과 비공개 항목을 제외하고 태그 일치 순으로 제한한다", () => // 연관 정렬 검증
    { // 검증 시작
        const state = createInitialState(); // 초기 상태 생성
        const character = state.characters.find((item) => item.id === "harin")!; // 기준 캐릭터 조회
        const closeMatch = { ...state.characters.find((item) => item.id === "miel")!, id: "close-match", tags: ["일상", "힐링", "로맨스"], popularity: 10 }; // 세 태그 일치 캐릭터
        const looseMatch = { ...state.characters.find((item) => item.id === "yuna")!, id: "loose-match", tags: ["일상"], popularity: 999999 }; // 한 태그 일치 캐릭터
        const privateMatch = { ...state.characters.find((item) => item.id === "sera")!, id: "private-match", tags: ["일상", "힐링", "로맨스"], visibility: "private" as const }; // 비공개 캐릭터
        const related = getRelatedCharacters(character, [character, looseMatch, privateMatch, closeMatch], 2); // 연관 목록 조회
        expect(related.map((item) => item.id)).toEqual(["close-match", "loose-match"]); // 정렬 결과 확인
    }); // 검증 종료

    it("가장 최근에 갱신된 활성 대화를 선택한다", () => // 최근 대화 검증
    { // 검증 시작
        const state = createInitialState(); // 초기 상태 생성
        const base = state.conversations.find((conversation) => conversation.characterId === "rian")!; // 기준 대화 조회
        const older = { ...base, id: "conversation-rian-older", updatedAt: "2026-09-20T00:00:00.000Z" }; // 이전 활성 대화
        const newer = { ...base, id: "conversation-rian-newer", updatedAt: "2026-09-29T00:00:00.000Z" }; // 최신 활성 대화
        const archived = { ...base, id: "conversation-rian-archived", archivedAt: "2026-09-30T00:00:00.000Z", updatedAt: "2026-09-30T00:00:00.000Z" }; // 보관 대화
        expect(getLatestActiveConversation([older, archived, newer], "rian")?.id).toBe("conversation-rian-newer"); // 최신 활성 대화 확인
    }); // 검증 종료

    it("보관 대화만 있으면 최근 활성 대화를 반환하지 않는다", () => // 보관 제외 검증
    { // 검증 시작
        const state = createInitialState(); // 초기 상태 생성
        const base = state.conversations.find((conversation) => conversation.characterId === "rian")!; // 기준 대화 조회
        const archived = { ...base, archivedAt: "2026-09-29T00:00:00.000Z" }; // 보관 대화 생성
        expect(getLatestActiveConversation([archived], "rian")).toBeNull(); // 빈 결과 확인
    }); // 검증 종료
}); // 묶음 종료
