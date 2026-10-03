// 저장 데이터 버전 변환: 이전 버전 상태를 한 단계씩 올려 현재 버전으로 만든다.
import { createInitialState } from "@/features/core/initial-state"; // 초기 상태 함수
import type { AppState, Character, Conversation, ConversationStartSettings, ConversationVersion, Message, StatusTemplate, Story, UserProfile } from "@/features/core/types"; // 도메인 타입
import { createDefaultConversationSettings, createDefaultPersona, createDefaultStatusTemplate } from "@/features/core/defaults"; // 기본값
import { fromRelationLevel, getRelationStat, readRelationLevel } from "@/features/chat/relation-model"; // 관계 스탯
import { AFFECTION_STAT_ID, toVersionTwelveTemplate, upgradeStatusSnapshot, upgradeStatusTemplate } from "@/features/chat/stat-model"; // 스탯 변환
import { deriveDisplayName } from "@/features/story/story-model"; // 짧은 이름
import { upgradeScenePath } from "@/lib/assets/scene-paths"; // 장면 그림 경로
import { mockCharacters } from "@/mocks/fixtures"; // 기본 캐릭터 목록
import { mockStories } from "@/mocks/story-fixtures"; // 예시 스토리
import { contentRatings, isAppState, isOneOf, isRecord, isString, isVersionEightState, isVersionElevenState, isVersionFiveState, isVersionFourState, isVersionNineState, isVersionSevenState, isVersionSixState, isVersionTenState, isVersionThirteenState, isVersionThreeState, isVersionTwelveState, isVersionTwoState, publicationStatuses } from "@/lib/repositories/state-validation"; // 데이터 검사

export function migrateVersionSix(value: Record<string, unknown>): AppState | null // 버전 6 변환 함수
{ // 함수 시작
    if (!isVersionSixState(value)) // 버전 6 유효성 판정
    { // 잘못된 상태 시작
        return null; // 변환 중단
    } // 잘못된 상태 종료
    const characterIds = new Set(value.characters.map((character) => character.id)); // 캐릭터 식별자 집합
    if (value.conversations.some((conversation) => !characterIds.has(conversation.characterId) || !value.messages.some((message) => message.conversationId === conversation.id))) // 연결 손상 판정
    { // 손상 상태 시작
        return null; // 비파괴 거부
    } // 손상 상태 종료
    const versionIds = new Map(value.conversations.map((conversation) => [conversation.id, `${conversation.id}-version-1`])); // 최초 버전 식별자 색인
    const conversations: Array<Omit<Conversation, "mode" | "storyId" | "storyCast" | "settings" | "folderId">> = value.conversations.map((conversation) => // 대화 버전 연결(버전 7 형식)
    { // 변환 시작
        return { id: conversation.id, characterId: conversation.characterId, userId: conversation.userId, title: conversation.title, startSettings: conversation.startSettings, currentVersionId: versionIds.get(conversation.id) as string, archivedAt: conversation.archivedAt, createdAt: conversation.createdAt, updatedAt: conversation.updatedAt }; // 공통 대화 반환
    }); // 변환 종료
    const conversationVersions: ConversationVersion[] = value.conversations.map((conversation) => // 최초 버전 생성
    { // 변환 시작
        return { id: versionIds.get(conversation.id) as string, conversationId: conversation.id, parentVersionId: null, forkRootVersionId: null, forkedFromMessageId: null, ordinal: 1, relationshipLevel: conversation.relationshipLevel, relationshipStage: conversation.relationshipStage, emotion: conversation.emotion, currentScene: conversation.currentScene, lastMessage: conversation.lastMessage, createdAt: conversation.createdAt, updatedAt: conversation.updatedAt }; // 버전 반환
    }); // 변환 종료
    const messages: Message[] = value.messages.map((message) => ({ ...message, versionId: versionIds.get(message.conversationId) as string, sourceMessageId: null })); // 메시지 버전 연결
    if (messages.some((message) => message.versionId === undefined)) // 메시지 연결 손상 판정
    { // 손상 상태 시작
        return null; // 비파괴 거부
    } // 손상 상태 종료
    const candidate: unknown = { ...value, schemaVersion: 7, conversations, conversationVersions, messages }; // 버전 7 후보
    return isVersionSevenState(candidate) ? migrateVersionSeven(candidate) : null; // 연속 변환 반환
} // 함수 종료

export function migrateVersionSeven(value: Record<string, unknown>): AppState | null // 버전 7 변환 함수
{ // 함수 시작
    if (!isVersionSevenState(value)) // 버전 7 유효성 판정
    { // 잘못된 상태 시작
        return null; // 변환 중단
    } // 잘못된 상태 종료
    const defaultRatings = new Map(mockCharacters.map((character) => [character.id, character.contentRating])); // 기본 등급 색인
    const characters = value.characters.map((character) => // 캐릭터 등급 추가
    { // 변환 시작
        const stored = (character as Record<string, unknown>).contentRating; // 기존 등급 조회
        return { ...character, contentRating: isOneOf(stored, contentRatings) ? stored : defaultRatings.get(character.id) ?? "all" }; // 등급 적용
    }); // 변환 종료
    const profile = { ...value.profile, adultVerification: null }; // 성인 인증 전 상태
    const settings = { ...value.settings, matureContentEnabled: false }; // 19세 콘텐츠 숨김
    const candidate: unknown = { ...value, schemaVersion: 8, profile, characters, settings }; // 버전 8 후보
    return isVersionEightState(candidate) ? migrateVersionEight(candidate) : null; // 연속 변환 반환
} // 함수 종료

export function migrateVersionEight(value: Record<string, unknown>): AppState | null // 버전 8 변환 함수
{ // 함수 시작
    if (!isVersionEightState(value)) // 버전 8 유효성 판정
    { // 잘못된 상태 시작
        return null; // 변환 중단
    } // 잘못된 상태 종료
    const settings = { ...value.settings, conversationSort: "recent" }; // 최근 대화순 정렬
    const candidate: unknown = { ...value, schemaVersion: 9, pinnedConversationIds: [], settings }; // 버전 9 후보
    return isVersionNineState(candidate) ? migrateVersionNine(candidate) : null; // 연속 변환 반환
} // 함수 종료

export function migrateVersionNine(value: Record<string, unknown>): AppState | null // 버전 9 변환 함수
{ // 함수 시작
    if (!isVersionNineState(value)) // 버전 9 유효성 판정
    { // 잘못된 상태 시작
        return null; // 변환 중단
    } // 잘못된 상태 종료
    const conversations = (value.conversations as Array<Record<string, unknown>>).map((conversation) => ({ ...conversation, mode: "character", storyId: null, storyCast: [] })); // 기존 대화는 캐릭터 모드
    const characterIds = new Set((value.characters as Character[]).map((character) => character.id)); // 남아 있는 캐릭터
    const stories = structuredClone(mockStories).filter((story) => story.cast.every((member) => characterIds.has(member.characterId))); // 등장인물이 모두 있는 예시 스토리
    const candidate: unknown = { ...value, schemaVersion: 10, conversations, stories }; // 버전 10 후보
    return isVersionTenState(candidate) ? migrateVersionTen(candidate) : null; // 연속 변환 반환
} // 함수 종료

export function migrateVersionTen(value: Record<string, unknown>): AppState | null // 버전 10 변환 함수
{ // 함수 시작
    if (!isVersionTenState(value)) // 버전 10 유효성 판정
    { // 잘못된 상태 시작
        return null; // 변환 중단
    } // 잘못된 상태 종료
    const candidate: unknown = { ...value, schemaVersion: 11, images: [] }; // 버전 11 후보(빈 이미지 갤러리)
    return isVersionElevenState(candidate) ? migrateVersionEleven(candidate) : null; // 연속 변환 반환
} // 함수 종료

const legacyCategoryMap: Record<string, string> = { summary: "long", event: "short", preference: "goal" }; // 이전 기억 분류 대응

export function migrateVersionEleven(value: Record<string, unknown>): AppState | null // 버전 11 변환 함수(대화 설정·상태창·요약 메모리·폴더·알림)
{ // 함수 시작
    if (!isVersionElevenState(value)) // 버전 11 유효성 판정
    { // 잘못된 상태 시작
        return null; // 변환 중단
    } // 잘못된 상태 종료
    const extrasFor = (id: string, builtIns: ReadonlyArray<{ id: string; playGuide: string; statusTemplate: unknown; updates: unknown[] }>) => // 작품 추가 필드
    { // 함수 시작
        const builtIn = builtIns.find((item) => item.id === id); // 기본 작품
        return builtIn === undefined ? { playGuide: "", statusTemplate: toVersionTwelveTemplate(createDefaultStatusTemplate(true)), updates: [] } : { playGuide: builtIn.playGuide, statusTemplate: toVersionTwelveTemplate(builtIn.statusTemplate as StatusTemplate), updates: structuredClone(builtIn.updates) }; // 기본 작품은 기준값, 나머지는 빈 가이드(버전 12 형식)
    }; // 함수 종료
    const characters = (value.characters as Array<Record<string, unknown>>).map((character) => ({ ...character, ...extrasFor(character.id as string, mockCharacters) })); // 캐릭터 추가 필드
    const stories = (value.stories as Array<Record<string, unknown>>).map((story) => ({ ...story, ...extrasFor(story.id as string, mockStories) })); // 스토리 추가 필드
    const conversations = (value.conversations as Array<Record<string, unknown>>).map((conversation) => ({ ...conversation, settings: createDefaultConversationSettings(), folderId: null })); // 대화 기본 설정
    const memories = (value.memories as Array<Record<string, unknown>>).map((memory) => ({ ...memory, category: legacyCategoryMap[memory.category as string] ?? memory.category })); // 기억 분류 대응
    const profile = value.profile as UserProfile; // 사용자
    const settings = { ...(value.settings as Record<string, unknown>), conversationFilter: "all", chatFont: "default", chatFontSize: "medium", chatTheme: "light", showSceneImages: true, statusPanelOpen: true }; // 새 설정 기본값
    const candidate: unknown = { ...value, schemaVersion: 12, characters, stories, conversations, memories, settings, personas: [createDefaultPersona(profile, new Date().toISOString())], conversationFolders: [], notifications: [] }; // 버전 12 후보
    return isVersionTwelveState(candidate) ? migrateVersionTwelve(candidate) : null; // 연속 변환 반환
} // 함수 종료

export function migrateVersionTwelve(value: Record<string, unknown>): AppState | null // 버전 12 변환 함수(호감도 → 제작자 스탯, 채팅 테마 → 사이트 테마)
{ // 함수 시작
    if (!isVersionTwelveState(value)) // 버전 12 유효성 판정
    { // 잘못된 상태 시작
        return null; // 변환 중단
    } // 잘못된 상태 종료
    const upgradeWork = (work: Record<string, unknown>) => ({ ...work, statusTemplate: upgradeStatusTemplate(work.statusTemplate as Record<string, unknown>) }); // 작품 상태창 변환
    const messages = (value.messages as Array<Record<string, unknown>>).map((message) => isRecord(message.status) ? { ...message, status: upgradeStatusSnapshot(message.status) } : message); // 턴별 상태창 변환
    const { chatTheme, ...settings } = value.settings as Record<string, unknown>; // 채팅 테마 분리
    const candidate: unknown = { ...value, schemaVersion: 13, characters: (value.characters as Array<Record<string, unknown>>).map(upgradeWork), stories: (value.stories as Array<Record<string, unknown>>).map(upgradeWork), messages, settings: { ...settings, theme: chatTheme === "dark" ? "dark" : "light", chatPanelOpen: true } }; // 버전 13 후보
    return isVersionThirteenState(candidate) ? migrateVersionThirteen(candidate) : null; // 연속 변환 반환
} // 함수 종료

export function migrateVersionThirteen(value: Record<string, unknown>): AppState | null // 버전 13 변환 함수(관계 스탯 지정, 새 장면 그림 경로, 관계 수치 이어받기)
{ // 함수 시작
    if (!isVersionThirteenState(value)) // 버전 13 유효성 판정
    { // 잘못된 상태 시작
        return null; // 변환 중단
    } // 잘못된 상태 종료
    const withRelation = (template: StatusTemplate): StatusTemplate => ({ ...template, relationStatId: template.stats.some((stat) => stat.id === AFFECTION_STAT_ID && stat.scope === "each") ? AFFECTION_STAT_ID : null }); // 호감도가 있으면 관계 스탯으로
    const characters = (value.characters as Character[]).map((character) => ({ ...character, coverImage: upgradeScenePath(character.coverImage), statusTemplate: withRelation(character.statusTemplate) })); // 캐릭터 변환
    const stories = (value.stories as Story[]).map((story) => ({ ...story, coverImage: upgradeScenePath(story.coverImage), statusTemplate: withRelation(story.statusTemplate) })); // 스토리 변환
    const conversations = (value.conversations as Conversation[]).map((conversation) => ({ ...conversation, startSettings: { ...conversation.startSettings, scene: upgradeScenePath(conversation.startSettings.scene) } })); // 시작 장면 경로
    const versions = (value.conversationVersions as ConversationVersion[]).map((version) => ({ ...version, currentScene: upgradeScenePath(version.currentScene) })); // 현재 장면 경로
    const synced = new Map<string, number>(); // 관계 수치를 이어받을 상태창(메시지 식별자 → 스탯 값)
    for (const conversation of conversations) // 대화 순회
    { // 순회 시작
        const character = characters.find((item) => item.id === conversation.characterId); // 대표 캐릭터
        const story = conversation.mode === "story" ? stories.find((item) => item.id === conversation.storyId) : undefined; // 연결 스토리
        const stat = getRelationStat(story?.statusTemplate ?? character?.statusTemplate); // 관계 스탯
        const lead = conversation.mode === "story" ? conversation.storyCast[0]?.displayName : character === undefined ? undefined : deriveDisplayName(character.name); // 대표 인물
        if (stat === null || lead === undefined) // 관계 스탯·인물 없음
        { // 조건 시작
            continue; // 다음 대화
        } // 조건 종료
        for (const version of versions.filter((item) => item.conversationId === conversation.id)) // 버전 순회
        { // 버전 시작
            const latest = (value.messages as Message[]).filter((message) => message.versionId === version.id && message.status !== undefined && message.status !== null).sort((left, right) => (right.status?.turn ?? 0) - (left.status?.turn ?? 0))[0]; // 마지막 상태창
            const level = readRelationLevel(latest?.status, stat, lead); // 상태창의 관계 수치
            if (latest !== undefined && level !== null && level !== version.relationshipLevel) // 대화의 관계 수치와 어긋남
            { // 조건 시작
                synced.set(latest.id, fromRelationLevel(stat, version.relationshipLevel)); // 대화의 관계 수치를 이어받음
            } // 조건 종료
        } // 버전 종료
    } // 순회 종료
    const leadByConversation = new Map(conversations.map((conversation) => [conversation.id, conversation.mode === "story" ? conversation.storyCast[0]?.displayName : deriveDisplayName(characters.find((item) => item.id === conversation.characterId)?.name ?? "")])); // 대화별 대표 인물
    const messages = (value.messages as Message[]).map((message) => // 메시지 변환
    { // 변환 시작
        const scenePath = typeof message.scenePath === "string" ? upgradeScenePath(message.scenePath) : message.scenePath; // 장면 경로
        const sceneImage = typeof message.sceneImage === "string" ? upgradeScenePath(message.sceneImage) : message.sceneImage; // 상황 이미지 경로
        const value14 = synced.get(message.id); // 이어받을 값
        const status = value14 === undefined || message.status === undefined || message.status === null ? message.status : { ...message.status, stats: message.status.stats.map((item) => item.statId === AFFECTION_STAT_ID && item.target === leadByConversation.get(message.conversationId) ? { ...item, value: value14 } : item) }; // 관계 스탯 값 맞추기
        return { ...message, ...(message.scenePath === undefined ? {} : { scenePath }), ...(message.sceneImage === undefined ? {} : { sceneImage }), ...(message.status === undefined ? {} : { status }) }; // 변환 메시지
    }); // 변환 종료
    const candidate: unknown = { ...value, schemaVersion: 14, characters, stories, conversations, conversationVersions: versions, messages }; // 버전 14 후보
    return isAppState(candidate) ? candidate : null; // 유효 변환 반환
} // 함수 종료

export function migrateVersionFive(value: Record<string, unknown>): AppState | null // 버전 5 변환 함수
{ // 함수 시작
    if (!isVersionFiveState(value)) // 버전 5 유효성 판정
    { // 잘못된 상태 시작
        return null; // 변환 중단
    } // 잘못된 상태 종료
    const charactersById = new Map(value.characters.map((character) => [character.id, character])); // 캐릭터 색인
    const conversations = value.conversations.map((conversation) => // 대화 변환
    { // 변환 시작
        const greeting = charactersById.get(conversation.characterId)?.greeting ?? conversation.lastMessage; // 첫 대사 선택
        const startSettings: ConversationStartSettings = // 시작 설정 생성
        { // 설정 시작
            profileId: conversation.userId, // 사용자 프로필 유지
            presetId: "legacy-default", // 이전 프리셋 표시
            relationshipStage: conversation.relationshipStage, // 관계 단계 유지
            relationshipLevel: conversation.relationshipLevel, // 관계 수치 유지
            emotion: conversation.emotion, // 감정 유지
            scene: conversation.currentScene, // 장면 유지
            greeting, // 첫 대사 유지
        }; // 설정 종료
        return { ...conversation, startSettings }; // 시작 설정 추가
    }); // 변환 종료
    const candidate: unknown = { ...value, schemaVersion: 6, conversations, memories: [], likedCharacterIds: [], followedCreatorIds: [], localReports: [] }; // 버전 6 후보
    return isRecord(candidate) ? migrateVersionSix(candidate) : null; // 연속 변환 반환
} // 함수 종료

function migrateVersionFour(value: Record<string, unknown>): AppState | null // 버전 4 변환 함수
{ // 함수 시작
    if (!isVersionFourState(value)) // 버전 4 유효성 판정
    { // 잘못된 상태 시작
        return null; // 변환 중단
    } // 잘못된 상태 종료
    const conversations = value.conversations.map((conversation) => // 대화 변환
    { // 변환 시작
        return { ...conversation, archivedAt: isString(conversation.archivedAt) ? conversation.archivedAt : null }; // 보관 시각 추가
    }); // 변환 종료
    const candidate: unknown = { ...value, schemaVersion: 5, conversations }; // 버전 5 후보
    return isRecord(candidate) ? migrateVersionFive(candidate) : null; // 연속 변환 반환
} // 함수 종료

function migrateVersionThree(value: Record<string, unknown>): AppState | null // 버전 3 변환 함수
{ // 함수 시작
    if (!isVersionThreeState(value)) // 버전 3 유효성 판정
    { // 잘못된 상태 시작
        return null; // 변환 중단
    } // 잘못된 상태 종료
    const defaultsById = new Map(mockCharacters.map((character) => [character.id, character])); // 기본 캐릭터 색인
    const refreshedCharacters = value.characters.map((character) => // 기존 캐릭터 갱신
    { // 갱신 시작
        const defaultCharacter = defaultsById.get(character.id); // 기본 캐릭터 조회
        if (defaultCharacter === undefined || !character.id.startsWith("rank-")) // 갱신 제외 판정
        { // 제외 시작
            return character; // 원본 유지
        } // 제외 종료
        return { ...character, coverImage: defaultCharacter.coverImage }; // 기본 이미지 갱신
    }); // 갱신 종료
    const existingIds = new Set(refreshedCharacters.map((character) => character.id)); // 기존 식별자 집합
    const missingCharacters = mockCharacters.filter((character) => !existingIds.has(character.id)); // 누락 캐릭터 목록
    const candidate: unknown = { ...value, schemaVersion: 4, characters: [...refreshedCharacters, ...missingCharacters] }; // 버전 4 후보
    return isRecord(candidate) ? migrateVersionFour(candidate) : null; // 연속 변환 반환
} // 함수 종료

function migrateVersionTwo(value: Record<string, unknown>): AppState | null // 버전 2 변환 함수
{ // 함수 시작
    if (!isVersionTwoState(value)) // 버전 2 유효성 판정
    { // 잘못된 상태 시작
        return null; // 변환 중단
    } // 잘못된 상태 종료
    const existingIds = new Set(value.characters.map((character) => character.id)); // 기존 식별자 집합
    const missingCharacters = mockCharacters.filter((character) => !existingIds.has(character.id)); // 누락 캐릭터 목록
    const candidate: unknown = { ...value, schemaVersion: 3, characters: [...value.characters, ...missingCharacters] }; // 버전 3 후보
    return isRecord(candidate) ? migrateVersionThree(candidate) : null; // 연속 변환 반환
} // 함수 종료

function migrateVersionOne(value: Record<string, unknown>): AppState | null // 버전 1 변환 함수
{ // 함수 시작
    if (!Array.isArray(value.characters)) // 캐릭터 목록 판정
    { // 잘못된 목록 시작
        return null; // 변환 중단
    } // 잘못된 목록 종료
    const characters = value.characters.map((item) => // 캐릭터 변환
    { // 변환 시작
        if (!isRecord(item)) // 캐릭터 객체 판정
        { // 잘못된 캐릭터 시작
            return item; // 원본 반환
        } // 잘못된 캐릭터 종료
        const publicationStatus = isOneOf(item.publicationStatus, publicationStatuses) ? item.publicationStatus : "published"; // 발행 상태 선택
        return { ...item, publicationStatus }; // 변환 캐릭터 반환
    }); // 변환 종료
    const candidate: unknown = { ...value, schemaVersion: 2, characters, bookmarkedCharacterIds: [] }; // 버전 2 후보
    return isRecord(candidate) ? migrateVersionTwo(candidate) : null; // 연속 변환 반환
} // 함수 종료

function migrateVersionZero(value: Record<string, unknown>): AppState | null // 버전 0 변환 함수
{ // 함수 시작
    const defaults = createInitialState(); // 기본 상태 생성
    if (Object.hasOwn(value, "settings") && !isRecord(value.settings)) // 잘못된 설정 판정
    { // 잘못된 설정 시작
        return null; // 변환 중단
    } // 잘못된 설정 종료
    const legacySettings = isRecord(value.settings) ? value.settings : {}; // 이전 설정 선택
    const candidate: unknown = // 변환 후보
    { // 후보 시작
        ...value, // 이전 값 복사
        schemaVersion: 1, // 중간 버전 적용
        providerMode: "mock", // Mock 공급자 적용
        settings: // 설정 변환
        { // 설정 시작
            ...defaults.settings, // 새 기본값 적용
            ...legacySettings, // 이전 설정 유지
        }, // 설정 종료
    }; // 후보 종료
    return isRecord(candidate) ? migrateVersionOne(candidate) : null; // 연속 변환 반환
} // 함수 종료

export function migrateParsedState(parsed: unknown): AppState | null // 분석 상태 변환 함수
{ // 함수 시작
    if (isAppState(parsed)) // 현재 상태 판정
    { // 현재 상태 시작
        return structuredClone(parsed); // 현재 상태 복사
    } // 현재 상태 종료
    if (!isRecord(parsed)) // 객체 부재 판정
    { // 객체 부재 시작
        return null; // 변환 중단
    } // 객체 부재 종료
    if (parsed.schemaVersion === 0) // 버전 0 판정
    { // 버전 0 시작
        return migrateVersionZero(parsed); // 버전 5 변환
    } // 버전 0 종료
    if (parsed.schemaVersion === 1) // 버전 1 판정
    { // 버전 1 시작
        return migrateVersionOne(parsed); // 버전 5 변환
    } // 버전 1 종료
    if (parsed.schemaVersion === 2) // 버전 2 판정
    { // 버전 2 시작
        return migrateVersionTwo(parsed); // 버전 5 변환
    } // 버전 2 종료
    if (parsed.schemaVersion === 3) // 버전 3 판정
    { // 버전 3 시작
        return migrateVersionThree(parsed); // 버전 5 변환
    } // 버전 3 종료
    if (parsed.schemaVersion === 4) // 버전 4 판정
    { // 버전 4 시작
        return migrateVersionFour(parsed); // 버전 6 변환
    } // 버전 4 종료
    if (parsed.schemaVersion === 5) // 버전 5 판정
    { // 버전 5 시작
        return migrateVersionFive(parsed); // 버전 7 변환
    } // 버전 5 종료
    if (parsed.schemaVersion === 6) // 버전 6 판정
    { // 버전 6 시작
        return migrateVersionSix(parsed); // 버전 8 변환
    } // 버전 6 종료
    if (parsed.schemaVersion === 7) // 버전 7 판정
    { // 버전 7 시작
        return migrateVersionSeven(parsed); // 버전 10 변환
    } // 버전 7 종료
    if (parsed.schemaVersion === 8) // 버전 8 판정
    { // 버전 8 시작
        return migrateVersionEight(parsed); // 버전 10 변환
    } // 버전 8 종료
    if (parsed.schemaVersion === 9) // 버전 9 판정
    { // 버전 9 시작
        return migrateVersionNine(parsed); // 버전 11 변환
    } // 버전 9 종료
    if (parsed.schemaVersion === 10) // 버전 10 판정
    { // 버전 10 시작
        return migrateVersionTen(parsed); // 버전 12 변환
    } // 버전 10 종료
    if (parsed.schemaVersion === 11) // 버전 11 판정
    { // 버전 11 시작
        return migrateVersionEleven(parsed); // 버전 13 변환
    } // 버전 11 종료
    if (parsed.schemaVersion === 12) // 버전 12 판정
    { // 버전 12 시작
        return migrateVersionTwelve(parsed); // 버전 14 변환
    } // 버전 12 종료
    if (parsed.schemaVersion === 13) // 버전 13 판정
    { // 버전 13 시작
        return migrateVersionThirteen(parsed); // 버전 14 변환
    } // 버전 13 종료
    return null; // 지원하지 않는 상태 반환
} // 함수 종료

export function addMissingBuiltInStories(state: AppState): AppState // 빠진 기본 예시 스토리 보충
{ // 함수 시작
    const storyIds = new Set(state.stories.map((story) => story.id)); // 이미 있는 스토리
    const characterIds = new Set(state.characters.map((character) => character.id)); // 남아 있는 캐릭터
    const missing = mockStories.filter((story) => !storyIds.has(story.id) && story.cast.every((member) => characterIds.has(member.characterId))); // 등장인물이 모두 있는 빠진 예시 스토리
    return missing.length === 0 ? state : { ...state, stories: [...state.stories, ...structuredClone(missing)] }; // 보충 상태 반환
} // 함수 종료
