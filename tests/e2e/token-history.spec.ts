import { expect, test, type Page } from "@playwright/test"; // 브라우저 테스트 도구
import { createInitialState } from "../../src/features/core/initial-state"; // 초기 상태 생성기

const stateKey = "mateverse:v1:state"; // 로컬 저장 키
const seedKey = "mateverse:e2e:tokens-seeded"; // 테스트 준비 키

async function seed(page: Page): Promise<void> // 패널을 닫은 초기 상태 준비
{ // 함수 시작
    const state = createInitialState(); // 초기 상태
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

test("대화와 출석으로 쓴 토큰과 받은 토큰이 토큰 이용 내역에 남고 새로고침 뒤에도 보인다", async ({ page }) => // 기록 흐름 검증
{ // 테스트 시작
    await seed(page); // 준비
    await page.goto("/chat/rian?conversation=conversation-rian"); // 리안 대화
    await expect(page.getByText("1토큰 사용")).toBeVisible(); // 보내기 전 예상 비용
    const input = page.getByRole("textbox", { name: "메시지" }); // 입력창
    await input.fill("오늘도 왔어"); // 입력
    await input.press("Enter"); // 전송
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
}); // 테스트 종료

for (const width of [390, 820, 1440]) // 화면 너비 순회
{ // 순회 시작
    test(`${width}px 토큰 이용 내역과 대화 입력창은 가로로 넘치지 않는다`, async ({ page }) => // 넘침 검증
    { // 테스트 시작
        await page.setViewportSize({ width, height: 900 }); // 화면 크기
        await seed(page); // 준비
        await page.goto("/chat/rian?conversation=conversation-rian"); // 리안 대화
        await expect(page.getByText("1토큰 사용")).toBeVisible(); // 예상 비용
        expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0); // 넘침 없음
        await page.goto("/settings/tokens"); // 토큰 이용 내역
        await expect(page.getByRole("heading", { level: 2, name: "최근 7일" })).toBeVisible(); // 그래프 제목
        await page.getByText("표로 보기").click(); // 표 펼치기
        expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0); // 넘침 없음
    }); // 테스트 종료
} // 순회 종료
