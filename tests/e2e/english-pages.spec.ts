import { expect, test, type Page } from "@playwright/test"; // 브라우저 테스트 도구
import { characterDetailProfiles } from "../../src/features/character/character-detail-data"; // 캐릭터 상세의 소개 글(작품 내용)
import { createInitialState } from "../../src/features/core/initial-state"; // 초기 상태 생성기
import type { AppState } from "../../src/features/core/types"; // 상태 타입
import { en } from "../../src/lib/i18n/en"; // 영어 사전
import * as fixtures from "../../src/mocks/fixtures"; // 기본 작품 데이터
import * as concepts from "../../src/mocks/ranking-character-concepts"; // 랭킹 캐릭터 데이터
import * as stories from "../../src/mocks/story-fixtures"; // 기본 스토리 데이터

const stateKey = "mateverse:v1:state"; // 손님 데이터 저장 키
const accountId = "practice-english"; // 점검용 연습 계정
const hangul = /[가-힣]/; // 한글 판정
const widths = [390, 820, 1440]; // 확인하는 화면 너비
const intended = new Set(["Language · 언어", "한국어", "{이름}"]); // 영어 화면에서도 일부러 한국어로 두는 화면 글자(언어 고르기는 두 언어로 보여 주고, {이름}은 내레이션에서 인물 이름으로 바뀌는 기능 글자)
const routes = [ // 영어로 열어 볼 주소(모든 페이지)
    "/", // 메인(캐릭터 모드)
    "/explore", // 탐색
    "/stories", // 스토리 모드
    "/stories/story-moonlit-archive", // 스토리 상세
    "/stories/story-moonlit-archive/chat", // 스토리 대화
    "/stories/new", // 스토리 만들기
    "/stories/story-moonlit-archive/edit", // 스토리 수정(내 작품이 아닐 때의 안내 포함)
    "/characters/harin", // 캐릭터 상세
    "/characters/rank-017", // 19세 캐릭터(잠금 안내)
    "/characters/new", // 캐릭터 만들기
    "/characters/harin/edit", // 캐릭터 수정(내 작품이 아닐 때의 안내 포함)
    "/chat/rian?conversation=conversation-rian&version=conversation-rian-version-1", // 캐릭터 대화
    "/images", // 이미지 스튜디오
    "/invite/WXYZ6789", // 친구 초대 링크
    "/library", // 보관함
    "/login", // 로그인
    "/auth/callback", // 간편 로그인에서 돌아오는 화면
    "/auth/reset", // 비밀번호 다시 정하기
    "/rewards", // 출석과 미션
    "/settings/profile", // 프로필 관리
    "/settings/tokens", // 토큰 이용 내역
    "/settings/display", // 화면 레이아웃
    "/settings/notifications", // 알림과 선제 메시지
    "/settings/privacy", // 개인정보 및 보안
    "/support", // 고객 지원
    "/text-play", // Text-Play 소개와 다운로드
    "/no-such-page", // 없는 주소
]; // 주소 목록 종료

function collectContent(): string[] // 작품 내용으로 저장된 한국어 글 모으기(영어 화면에서도 한국어 그대로 두기로 한 것. 긴 글부터)
{ // 함수 시작
    const found = new Set<string>(); // 모은 글
    const walk = (value: unknown): void => // 값 안의 글자를 모두 찾기
    { // 함수 시작
        if (typeof value === "string") // 글자
        { // 조건 시작
            value.split(/\n+/).map((line) => line.trim()).filter((line) => hangul.test(line)).forEach((line) => found.add(line)); // 줄마다 모으기(화면은 줄을 나눠 그림)
        } // 조건 종료
        else if (Array.isArray(value)) // 목록
        { // 조건 시작
            value.forEach(walk); // 항목마다
        } // 조건 종료
        else if (typeof value === "object" && value !== null) // 묶음
        { // 조건 시작
            Object.values(value).forEach(walk); // 값마다
        } // 조건 종료
    }; // 함수 종료
    [createInitialState(), characterDetailProfiles, fixtures, concepts, stories].forEach(walk); // 기본 데이터 전체
    return [...found].sort((a, b) => b.length - a.length); // 긴 글부터(짧은 글이 긴 글의 일부를 먼저 지우지 않게)
} // 함수 종료

const content = collectContent(); // 작품 내용

function isContent(text: string): boolean // 화면의 한국어가 작품 내용이거나 일부러 둔 것인지(내용을 모두 걷어 내면 한글이 남지 않거나, 내용의 한 부분인지)
{ // 함수 시작
    const shown = text.replace(/\s+/g, " ").trim(); // 빈칸을 다듬은 글
    if (intended.has(shown) || en[shown] === shown || (shown.length === 1 && content.some((item) => item.startsWith(shown)))) // 일부러 둔 글자·사전이 한국어 그대로 두기로 한 글자(태그 예시)·이름의 첫 글자(얼굴 그림 대신 보이는 글자)
    { // 조건 시작
        return true; // 영어로 바꾸지 않는 것
    } // 조건 종료
    const rest = content.reduce((left, item) => left.includes(item) ? left.split(item).join(" ") : left, shown); // 작품 내용을 걷어 낸 나머지
    return !hangul.test(rest) || (shown.length >= 8 && content.some((item) => item.replace(/\s+/g, " ").includes(shown))); // 남은 한글이 없거나 긴 내용의 일부
} // 함수 종료

async function seed(page: Page, change: (state: AppState) => void = () => undefined, signedIn = false): Promise<void> // 패널을 닫은 상태 준비(필요하면 로그인해 둠)
{ // 함수 시작
    const state = createInitialState(); // 초기 상태
    state.settings.leftPanelOpen = false; // 왼쪽 패널 닫기
    state.settings.rightPanelOpen = false; // 오른쪽 패널 닫기
    change(state); // 테스트마다 바꿀 것
    const session = { accountId, name: "Soha", email: null, provider: "practice", signedInAt: "2026-10-07T00:00:00.000Z" }; // 점검용 계정 세션
    await page.addInitScript(({ key, value, account, scoped }) => // 초기 저장
    { // 스크립트 시작
        if (window.localStorage.getItem("mateverse:e2e:english-seeded") === "true") // 중복 준비 판정
        { // 조건 시작
            return; // 덮어쓰기 방지
        } // 조건 종료
        window.localStorage.setItem(key, value); // 손님 상태 저장
        if (account !== null) // 로그인해 둘 때
        { // 조건 시작
            window.localStorage.setItem(scoped, value); // 계정 칸에도 같은 상태
            window.localStorage.setItem("mateverse:v1:account", account); // 세션 저장
        } // 조건 종료
        window.localStorage.setItem("mateverse:e2e:english-seeded", "true"); // 준비 기록
    }, { key: stateKey, value: JSON.stringify(state), account: signedIn ? JSON.stringify(session) : null, scoped: `mateverse:v1:u:${accountId}:state` }); // 인자
} // 함수 종료

async function koreanLeft(page: Page): Promise<string[]> // 화면에 남은 한국어 가운데 작품 내용이 아닌 것(영어로 바뀌지 않은 화면 글자)
{ // 함수 시작
    const shown = await page.evaluate(() => // 화면의 글자와 이름표 모으기
    { // 수집 시작
        const korean = /[가-힣]/; // 한글 판정
        const texts: string[] = []; // 모은 글
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); // 글자 마디 순회
        for (let node = walker.nextNode(); node !== null; node = walker.nextNode()) // 마디 순회
        { // 순회 시작
            const parent = node.parentElement; // 글자를 담은 요소
            if (parent !== null && parent.closest("script, style, noscript, nextjs-portal") === null && korean.test(node.textContent ?? "")) // 화면 글자이고 한글이 있음
            { // 조건 시작
                texts.push((node.textContent ?? "").trim()); // 모으기
            } // 조건 종료
        } // 순회 종료
        for (const element of Array.from(document.querySelectorAll("[aria-label], [title], [placeholder], [alt]"))) // 이름표가 있는 요소
        { // 순회 시작
            for (const name of ["aria-label", "title", "placeholder", "alt"]) // 이름표 종류
            { // 순회 시작
                const value = element.getAttribute(name) ?? ""; // 이름표
                if (korean.test(value)) // 한글이 있음
                { // 조건 시작
                    texts.push(`[${name}] ${value}`); // 종류와 함께 모으기
                } // 조건 종료
            } // 순회 종료
        } // 순회 종료
        return texts; // 모은 글 반환
    }); // 수집 종료
    return [...new Set(shown)].filter((text) => !isContent(text.replace(/^\[[a-z-]+\] /, ""))); // 작품 내용을 뺀 나머지
} // 함수 종료

async function expectFits(page: Page): Promise<void> // 가로로 넘치지 않는지
{ // 함수 시작
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0); // 넘침 없음
} // 함수 종료

test.describe("영어 화면 전체 점검", () => // 영어 화면 묶음
{ // 묶음 시작
    test.use({ locale: "en-US" }); // 브라우저 언어를 영어로(언어를 고르지 않았으면 영어로 보임)

    for (const route of routes) // 주소 순회
    { // 순회 시작
        test(`영어 화면의 ${route} 는 세 가지 너비에서 넘치지 않고 화면 글자가 영어다`, async ({ page }) => // 페이지 검증
        { // 테스트 시작
            await seed(page); // 준비
            for (const width of widths) // 너비 순회
            { // 순회 시작
                await page.setViewportSize({ width, height: 900 }); // 화면 크기
                await page.goto(route); // 화면 열기
                await expect(page.locator("html")).toHaveAttribute("lang", "en"); // 문서 언어
                await expect(page.locator("main").first()).toBeVisible(); // 화면이 그려짐
                await page.waitForLoadState("networkidle"); // 늦게 오는 내용까지 기다림
                await expectFits(page); // 넘침 없음
            } // 순회 종료
            expect(await koreanLeft(page)).toEqual([]); // 영어로 바뀌지 않은 화면 글자 없음
        }); // 테스트 종료
    } // 순회 종료

    test("영어 화면에서 양쪽 패널을 열어도 화면 글자가 영어다", async ({ page }) => // 패널 검증
    { // 테스트 시작
        await seed(page, (state) => { state.settings.leftPanelOpen = true; state.settings.rightPanelOpen = true; }); // 양쪽 패널을 연 상태
        await page.setViewportSize({ width: 1440, height: 900 }); // 데스크톱
        await page.goto("/"); // 메인
        await expect(page.getByRole("link", { name: "Log in", exact: true })).toBeVisible(); // 사용자 패널의 로그인 링크
        expect(await koreanLeft(page)).toEqual([]); // 영어로 바뀌지 않은 화면 글자 없음
    }); // 테스트 종료

    test("영어 화면의 계정 관리 칸과 두 확인 창은 넘치지 않고 화면 글자가 영어다", async ({ page }) => // 계정 관리 검증
    { // 테스트 시작
        await seed(page, () => undefined, true); // 로그인해 둠
        for (const width of widths) // 너비 순회
        { // 순회 시작
            await page.setViewportSize({ width, height: 900 }); // 화면 크기
            await page.goto("/settings/privacy"); // 개인정보 및 보안
            await expect(page.getByRole("heading", { name: "Manage account" })).toBeVisible(); // 계정 관리 칸
            await expectFits(page); // 넘침 없음
            await page.getByRole("button", { name: "Clear account data on this device" }).click(); // 기기 데이터 확인 창
            await expect(page.getByRole("dialog", { name: "Clear account data on this device?" })).toBeVisible(); // 창 표시
            await expectFits(page); // 넘침 없음
            expect(await koreanLeft(page)).toEqual([]); // 영어로 바뀌지 않은 화면 글자 없음
            await page.keyboard.press("Escape"); // Esc 키 누르기
            await page.getByRole("button", { name: "Delete account" }).click(); // 탈퇴 확인 창
            const dialog = page.getByRole("dialog", { name: "Delete your account?" }); // 탈퇴 확인 창
            await expect(dialog.getByRole("checkbox", { name: "I understand this can't be undone" })).toBeVisible(); // 확인 칸
            const box = await dialog.boundingBox(); // 창의 자리
            expect(box !== null && box.x >= 0 && box.x + box.width <= width).toBe(true); // 창이 화면 안에 있음
            await expectFits(page); // 넘침 없음
            expect(await koreanLeft(page)).toEqual([]); // 영어로 바뀌지 않은 화면 글자 없음
        } // 순회 종료
    }); // 테스트 종료
}); // 묶음 종료
