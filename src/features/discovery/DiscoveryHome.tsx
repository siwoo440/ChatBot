"use client"; // 클라이언트 컴포넌트

import type { Route } from "next"; // 경로 타입
import Link from "next/link"; // 내부 링크
import { useMemo, useState } from "react"; // 리액트 상태
import { canViewMatureContent, getDiscoverableCharacters } from "@/features/adult/adult-access"; // 19세 콘텐츠 필터
import { useAppStore } from "@/features/core/AppProvider"; // 앱 상태
import { CategoryFilter } from "@/features/discovery/CategoryFilter"; // 카테고리 필터
import { CharacterRail } from "@/features/discovery/CharacterRail"; // 캐릭터 레일
import { applyDiscoveryFilter, countActiveFilters, createDiscoveryFilter, discoverySorts, getInterestCharacterIds, getTalkedCharacterIds, isDefaultFilter, ratingFilters, toggleGenre, type DiscoveryFilter, type DiscoverySort, type RatingFilter } from "@/features/discovery/discovery-filter"; // 정렬과 필터
import { FeaturedCharacter } from "@/features/discovery/FeaturedCharacter"; // 추천 캐릭터
import { RankingRail } from "@/features/discovery/RankingRail"; // 랭킹 레일
import { getInterestCharacters, getRecommendedCharacters } from "@/features/discovery/recommendation-model"; // 유저 추천·관심 목록
import { RewardsBanner } from "@/features/rewards/RewardsBanner"; // 출석·미션 카드
import { ModeSwitch } from "@/features/story/ModeSwitch"; // 캐릭터·스토리 모드 전환
import styles from "@/features/discovery/DiscoveryHome.module.css"; // 탐색 스타일

const categories = ["전체", "힐링", "판타지", "현대", "로맨스", "미스터리", "SF"]; // 카테고리 목록
const pageSize = 12; // 페이지 표시 수

export function DiscoveryHome() // 탐색 홈
{ // 함수 시작
    const { state } = useAppStore(); // 앱 상태 조회
    const [chosen, setChosen] = useState<DiscoveryFilter>(createDiscoveryFilter); // 탐색 조건(검색어·장르·등급·선택·정렬)
    const [visibleCount, setVisibleCount] = useState(pageSize); // 표시 항목 수
    const showMature = canViewMatureContent(state, new Date()); // 19세 콘텐츠 표시 여부
    const discoverable = useMemo(() => getDiscoverableCharacters(state.characters, showMature), [showMature, state.characters]); // 추천 가능한 캐릭터
    const filter = useMemo<DiscoveryFilter>(() => chosen.rating === "mature" && !showMature ? { ...chosen, rating: "any" } : chosen, [chosen, showMature]); // 19+를 끄면 19세 조건은 풀어 둠
    const talkedIds = useMemo(() => getTalkedCharacterIds(state), [state]); // 대화해 본 캐릭터
    const interestIds = useMemo(() => getInterestCharacterIds(state), [state]); // 좋아요·보관한 캐릭터
    const filtered = useMemo(() => applyDiscoveryFilter(discoverable, filter, { talkedIds, interestIds }), [discoverable, filter, interestIds, talkedIds]); // 조건을 걸고 정렬한 결과
    const publicCount = discoverable.length; // 공개 캐릭터 수
    const defaultView = isDefaultFilter(filter); // 기본 화면 판정(조건 없음·추천순)
    const activeCount = countActiveFilters(filter); // 걸린 조건 수
    const rankingCharacters = defaultView ? filtered.slice(0, 10) : []; // 상위 랭킹 목록
    const browsableCharacters = defaultView ? filtered.slice(10) : filtered; // 탐색 대상 목록
    const visibleCharacters = browsableCharacters.slice(0, visibleCount); // 현재 표시 목록
    const recommendation = useMemo(() => getRecommendedCharacters(state, showMature, 8), [showMature, state]); // 유저 추천 캐릭터
    const interests = useMemo(() => getInterestCharacters(state, showMature), [showMature, state]); // 관심 목록
    const recommendationLead = recommendation.personalized ? `#${recommendation.basisTags.slice(0, 2).join(" #")} 취향을 바탕으로 골랐어요. 아직 대화하지 않은 캐릭터만 보여 드려요.` : "아직 취향 정보가 적어 인기 캐릭터로 골랐어요. 좋아요나 보관을 누르면 취향에 맞춰 바뀌어요."; // 추천 안내
    const interestLead = interests.length === 0 ? undefined : `좋아요 ${interests.filter((entry) => entry.liked).length} · 보관 ${interests.filter((entry) => entry.bookmarked).length}`; // 관심 안내
    const change = (patch: Partial<DiscoveryFilter>) => // 조건 변경 함수
    { // 함수 시작
        setChosen((current) => ({ ...current, ...patch })); // 조건 저장
        setVisibleCount(pageSize); // 표시 수 초기화
    }; // 함수 종료
    const updateQuery = (value: string) => change({ query: value }); // 검색어 변경
    const updateCategory = (value: string) => change({ genres: value === categories[0] ? [] : toggleGenre(filter.genres, value) }); // 장르 넣고 빼기(전체는 모두 해제)
    const reset = () => // 조건 지우기
    { // 함수 시작
        setChosen(createDiscoveryFilter()); // 처음 조건으로
        setVisibleCount(pageSize); // 표시 수 초기화
    }; // 함수 종료
    return ( // 홈 반환
        <main className={styles.home} data-surface="light"> {/* 탐색 본문 */}
            <ModeSwitch /> {/* 캐릭터·스토리 모드 전환 */}
            <header className={styles.hero}> {/* 탐색 헤더 */}
                <div> {/* 헤더 문구 */}
                    <span className={styles.eyebrow}>감정과 이야기가 이어지는 공간</span> {/* 상단 문구 */}
                    <h1>오늘, <span className={styles.titleHighlight}>누구의 세계</span>에 들어갈까요?</h1> {/* 페이지 제목 */}
                    <p className={styles.heroLead}>힐링부터 미스터리까지, {publicCount}명의 메이트가 각자의 이야기를 품고 기다리고 있어요.</p> {/* 페이지 설명 */}
                </div> {/* 문구 종료 */}
                <div className={styles.searchBox}> {/* 검색 영역 */}
                    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4 4" /></svg> {/* 검색 아이콘 */}
                    <input type="search" aria-label="캐릭터와 세계관 검색" placeholder="캐릭터와 세계관 검색" value={filter.query} onChange={(event) => updateQuery(event.target.value)} /> {/* 검색 입력 */}
                </div> {/* 검색 영역 종료 */}
            </header> {/* 헤더 종료 */}
            {defaultView ? <RewardsBanner /> : null} {/* 출석·미션(기본 화면) */}
            <CategoryFilter categories={categories} selected={filter.genres} onSelect={updateCategory} /> {/* 카테고리(여러 개 고를 수 있음) */}
            <section className={styles.filterBar} aria-label="정렬과 필터"> {/* 정렬과 필터 */}
                <label>정렬<select value={filter.sort} onChange={(event) => change({ sort: event.target.value as DiscoverySort })}>{discoverySorts.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label> {/* 정렬 */}
                <label>이용 등급<select value={filter.rating} onChange={(event) => change({ rating: event.target.value as RatingFilter })}>{ratingFilters.filter((item) => item.id !== "mature" || showMature).map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label> {/* 이용 등급(19세는 19+를 켰을 때만) */}
                <label className={styles.filterCheck}><input type="checkbox" checked={filter.onlyNew} onChange={(event) => change({ onlyNew: event.target.checked })} />처음 만나는 캐릭터만</label> {/* 대화해 보지 않은 캐릭터 */}
                <label className={styles.filterCheck}><input type="checkbox" checked={filter.onlyInterest} onChange={(event) => change({ onlyInterest: event.target.checked })} />관심 목록만</label> {/* 좋아요·보관한 캐릭터 */}
                <p className={styles.filterCount} role="status" aria-label="찾은 캐릭터">캐릭터 {filtered.length}명{activeCount === 0 ? "" : ` · 조건 ${activeCount}개`}</p> {/* 찾은 수 */}
                {defaultView ? null : <button type="button" className={styles.filterReset} onClick={reset}>조건 지우기</button>} {/* 지우기 */}
            </section> {/* 정렬과 필터 종료 */}
            {defaultView && filtered[0] !== undefined ? <FeaturedCharacter character={filtered[0]} /> : null} {/* 추천 영역 */}
            {defaultView && rankingCharacters.length > 0 ? <RankingRail characters={rankingCharacters} /> : null} {/* 랭킹 영역 */}
            <CharacterRail title="캐릭터 탐색 결과" characters={visibleCharacters} /> {/* 검색 결과 */}
            {visibleCharacters.length < browsableCharacters.length ? <button type="button" className={styles.loadMore} onClick={() => setVisibleCount((count) => count + pageSize)}>캐릭터 더 보기</button> : null} {/* 더 보기 */}
            {filtered.length === 0 ? <p className={styles.empty} role="status">조건에 맞는 캐릭터가 없습니다.</p> : null} {/* 빈 결과 */}
            {defaultView ? <CharacterRail title="유저 추천 캐릭터" description={recommendationLead} characters={recommendation.characters} /> : null} {/* 유저 추천(기본 화면) */}
            {defaultView ? <CharacterRail title="관심 목록" description={interestLead} characters={interests.map((entry) => entry.character)} empty={<div className={styles.railEmpty}><strong>아직 관심 캐릭터가 없어요.</strong><p>캐릭터 상세 화면에서 좋아요나 보관을 누르면 여기에 모여요.</p><Link href={"/explore" as Route}>캐릭터 탐색하기</Link></div>} /> : null} {/* 관심 목록(기본 화면) */}
        </main> // 본문 종료
    ); // 반환 종료
} // 함수 종료
