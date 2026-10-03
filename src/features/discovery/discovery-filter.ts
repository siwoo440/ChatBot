// 메인 탐색의 정렬과 필터: 검색어·장르(여러 개)·이용 등급·처음 만나는 캐릭터·관심 목록을 함께 걸고, 고른 순서로 늘어놓는다.
import type { AppState, Character, ContentRating } from "@/features/core/types"; // 도메인 타입

export type DiscoverySort = "recommended" | "popular" | "latest" | "name"; // 정렬 방법
export type RatingFilter = "any" | ContentRating; // 이용 등급 조건

export interface DiscoveryFilter // 탐색 조건
{ // 구조 시작
    query: string; // 검색어
    genres: string[]; // 고른 장르(하나라도 맞으면 통과, 비면 전체)
    rating: RatingFilter; // 이용 등급
    onlyNew: boolean; // 아직 대화하지 않은 캐릭터만
    onlyInterest: boolean; // 좋아요·보관한 캐릭터만
    sort: DiscoverySort; // 정렬
} // 구조 종료

export const discoverySorts: Array<{ id: DiscoverySort; label: string }> = [{ id: "recommended", label: "추천순" }, { id: "popular", label: "인기순" }, { id: "latest", label: "최신순" }, { id: "name", label: "이름순" }]; // 정렬 선택지
export const ratingFilters: Array<{ id: RatingFilter; label: string }> = [{ id: "any", label: "모든 등급" }, { id: "all", label: "전체 이용가" }, { id: "teen", label: "15세 이용가" }, { id: "mature", label: "19세 이용가" }]; // 등급 선택지

export function createDiscoveryFilter(): DiscoveryFilter // 처음 조건(아무것도 걸지 않음)
{ // 함수 시작
    return { query: "", genres: [], rating: "any", onlyNew: false, onlyInterest: false, sort: "recommended" }; // 기본 조건
} // 함수 종료

export function countActiveFilters(filter: DiscoveryFilter): number // 걸려 있는 조건 수(검색어·장르·등급·두 선택, 정렬은 세지 않음)
{ // 함수 시작
    return (filter.query.trim().length > 0 ? 1 : 0) + filter.genres.length + (filter.rating === "any" ? 0 : 1) + (filter.onlyNew ? 1 : 0) + (filter.onlyInterest ? 1 : 0); // 조건 수
} // 함수 종료

export function isDefaultFilter(filter: DiscoveryFilter): boolean // 아무 조건도 없고 추천순인지(기본 화면)
{ // 함수 시작
    return countActiveFilters(filter) === 0 && filter.sort === "recommended"; // 기본 판정
} // 함수 종료

export function toggleGenre(genres: readonly string[], genre: string): string[] // 장르 넣고 빼기
{ // 함수 시작
    return genres.includes(genre) ? genres.filter((item) => item !== genre) : [...genres, genre]; // 다음 장르
} // 함수 종료

export function getTalkedCharacterIds(state: Pick<AppState, "conversations">): Set<string> // 대화해 본 캐릭터(스토리 등장인물 포함)
{ // 함수 시작
    return new Set(state.conversations.flatMap((conversation) => conversation.mode === "story" ? conversation.storyCast.map((member) => member.characterId) : [conversation.characterId])); // 대화 인물
} // 함수 종료

export function getInterestCharacterIds(state: Pick<AppState, "likedCharacterIds" | "bookmarkedCharacterIds">): Set<string> // 좋아요·보관한 캐릭터
{ // 함수 시작
    return new Set([...state.likedCharacterIds, ...state.bookmarkedCharacterIds]); // 관심 캐릭터
} // 함수 종료

export function applyDiscoveryFilter(characters: readonly Character[], filter: DiscoveryFilter, context: { talkedIds: ReadonlySet<string>; interestIds: ReadonlySet<string> }): Character[] // 조건을 걸고 정렬하기
{ // 함수 시작
    const query = filter.query.trim().toLowerCase(); // 검색어 정리
    const matched = characters.filter((character) => // 조건 순회
    { // 순회 시작
        const text = `${character.name} ${character.summary} ${character.worldSetting} ${character.tags.join(" ")}`.toLowerCase(); // 검색 대상
        return (query.length === 0 || text.includes(query)) // 검색어
            && (filter.genres.length === 0 || filter.genres.some((genre) => character.tags.includes(genre))) // 장르(하나라도)
            && (filter.rating === "any" || character.contentRating === filter.rating) // 이용 등급
            && (!filter.onlyNew || !context.talkedIds.has(character.id)) // 처음 만나는 캐릭터
            && (!filter.onlyInterest || context.interestIds.has(character.id)); // 관심 목록
    }); // 순회 종료
    if (filter.sort === "popular") // 인기순
    { // 조건 시작
        return matched.sort((left, right) => right.popularity - left.popularity || left.name.localeCompare(right.name, "ko")); // 대화 수가 많은 순
    } // 조건 종료
    if (filter.sort === "latest") // 최신순
    { // 조건 시작
        return matched.sort((left, right) => right.updatedAt.localeCompare(left.updatedAt) || left.name.localeCompare(right.name, "ko")); // 최근에 고친 순
    } // 조건 종료
    if (filter.sort === "name") // 이름순
    { // 조건 시작
        return matched.sort((left, right) => left.name.localeCompare(right.name, "ko")); // 가나다순
    } // 조건 종료
    return matched; // 추천순(원래 순서)
} // 함수 종료
