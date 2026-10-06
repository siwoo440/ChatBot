import { expect, test, type Page } from "@playwright/test"; // 브라우저 테스트 도구
import { createInitialState } from "../../src/features/core/initial-state"; // 초기 상태 생성기

const stateKey = "mateverse:v1:state"; // 손님 데이터 저장 키
const seedKey = "mateverse:e2e:account-seeded"; // 테스트 준비 키

async function seed(page: Page): Promise<void> // 패널을 닫은 손님 상태 준비
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

test("연습용 계정으로 로그인하면 계정의 데이터가 손님 데이터와 따로 저장되고, 로그아웃하면 손님 데이터로 돌아온다", async ({ page }) => // 계정별 데이터 검증
{ // 테스트 시작
    await seed(page); // 준비
    await page.setViewportSize({ width: 1440, height: 900 }); // 데스크톱
    await page.goto("/characters/harin"); // 하린 상세(손님)
    await page.getByRole("button", { name: "퇴근길 카페의 하린 보관함에 추가" }).click(); // 손님으로 보관
    await expect(page.getByRole("button", { name: "퇴근길 카페의 하린 보관함에서 제거" })).toHaveAttribute("aria-pressed", "true"); // 손님 데이터에 보관됨
    await page.goto("/login"); // 로그인 화면
    await expect(page).toHaveTitle("로그인 | Mate Verse"); // 탭 제목
    await page.getByLabel("계정 이름").fill("소하"); // 계정 이름
    await page.getByRole("button", { name: "로그인" }).click(); // 로그인
    await expect(page).toHaveURL(/\/$/); // 메인으로 새로 엶
    await page.getByRole("button", { name: "사용자 패널 열기와 닫기" }).click(); // 사용자 패널
    await expect(page.getByLabel("로그인 상태")).toContainText("소하"); // 계정 이름
    await expect(page.getByLabel("로그인 상태")).toContainText("연습용 계정"); // 연습용 표시
    await page.getByRole("button", { name: "사용자 패널 열기와 닫기" }).click(); // 사용자 패널 닫기(열린 상태가 저장되지 않게)
    await page.goto("/characters/harin"); // 하린 상세(계정)
    await expect(page.getByRole("button", { name: "퇴근길 카페의 하린 보관함에 추가" })).toHaveAttribute("aria-pressed", "false"); // 계정에는 보관하지 않은 상태
    const keys = await page.evaluate(() => Object.keys(localStorage).filter((key) => key.startsWith("mateverse:v1:u:practice-") && key.endsWith(":state"))); // 계정 칸의 열쇠
    expect(keys).toHaveLength(1); // 계정 데이터가 따로 저장됨
    await page.getByRole("button", { name: "사용자 패널 열기와 닫기" }).click(); // 사용자 패널
    await page.getByRole("button", { name: "로그아웃" }).click(); // 로그아웃
    await expect(page).toHaveURL(/\/$/); // 메인으로 새로 엶
    await page.getByRole("button", { name: "사용자 패널 열기와 닫기" }).click(); // 사용자 패널
    await expect(page.getByRole("link", { name: "로그인", exact: true })).toBeVisible(); // 손님으로 돌아옴
    await page.goto("/characters/harin"); // 하린 상세(손님)
    await expect(page.getByRole("button", { name: "퇴근길 카페의 하린 보관함에서 제거" })).toHaveAttribute("aria-pressed", "true"); // 손님 데이터는 그대로
    await page.goto("/login"); // 로그인 화면
    await expect(page.getByRole("list", { name: "이 브라우저에서 쓴 계정" }).getByRole("button", { name: "소하" })).toBeVisible(); // 쓴 계정이 목록에 남음
}); // 테스트 종료

for (const width of [390, 820, 1440]) // 화면 너비 순회
{ // 순회 시작
    test(`${width}px 로그인 화면과 로그인한 사용자 패널은 가로로 넘치지 않는다`, async ({ page }) => // 넘침 검증
    { // 테스트 시작
        await page.setViewportSize({ width, height: 900 }); // 화면 크기
        await seed(page); // 준비
        await page.goto("/login"); // 로그인 화면
        await expect(page.getByRole("heading", { name: "로그인" })).toBeVisible(); // 제목
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true); // 넘침 없음
        await page.getByLabel("계정 이름").fill("이름이조금긴연습용계정스무글자까지"); // 긴 이름
        await page.getByRole("button", { name: "로그인" }).click(); // 로그인
        await expect(page).toHaveURL(/\/$/); // 메인
        await page.getByRole("button", { name: "사용자 패널 열기와 닫기" }).click(); // 사용자 패널
        await expect(page.getByRole("button", { name: "로그아웃" })).toBeVisible(); // 로그아웃 버튼
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true); // 넘침 없음
    }); // 테스트 종료
} // 순회 종료
