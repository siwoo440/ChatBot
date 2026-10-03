"use client"; // 클라이언트 컴포넌트

import type { Route } from "next"; // 경로 타입
import Link from "next/link"; // 내부 링크
import { useMemo, useState, type KeyboardEvent } from "react"; // 리액트 상태
import { canViewMatureContent, getDiscoverableCharacters } from "@/features/adult/adult-access"; // 19세 콘텐츠 필터
import { useAppStore } from "@/features/core/AppProvider"; // 앱 상태
import { CategoryFilter } from "@/features/discovery/CategoryFilter"; // 카테고리 필터
import { CharacterRail } from "@/features/discovery/CharacterRail"; // 캐릭터 레일
import { absorbTags, addTag, applyDiscoveryFilter, countActiveFilters, createDiscoveryFilter, discoverySorts, getInterestCharacterIds, getTalkedCharacterIds, isDefaultFilter, parseSearchQuery, ratingFilters, removePendingTag, suggestTags, TAG_FILTER_LIMIT, toggleGenre, type DiscoveryFilter, type DiscoverySort, type RatingFilter } from "@/features/discovery/discovery-filter"; // 정렬과 필터·태그 검색
import { buildTagStats } from "@/features/explore/explore-model"; // 태그 통계
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
    const knownTags = useMemo(() => buildTagStats(discoverable).map((stat) => stat.tag), [discoverable]); // 공개 작품에 쓰인 태그
    const pendingTag = parseSearchQuery(filter.query).pending; // 검색창에 입력 중인 #태그
    const tagFull = filter.tags.length >= TAG_FILTER_LIMIT; // 태그 한도 도달
    const tagSuggestions = useMemo(() => // 이어서 좁힐 태그(입력 중인 토막을 뺀 지금 결과 기준)
    { // 계산 시작
        if (tagFull || (pendingTag === null && filter.tags.length === 0)) // 한도 도달·태그 검색 중이 아님
        { // 조건 시작
            return []; // 제안 없음
        } // 조건 종료
        const base = pendingTag === null ? filtered : applyDiscoveryFilter(discoverable, { ...filter, query: removePendingTag(filter.query) }, { talkedIds, interestIds }); // 제안 기준 작품
        return suggestTags(base, filter.tags, pendingTag); // 제안 반환
    }, [discoverable, filter, filtered, interestIds, pendingTag, tagFull, talkedIds]); // 제안 의존
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
    const updateQuery = (value: string) => change(absorbTags(value, filter.tags, knownTags)); // 검색어 변경(다 적은 #태그는 칩으로)
    const pickTag = (tag: string) => change({ tags: addTag(filter.tags, tag), query: removePendingTag(filter.query) }); // 제안한 태그 고르기(입력 중인 토막은 지움)
    const removeTag = (tag: string) => change({ tags: filter.tags.filter((item) => item !== tag) }); // 고른 태그 빼기
    const handleSearchKey = (event: KeyboardEvent<HTMLInputElement>) => // 검색창 키 처리
    { // 함수 시작
        if (event.key === "Enter" && !event.nativeEvent.isComposing && pendingTag !== null && tagSuggestions[0] !== undefined) // Enter로 첫 제안 고르기
        { // 조건 시작
            event.preventDefault(); // 기본 동작 차단
            pickTag(tagSuggestions[0].tag); // 첫 제안
        } // 조건 종료
        else if (event.key === "Backspace" && filter.query.length === 0 && filter.tags.length > 0) // 빈 검색창에서 지우기
        { // 조건 시작
            removeTag(filter.tags[filter.tags.length - 1]); // 마지막 태그 빼기
        } // 조건 종료
    }; // 함수 종료
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
                    <input type="search" aria-label="제목과 작가 검색" aria-describedby="tag-search-hint" placeholder="제목·작가 검색, #태그로 좁히기" value={filter.query} onChange={(event) => updateQuery(event.target.value)} onKeyDown={handleSearchKey} /> {/* 검색 입력(#태그 지원) */}
                    <span id="tag-search-hint" className="sr-only">그냥 적으면 작품 제목과 작가 이름에서 찾습니다. #을 붙여 태그를 적으면 태그 후보가 나옵니다. 태그를 여러 개 고르면 모두 가진 작품만 남습니다.</span> {/* 태그 검색 안내 */}
                </div> {/* 검색 영역 종료 */}
            </header> {/* 헤더 종료 */}
            {filter.tags.length === 0 && pendingTag === null ? null : ( // 태그 검색 판정
                <section className={styles.tagSearch} aria-label="태그로 좁히기"> {/* 태그로 좁히기 */}
                    {filter.tags.length === 0 ? null : <ul className={styles.tagChosen} aria-label="고른 태그">{filter.tags.map((tag) => <li key={tag}><button type="button" aria-label={`#${tag} 태그 빼기`} onClick={() => removeTag(tag)}>#{tag}<span aria-hidden="true">×</span></button></li>)}</ul>} {/* 고른 태그(모두 가진 작품만 남음) */}
                    {tagFull ? <p>태그는 {TAG_FILTER_LIMIT}개까지 함께 고를 수 있어요.</p> : tagSuggestions.length === 0 ? <p role="status" aria-label="태그 안내">{pendingTag !== null && pendingTag.length > 0 ? `‘#${pendingTag}’에 맞는 태그가 없어요.` : "더 좁힐 태그가 없어요."}</p> : ( // 제안 판정
                        <> {/* 제안 묶음 */}
                            <p>{filter.tags.length === 0 ? "태그를 골라 주세요. Enter를 누르면 첫 태그를 골라요." : "이어서 좁히기"}</p> {/* 제안 안내 */}
                            <ul aria-label="태그 제안">{tagSuggestions.map((stat) => <li key={stat.tag}><button type="button" aria-label={`#${stat.tag} 태그 더하기, 작품 ${stat.count}개`} onClick={() => pickTag(stat.tag)}>#{stat.tag}<small>{stat.count}</small></button></li>)}</ul> {/* 태그 제안(지금 남은 작품 기준 작품 수) */}
                        </> // 제안 묶음 종료
                    )} {/* 제안 판정 종료 */}
                </section> // 태그로 좁히기 종료
            )} {/* 태그 검색 판정 종료 */}
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
