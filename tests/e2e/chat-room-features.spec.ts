import { expect, test, type Page } from "@playwright/test"; // 종단 테스트 도구
import { createInitialState } from "../../src/features/core/initial-state"; // 초기 상태 생성기
import type { AppState } from "../../src/features/core/types"; // 앱 상태 타입

const stateKey = "mateverse:v1:state"; // 로컬 저장 키
const seedKey = "mateverse:e2e:room-seeded"; // 테스트 준비 키

async function openRianChat(page: Page, mutate?: (state: AppState) => void): Promise<void> // 리안 대화 열기
{ // 함수 시작
    const state = createInitialState(); // 초기 상태
    state.settings.leftPanelOpen = false; // 왼쪽 패널 닫기
    state.settings.rightPanelOpen = false; // 오른쪽 패널 닫기
    mutate?.(state); // 상태 변형
    await page.addInitScript(({ key, guard, value }) => // 초기 저장
    { // 스크립트 시작
        if (window.localStorage.getItem(guard) === "true") // 중복 준비 판정
        { // 조건 시작
            return; // 덮어쓰기 방지
        } // 조건 종료
        window.localStorage.setItem(key, value); // 상태 저장
        window.localStorage.setItem(guard, "true"); // 준비 기록
    }, { key: stateKey, guard: seedKey, value: JSON.stringify(state) }); // 인자
    const conversation = state.conversations.find((item) => item.id === "conversation-rian")!; // 리안 대화
    await page.goto(`/chat/rian?conversation=${conversation.id}&version=${conversation.currentVersionId}`); // 이동
    await expect(page.getByRole("heading", { level: 1, name: "새벽 도서관의 리안" })).toBeVisible(); // 화면 확인
} // 함수 종료

async function send(page: Page, text: string): Promise<void> // Enter로 보내기
{ // 함수 시작
    const input = page.getByRole("textbox", { name: "메시지" }); // 입력창
    await input.fill(text); // 입력
    await input.press("Enter"); // 전송
    await expect(input).toBeEnabled({ timeout: 15_000 }); // 응답 완료
} // 함수 종료

test("INFO 상태창은 턴마다 고정 자리에서 갱신되고 새로고침 뒤에도 턴별로 넘겨 볼 수 있다", async ({ page }) => // 상태창 검증
{ // 검증 시작
    await openRianChat(page); // 열기
    const panel = page.getByRole("region", { name: "상태창" }); // 상태창
    await send(page, "오늘은 어떤 책을 정리해?"); // 1턴
    await expect(panel.getByText(/턴 · 1\/1/)).toBeVisible(); // 첫 상태창
    await send(page, "같이 정리하자"); // 2턴
    await expect(panel.getByText(/턴 · 2\/2/)).toBeVisible(); // 갱신
    await page.reload(); // 새로고침
    await expect(panel.getByText(/턴 · 2\/2/)).toBeVisible(); // 저장 유지
    await panel.getByRole("button", { name: "이전 턴 상태창" }).click(); // 이전 턴
    await expect(panel.getByText(/턴 · 1\/2/)).toBeVisible(); // 이전 상태창
    const box = await panel.boundingBox(); // 위치
    const composer = await page.getByRole("textbox", { name: "메시지" }).boundingBox(); // 입력창 위치
    expect(box !== null && composer !== null && box.y < composer.y).toBe(true); // 입력창 바로 위 고정
}); // 검증 종료

test("채팅 모델과 채팅방 설정 접기는 새로고침 뒤에도 유지되고, 헤더 다크 모드는 사이트 전체에 적용된다", async ({ page }) => // 설정 유지 검증
{ // 검증 시작
    await page.setViewportSize({ width: 1440, height: 900 }); // 데스크톱
    await openRianChat(page); // 열기
    await page.getByRole("button", { name: /채팅 모델 베이직챗/ }).click(); // 등급 메뉴
    await page.getByRole("menuitemradio", { name: /플러스챗/ }).click(); // 플러스
    await page.getByRole("button", { name: "채팅방 설정 닫기" }).click(); // 채팅방 설정 접기
    await expect(page.locator("#chat-settings-panel")).toBeHidden(); // 접힘
    await page.getByRole("switch", { name: "다크 모드" }).click(); // 헤더 다크 모드
    await expect(page.locator("html[data-theme='dark']")).toHaveCount(1); // 사이트 루트 어두움
    await page.reload(); // 새로고침
    await expect(page.getByRole("button", { name: "채팅 모델 플러스챗, 메시지당 3 토큰" })).toBeVisible(); // 등급 유지
    await expect(page.getByRole("button", { name: "채팅방 설정 열기와 닫기" })).toHaveAttribute("aria-expanded", "false"); // 접힘 유지
    await expect(page.locator("html[data-theme='dark']")).toHaveCount(1); // 다크 유지
    await page.goto("/library"); // 다른 페이지
    await expect(page.locator("html[data-theme='dark']")).toHaveCount(1); // 다른 페이지도 어두움
    const canvas = await page.evaluate(() => getComputedStyle(document.body).backgroundColor); // 바탕색
    expect(canvas).not.toBe("rgb(251, 249, 255)"); // 밝은 바탕이 아님
}); // 검증 종료

test("390px에서 채팅방 설정은 오른쪽 서랍으로 열리고 Esc로 닫힌다", async ({ page }) => // 모바일 서랍
{ // 검증 시작
    await page.setViewportSize({ width: 390, height: 844 }); // 모바일
    await openRianChat(page); // 열기
    const toggle = page.getByRole("button", { name: "채팅방 설정 열기와 닫기" }); // 열기 버튼
    await expect(toggle).toHaveAttribute("aria-expanded", "false"); // 처음엔 닫힘
    await toggle.click(); // 열기
    const close = page.getByRole("button", { name: "채팅방 설정 닫기" }); // 닫기
    await expect(close).toBeFocused(); // 닫기 초점
    const box = await page.locator("#chat-settings-panel").boundingBox(); // 서랍 위치
    expect(box !== null && box.y >= 60 && box.y <= 70 && box.height <= 844 - 60).toBe(true); // 헤더 아래 고정
    await page.keyboard.press("Escape"); // 닫기
    await expect(toggle).toHaveAttribute("aria-expanded", "false"); // 닫힘
    await expect(toggle).toBeFocused(); // 초점 복귀
}); // 검증 종료

test("왼쪽 장면 영역 없이 대화 영역이 화면을 넓게 쓰고, 장면 이미지는 입력창 아래 버튼으로 만든다", async ({ page }) => // 장면 영역 제거 검증
{ // 검증 시작
    await page.setViewportSize({ width: 1440, height: 900 }); // 데스크톱
    await openRianChat(page); // 열기
    await expect(page.getByRole("img", { name: /현재 장면/ })).toHaveCount(0); // 장면 그림 없음
    const story = await page.locator("main > section").first().boundingBox(); // 대화 영역
    const panel = await page.locator("#chat-settings-panel").boundingBox(); // 채팅방 설정
    expect(story !== null && panel !== null && story.x <= 24 && story.width >= 1100 && panel.x >= story.x + story.width).toBe(true); // 대화가 왼쪽 끝부터 넓게, 설정은 그 오른쪽
    await page.getByRole("button", { name: "채팅방 설정 닫기" }).click(); // 설정 접기
    const wide = await page.locator("main > section").first().boundingBox(); // 접은 뒤 대화 영역
    expect(wide !== null && wide.width >= 1360).toBe(true); // 화면 전체 폭
    await page.getByRole("button", { name: "장면 이미지 생성 · 20토큰" }).click(); // 장면 만들기
    await expect(page.getByRole("img", { name: "이 장면의 상황 이미지" })).toHaveAttribute("src", /fallback-scene\.webp/); // 새 장면 그림이 마지막 응답 아래에
}); // 검증 종료

test("관계 스탯 값이 INFO·오른쪽 관계 표시·왼쪽 대화방 카드에 같은 값으로 보인다", async ({ page }) => // 관계 스탯 검증
{ // 검증 시작
    await page.setViewportSize({ width: 1440, height: 900 }); // 데스크톱
    await openRianChat(page); // 열기(리안 대화: 관계 34)
    await expect(page.getByText("관계 · 아는 사이", { exact: true })).toBeVisible(); // 시작 관계 단계
    await expect(page.getByText("❤️ 호감도 34/100", { exact: true })).toBeVisible(); // 시작 관계 값
    await send(page, "선물 가져왔어, 고마워"); // 선물 +5, 고마워 +2, AI 최대 +5
    const panel = page.getByRole("region", { name: "상태창" }); // 상태창
    const value = Number((await panel.locator("[data-stat='affection'] b").first().textContent())?.split("/")[0]); // INFO 호감도
    expect(value).toBeGreaterThanOrEqual(41); // 34 + 규칙 7 이상
    expect(value).toBeLessThanOrEqual(46); // AI 최대 +5
    await expect(page.getByText(`❤️ 호감도 ${value}/100`, { exact: true })).toBeVisible(); // 오른쪽 관계 표시
    await page.reload(); // 새로고침
    await page.getByRole("button", { name: "대화방 패널 열기와 닫기" }).click(); // 왼쪽 창 열기
    const card = page.locator(".conversation-card", { hasText: "새벽 도서관의 리안" }); // 리안 카드
    await expect(card.getByRole("meter", { name: "관계 수치" })).toHaveAttribute("aria-valuenow", String(value)); // 카드 막대도 같은 값
}); // 검증 종료

for (const width of [390, 820, 1440]) // 화면 너비 순회
{ // 순회 시작
    test(`${width}px 채팅 화면은 새 설정·상태창·입력 보조가 있어도 가로로 넘치지 않고 외부 요청이 없다`, async ({ page }) => // 넘침 검증
    { // 검증 시작
        const external: string[] = []; // 외부 요청
        page.on("request", (request) => // 요청 감시
        { // 감시 시작
            const url = new URL(request.url()); // 주소
            if (url.protocol.startsWith("http") && url.hostname !== "127.0.0.1") // 외부 판정
            { // 조건 시작
                external.push(request.url()); // 기록
            } // 조건 종료
        }); // 감시 종료
        await page.setViewportSize({ width, height: 900 }); // 화면 크기
        await openRianChat(page); // 열기
        await send(page, "상태창을 보여 줘"); // 1턴
        await page.getByRole("button", { name: "추천답변" }).click(); // 추천 열기
        await expect(page.getByRole("group", { name: "추천 답변" })).toBeVisible(); // 추천 표시
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth); // 가로 넘침
        expect(overflow).toBeLessThanOrEqual(0); // 넘침 없음
        await expect(page.getByRole("button", { name: /알림함/ })).toBeInViewport(); // 알림함 노출
        expect(external).toEqual([]); // 외부 요청 없음
    }); // 검증 종료
} // 순회 종료
