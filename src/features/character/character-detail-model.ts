import { characterDetailProfiles } from "@/features/character/character-detail-data"; // 상세 프로필 데이터
import type { Character, CharacterDetailProfile, Conversation } from "@/features/core/types"; // 도메인 타입

function createFallbackProfile(character: Character): CharacterDetailProfile // 기본 상세 프로필 생성
{ // 함수 시작
    const prologueId = `${character.id}-default`; // 기본 프롤로그 식별자
    return ( // 프로필 반환
    { // 프로필 시작
        characterId: character.id, // 캐릭터 식별자
        accentColor: "#8ea4ff", // 기본 강조 색상
        badges: [...character.tags], // 기존 태그 배지
        contentRating: "all", // 안전 기본 등급
        contentWarnings: [], // 미확인 경고 제외
        dialogueStyle: character.summary, // 기존 소개 활용
        relationshipSetup: character.worldSetting, // 기존 세계관 활용
        startPresets: // 기본 프리셋 목록
        [ // 목록 시작
            { id: "default", name: "기본 설정", description: character.worldSetting, relationshipStage: "첫 만남", relationshipLevel: 0, emotion: "호기심", scene: character.coverImage, greeting: character.greeting, prologueId }, // 기본 프리셋
        ], // 목록 종료
        prologues: // 기본 프롤로그 목록
        [ // 목록 시작
            { id: prologueId, title: character.name, description: character.worldSetting, image: character.coverImage, imageAlt: `${character.name}의 시작 장면`, greeting: character.greeting }, // 기본 프롤로그
        ], // 목록 종료
        releaseNotes: [], // 미확인 업데이트 제외
        sampleMetrics: { conversations: character.popularity, bookmarks: null, ratings: null }, // 확인 가능 지표
        relatedCharacterIds: [], // 기본 연관 목록
    }); // 프로필 종료
} // 함수 종료

export function getCharacterDetailProfile(character: Character): CharacterDetailProfile // 상세 프로필 조회
{ // 함수 시작
    const profile = characterDetailProfiles[character.id]; // 정적 프로필 조회
    return structuredClone(profile ?? createFallbackProfile(character)); // 독립 프로필 반환
} // 함수 종료

function collectWorldKeywords(value: string): Set<string> // 세계관 키워드 수집
{ // 함수 시작
    const words = value.split(/[^가-힣a-zA-Z0-9]+/).filter((word) => word.length >= 2); // 의미 단어 분리
    return new Set(words); // 고유 단어 반환
} // 함수 종료

export function getRelatedCharacters(character: Character, allCharacters: Character[], limit = 8): Character[] // 연관 캐릭터 조회
{ // 함수 시작
    const sourceTags = new Set(character.tags); // 기준 태그 집합
    const sourceWords = collectWorldKeywords(character.worldSetting); // 기준 세계관 단어
    const curatedIds = getCharacterDetailProfile(character).relatedCharacterIds; // 기획 연관 목록
    const scored = allCharacters.filter((candidate) => candidate.id !== character.id && candidate.visibility === "public" && candidate.publicationStatus === "published").map((candidate) => // 공개 후보 점수화
    { // 점수화 시작
        const tagScore = candidate.tags.filter((tag) => sourceTags.has(tag)).length * 10; // 태그 일치 점수
        const worldScore = [...collectWorldKeywords(candidate.worldSetting)].filter((word) => sourceWords.has(word)).length; // 세계관 일치 점수
        const curatedIndex = curatedIds.indexOf(candidate.id); // 기획 순서 조회
        const curatedScore = curatedIndex < 0 ? 0 : 100 - curatedIndex; // 기획 우선 점수
        return { character: candidate, score: curatedScore + tagScore + worldScore }; // 점수 결과 반환
    }); // 점수화 종료
    return scored.sort((left, right) => right.score - left.score || right.character.popularity - left.character.popularity || left.character.id.localeCompare(right.character.id)).slice(0, Math.max(0, limit)).map((entry) => entry.character); // 정렬 목록 반환
} // 함수 종료

export function getLatestActiveConversation(conversations: Conversation[], characterId: string): Conversation | null // 최근 활성 대화 조회
{ // 함수 시작
    const matches = conversations.filter((conversation) => conversation.characterId === characterId && conversation.archivedAt === null); // 활성 대화 목록
    return matches.sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))[0] ?? null; // 최신 대화 반환
} // 함수 종료
