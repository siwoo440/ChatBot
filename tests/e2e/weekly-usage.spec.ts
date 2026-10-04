import { expect, test, type Page } from "@playwright/test"; // 브라우저 테스트 도구
import { createInitialState } from "../../src/features/core/initial-state"; // 초기 상태 생성기
import { getWeekKey } from "../../src/features/rewards/weekly-model"; // 주간 미션
import { getDateKey } from "../../src/lib/time/date-key"; // 날짜 키

const stateKey = "mateverse:v1:state"; // 로컬 저장 키
const usageKey = "mateverse:v1:usage-time"; // 오늘 이용 시간 저장 키
const seedKey = "mateverse:e2e:weekly-seeded"; // 테스트 준비 키

async function seed(page: Page, options: { weeklyDone?: boolean; usageMinutes?: number } = {}): Promise<void> // 패널을 닫은 초기 상태 준비(주간 미션·이용 시간 선택)
{ // 함수 시작
    const state = createInitialState(); // 초기 상태
    state.settings.leftPanelOpen = false; // 왼쪽 패널 닫기
    state.settings.rightPanelOpen = false; // 오른쪽 패널 닫기
    if (options.weeklyDone === true) // 주간 미션 하나를 채운 상태
    { // 조건 시작
        state.rewards.weekly = { weekKey: getWeekKey(new Date()), progress: { "weekly-conversations": 3 }, claimed: [] }; // 새 대화 3번
    } // 조건 종료
    const usage = options.usageMinutes === undefined ? null : JSON.stringify({ dateKey: getDateKey(new Date()), activeMs: options.usageMinutes * 60_000, lastTickAt: null, nextReminderAtMs: 60 * 60_000 }); // 오늘 이용 시간
    await page.addInitScript(({ key, guard, value, usageStorageKey, usageValue }) => // 초기 저장
    { // 스크립트 시작
        if (window.localStorage.getItem(guard) === "true") // 중복 준비 판정
        { // 조건 시작
            return; // 덮어쓰기 방지
        } // 조건 종료
        window.localStorage.setItem(key, value); // 상태 저장
        if (usageValue !== null) // 이용 시간 준비
        { // 조건 시작
            window.localStorage.setItem(usageStorageKey, usageValue); // 이용 시간 저장
        } // 조건 종료
        window.localStorage.setItem(guard, "true"); // 준비 기록
    }, { key: stateKey, guard: seedKey, value: JSON.stringify(state), usageStorageKey: usageKey, usageValue: usage }); // 인자
} // 함수 종료

test("주간 미션은 출석하면 오르고, 채운 미션의 보상을 받으면 새로고침 뒤에도 받음으로 남는다", async ({ page }) => // 주간 미션 검증
{ // 테스트 시작
    await seed(page, { weeklyDone: true }); // 준비
    await page.setViewportSize({ width: 1440, height: 900 }); // 데스크톱
    await page.goto("/rewards"); // 출석과 미션
    const weekly = page.getByRole("list", { name: "주간 미션 목록" }); // 주간 미션 목록
    await expect(weekly.getByRole("listitem")).toHaveCount(3); // 세 가지
    await expect(weekly.getByRole("progressbar", { name: "5일 출석하기 진행" })).toHaveAttribute("aria-valuenow", "0"); // 출석 0
    await page.getByRole("button", { name: "출석하기 · +5토큰" }).click(); // 출석
    await expect(weekly.getByRole("progressbar", { name: "5일 출석하기 진행" })).toHaveAttribute("aria-valuenow", "1"); // 출석 1
    await weekly.getByRole("button", { name: "새 대화 3번 시작하기 보상 10토큰 받기" }).click(); // 보상 받기
    await expect(page.getByText("‘새 대화 3번 시작하기’ 보상 10토큰을 받았습니다.")).toBeVisible(); // 안내
    await page.reload(); // 새로고침
    await expect(page.getByRole("list", { name: "주간 미션 목록" }).getByRole("listitem").nth(2)).toContainText("받음"); // 받음 유지
    await expect(page.getByRole("list", { name: "받은 토큰 기록" })).toContainText("주간 미션: 새 대화 3번 시작하기"); // 받은 기록
}); // 테스트 종료

test("오늘 이용 시간은 브라우저 전체에서 이어 세고 60분이 되면 쉬어 가기 알림을 보여 준다", async ({ page, context }) => // 이용 시간 검증
{ // 테스트 시작
    await seed(page, { usageMinutes: 75 }); // 다른 탭에서 이미 75분 쓴 상태
    await page.setViewportSize({ width: 1440, height: 900 }); // 데스크톱
    await page.goto("/settings/profile"); // 프로필 관리
    await expect(page.getByRole("list", { name: "활동 요약" })).toContainText("오늘 이용 시간1시간 15분"); // 오늘 합계
    await page.evaluate(() => document.dispatchEvent(new Event("visibilitychange"))); // 측정 한 번
    await expect(page.getByText(/오늘 1시간 1\d분 동안 이용했어요/)).toBeVisible(); // 60분을 넘겨 알림
    await page.getByRole("button", { name: "계속 이용하기" }).click(); // 알림 확인
    await expect(page.getByText(/동안 이용했어요/)).toHaveCount(0); // 알림 닫힘
    const second = await context.newPage(); // 같은 브라우저의 다른 탭
    await second.goto("/settings/profile"); // 프로필 관리
    await expect(second.getByRole("list", { name: "활동 요약" })).toContainText("오늘 이용 시간1시간 15분"); // 다른 탭도 같은 합계
    await second.evaluate(() => document.dispatchEvent(new Event("visibilitychange"))); // 측정 한 번
    await second.waitForTimeout(300); // 그릴 시간
    await expect(second.getByText(/동안 이용했어요/)).toHaveCount(0); // 이미 확인한 알림은 다시 뜨지 않음
}); // 테스트 종료

for (const width of [390, 820, 1440]) // 화면 너비 순회
{ // 순회 시작
    test(`${width}px 출석과 미션 화면은 주간 미션을 넣어도 가로로 넘치지 않는다`, async ({ page }) => // 넘침 검증
    { // 테스트 시작
        await seed(page, { weeklyDone: true }); // 준비
        await page.setViewportSize({ width, height: 900 }); // 화면 크기
        await page.goto("/rewards"); // 출석과 미션
        await expect(page.getByRole("heading", { name: "주간 미션" })).toBeVisible(); // 주간 미션
        expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0); // 넘침 없음
    }); // 테스트 종료
} // 순회 종료
