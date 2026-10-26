import { expect, test, type Page } from "@playwright/test"; // 브라우저 테스트 도구
import { createInitialState } from "../../src/features/core/initial-state"; // 초기 상태 생성기
import { createStoryConversation } from "../../src/features/story/story-model"; // 스토리 방 생성

const stateKey = "mateverse:v1:state"; // 로컬 저장 키
const seedKey = "mateverse:e2e:tokens-seeded"; // 테스트 준비 키

async function seed(page: Page, state = createInitialState()): Promise<void> // 검증 상태 준비
{ // 함수 시작
    state.settings.leftPanelOpen = false; // 왼쪽 패널 닫기
    state.settings.rightPanelOpen = false; // 오른쪽 패널 닫기
    await page.addInitScript(({ key, guard, value }) => // 초기 저장
    { // 스크립트 시작
        if (window.localStorage.getItem(guard) === "true") // 중복 준비 판정
        { // 조건 시작
            return; // 덮어쓰기 방지
        } // 조건 종료
        window.localStorage.setItem(key, value); // 상태 저장
        window.localStorage.setItem(guard, "true"); // 준비 기록
    }, { key: stateKey, guard: seedKey, value: JSON.stringify(state) }); // 인자
} // 함수 종료

test("대화와 출석으로 쓴 토큰과 받은 토큰이 토큰 이용 내역에 남고 새로고침 뒤에도 보인다", async ({ page }, testInfo) => // 기록 흐름 검증
{ // 테스트 시작
    await seed(page); // 준비
    await page.goto("/chat/rian?conversation=conversation-rian&version=conversation-rian-version-1"); // 리안 대화(버전까지 적은 주소: 주소를 정리하느라 화면을 다시 만드는 사이에 보낸 말이 사라지지 않게)
    await expect(page.getByText("1토큰 사용")).toBeVisible(); // 보내기 전 예상 비용
    const input = page.getByRole("textbox", { name: "메시지" }); // 입력창
    await input.fill("오늘도 왔어"); // 입력
    await input.press("Enter"); // 전송
    await expect(page.getByRole("region", { name: "상태창" })).toContainText("2턴", { timeout: 15_000 }); // 응답이 끝나 상태창이 2턴으로 바뀜
    await expect(input).toBeEnabled({ timeout: 15_000 }); // 응답 완료
    await page.goto("/rewards"); // 출석과 미션
    await page.getByRole("button", { name: "출석하기 · +5토큰" }).click(); // 출석
    await page.goto("/settings/tokens"); // 토큰 이용 내역
    await expect(page.getByText("최근 7일 동안 5토큰을 받고 1토큰을 썼어요.")).toBeVisible(); // 7일 요약
    await expect(page.getByRole("img", { name: /최근 7일 토큰: .*받음 5 사용 1$/ })).toBeVisible(); // 그래프
    const filter = page.getByRole("group", { name: "기록 종류" }); // 필터
    await expect(filter.getByRole("button", { name: "전체 2" })).toHaveAttribute("aria-pressed", "true"); // 두 건
    await filter.getByRole("button", { name: "사용 1" }).click(); // 사용만
    await expect(page.getByRole("listitem").filter({ hasText: "새벽 도서관의 리안" })).toContainText("−1"); // 대화 기록
    await page.reload(); // 새로고침
    await expect(page.getByRole("group", { name: "기록 종류" }).getByRole("button", { name: "전체 2" })).toBeVisible(); // 기록 유지
    const usage = page.getByRole("listitem").filter({ hasText: "새벽 도서관의 리안" }); // 채팅 사용 내역
    await expect(usage.locator("time")).toHaveText(/\d{4}\.\s*\d{2}\.\s*\d{2}\.\s*\d{2}:\d{2}:\d{2}/); // 한국 날짜와 초 단위 시각
    await page.screenshot({ path: testInfo.outputPath("token-history.png"), fullPage: true }); // 이용 내역 시각 검토
    await usage.getByRole("link").click(); // 사용한 채팅방 열기
    await expect(page).toHaveURL(/\/chat\/rian\?conversation=conversation-rian&version=/); // 해당 채팅방 경로
    await expect(page.getByText("오늘도 왔어", { exact: true })).toBeVisible(); // 사용한 메시지 확인
}); // 테스트 종료

test("스토리 사용 기록과 보관 방 복구는 사용한 원래 채팅방으로 이동", async ({ page }) => // 경로 회귀 검증
{ // 테스트 시작
    const started = createStoryConversation(createInitialState(), "story-moonlit-archive", "2026-10-26T00:00:00.000Z"); // 스토리 방
    const room = started.conversation; // 스토리 대화 식별자
    const state = started.state; // 두 종류의 방이 있는 상태
    state.conversations.find((item) => item.id === "conversation-rian")!.archivedAt = new Date().toISOString(); // 일반 방 보관
    state.tokenRecords = [ // 사용한 방의 원장
        { id: "story-spend", direction: "spend", source: "chat", label: "대화", amount: 1, balance: 1239, conversationId: room.id, conversationTitle: "기록 속 스토리 방", characterId: room.characterId, versionId: room.currentVersionId, createdAt: new Date().toISOString() }, // 스토리 원장
        { id: "archived-spend", direction: "spend", source: "chat", label: "대화", amount: 1, balance: 1238, conversationId: "conversation-rian", conversationTitle: "보관한 리안 대화", characterId: "rian", versionId: "conversation-rian-version-1", createdAt: new Date().toISOString() }, // 보관 방 원장
    ]; // 원장 종료
    await seed(page, state); // 상태 저장
    await page.goto("/settings/tokens"); // 이용 내역
    await page.getByRole("link", { name: "기록 속 스토리 방" }).click(); // 스토리 원장 이동
    await expect(page).toHaveURL((url) => url.pathname === "/stories/story-moonlit-archive/chat" && url.searchParams.get("conversation") === room.id && url.searchParams.get("version") === room.currentVersionId); // 인코딩된 식별자의 원래 값 확인
    await page.goto("/settings/tokens"); // 이용 내역 복귀
    await expect(page.getByText("보관된 채팅방")).toBeVisible(); // 보관 상태 안내
    await expect(page.getByRole("link", { name: "보관한 리안 대화" })).toHaveCount(0); // 잘못된 링크 없음
    await page.getByRole("button", { name: "보관한 리안 대화 채팅방 복구" }).click(); // 원래 방 복구
    await page.getByRole("link", { name: "보관한 리안 대화" }).click(); // 복구한 방 이동
    await expect(page).toHaveURL(/\/chat\/rian\?conversation=conversation-rian&version=conversation-rian-version-1/); // 원래 일반 방
}); // 테스트 종료

for (const width of [390, 820, 1440]) // 화면 너비 순회
{ // 순회 시작
    test(`${width}px 토큰 이용 내역과 대화 입력창은 가로로 넘치지 않는다`, async ({ page }) => // 넘침 검증
    { // 테스트 시작
        await page.setViewportSize({ width, height: 900 }); // 화면 크기
        await seed(page); // 준비
        await page.goto("/chat/rian?conversation=conversation-rian&version=conversation-rian-version-1"); // 리안 대화(버전까지 적은 주소: 주소를 정리하느라 화면을 다시 만드는 사이에 보낸 말이 사라지지 않게)
        await expect(page.getByText("1토큰 사용")).toBeVisible(); // 예상 비용
        expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0); // 넘침 없음
        await page.goto("/settings/tokens"); // 토큰 이용 내역
        await expect(page.getByRole("heading", { level: 2, name: "최근 7일" })).toBeVisible(); // 그래프 제목
        await page.getByText("표로 보기").click(); // 표 펼치기
        expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0); // 넘침 없음
    }); // 테스트 종료
} // 순회 종료
