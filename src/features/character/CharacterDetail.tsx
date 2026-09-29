"use client"; // 클라이언트 컴포넌트

import Link from "next/link"; // 내부 경로 링크
import { useRouter } from "next/navigation"; // 경로 이동 도구
import { useRef, useState, type CSSProperties } from "react"; // 리액트 상태 도구
import { CharacterActionBar } from "@/features/character/CharacterActionBar"; // 하단 대화 동작
import { CharacterHero } from "@/features/character/CharacterHero"; // 캐릭터 히어로
import { CharacterStoryInfo } from "@/features/character/CharacterStoryInfo"; // 스토리 정보
import { ConversationSetup } from "@/features/character/ConversationSetup"; // 대화 시작 설정
import { ProloguePreview } from "@/features/character/ProloguePreview"; // 프롤로그 미리보기
import { createConversationFromPreset, getCharacterDetailProfile, getLatestActiveConversation } from "@/features/character/character-detail-model"; // 상세 모델 함수
import styles from "@/features/character/CharacterDetail.module.css"; // 상세 화면 스타일
import { useAppStore } from "@/features/core/AppProvider"; // 앱 저장소

export function CharacterDetail({ characterId }: { characterId: string }) // 캐릭터 상세
{ // 함수 시작
    const { state, dispatch } = useAppStore(); // 앱 상태
    const router = useRouter(); // 경로 이동기
    const character = state.characters.find((item) => item.id === characterId); // 캐릭터 조회
    const initialProfile = character === undefined ? null : getCharacterDetailProfile(character); // 초기 상세 프로필
    const [selectedProfileId, setSelectedProfileId] = useState(state.profile.id); // 선택 프로필 상태
    const [selectedPresetId, setSelectedPresetId] = useState(initialProfile?.startPresets[0]?.id ?? ""); // 선택 프리셋 상태
    const [creating, setCreating] = useState(false); // 대화 생성 상태
    const creatingRef = useRef(false); // 중복 생성 잠금
    if (character === undefined || initialProfile === null) // 캐릭터 부재 판정
    { // 조건 시작
        return <main className={styles.emptyState}><h1>캐릭터를 찾을 수 없습니다.</h1><Link href="/">탐색으로 돌아가기</Link></main>; // 오류 화면
    } // 조건 종료
    const profile = initialProfile; // 상세 프로필 확정
    const selectedPreset = profile.startPresets.find((preset) => preset.id === selectedPresetId) ?? profile.startPresets[0]; // 선택 프리셋 조회
    const selectedPrologue = profile.prologues.find((prologue) => prologue.id === selectedPreset?.prologueId) ?? profile.prologues[0]; // 선택 프롤로그 조회
    const latestConversation = getLatestActiveConversation(state.conversations, character.id); // 최근 대화 조회
    const continueConversation = () => // 최근 대화 이어가기
    { // 함수 시작
        if (latestConversation === null) // 최근 대화 부재 확인
        { // 조건 시작
            return; // 이동 중단
        } // 조건 종료
        dispatch({ type: "select-conversation", conversationId: latestConversation.id }); // 최근 대화 선택
        router.push(`/chat/${character.id}`); // 대화 화면 이동
    }; // 함수 종료
    const startConversation = () => // 새 대화 시작
    { // 함수 시작
        if (creatingRef.current || selectedPreset === undefined) // 중복 실행 확인
        { // 조건 시작
            return; // 생성 중단
        } // 조건 종료
        creatingRef.current = true; // 생성 잠금 설정
        setCreating(true); // 생성 상태 설정
        const result = createConversationFromPreset(state, character.id, selectedPreset.id); // 새 대화 생성
        dispatch({ type: "replace-state", state: result.state }); // 생성 상태 저장
        router.push(result.href); // 대화 화면 이동
    }; // 함수 종료
    const bookmarked = state.bookmarkedCharacterIds.includes(character.id); // 보관 상태
    const liked = state.likedCharacterIds.includes(character.id); // 좋아요 상태
    const followed = state.followedCreatorIds.includes(character.creatorId); // 팔로우 상태
    const pageStyle = { "--character-accent": profile.accentColor, "--character-image": `url("${character.coverImage}")` } as CSSProperties; // 캐릭터 테마
    return ( // 상세 반환
        <main className={styles.page} style={pageStyle}> {/* 상세 본문 */}
            <div className={styles.background} aria-hidden="true" /> {/* 흐림 배경 */}
            <div className={styles.content}> {/* 상세 내용 */}
                <CharacterHero character={character} profile={profile} bookmarked={bookmarked} liked={liked} followed={followed} onBookmark={() => dispatch({ type: "toggle-bookmark", characterId: character.id })} onLike={() => dispatch({ type: "toggle-character-like", characterId: character.id })} onFollow={() => dispatch({ type: "toggle-creator-follow", creatorId: character.creatorId })} onShare={() => undefined} onMore={() => undefined} /> {/* 히어로 */}
                <CharacterStoryInfo character={character} profile={profile} /> {/* 스토리 정보 */}
                <ConversationSetup profile={state.profile} presets={profile.startPresets} selectedProfileId={selectedProfileId} selectedPresetId={selectedPreset?.id ?? ""} onProfileChange={setSelectedProfileId} onPresetChange={setSelectedPresetId} /> {/* 시작 설정 */}
                {selectedPrologue === undefined ? null : <ProloguePreview prologue={selectedPrologue} />} {/* 프롤로그 미리보기 */}
                <CharacterActionBar latestConversation={latestConversation} creating={creating} onContinue={continueConversation} onStart={startConversation} /> {/* 대화 동작 */}
            </div> {/* 상세 내용 종료 */}
        </main> // 본문 종료
    ); // 반환 종료
} // 함수 종료
