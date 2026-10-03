import { expect, test, type Page } from "@playwright/test"; // 브라우저 테스트 도구
import { createInitialState } from "../../src/features/core/initial-state"; // 초기 상태 생성기

const stateKey = "mateverse:v1:state"; // 로컬 저장 키
const seedKey = "mateverse:e2e:referral-seeded"; // 테스트 준비 키

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

test("초대 링크로 들어와 환영 보너스를 받으면 받은 기록에 남고 다시 받을 수 없다", async ({ page }) => // 초대받은 사람 흐름
{ // 테스트 시작
    await seed(page); // 준비
    await page.goto("/invite/wxyz6789"); // 초대 링크
    await expect(page.getByRole("heading", { level: 1, name: "친구가 Mate Verse에 초대했어요" })).toBeVisible(); // 초대 화면
    await page.getByRole("button", { name: "초대 받고 30토큰 받기" }).click(); // 받기
    await expect(page.getByRole("heading", { level: 1, name: "초대 보너스를 받았어요" })).toBeVisible(); // 받은 뒤
    await page.getByRole("link", { name: "출석과 미션 보기" }).click(); // 보상 페이지로
    await expect(page).toHaveURL(/\/rewards$/); // 보상 페이지
    await expect(page.getByRole("region", { name: "보상 요약" }).getByText("1,270")).toBeVisible(); // 잔액 +30
    await expect(page.getByRole("list", { name: "받은 토큰 기록" }).getByText("친구 초대 환영 보너스")).toBeVisible(); // 받은 기록
    await expect(page.getByText(/받은 코드 WXYZ-6789/)).toBeVisible(); // 받은 코드 표시
    await page.goto("/invite/QRST2345"); // 다른 초대 링크
    await expect(page.getByRole("heading", { level: 1, name: "이미 초대 보너스를 받았어요" })).toBeVisible(); // 한 번만
}); // 테스트 종료

test("오른쪽 패널에서 친구 초대로 가서 내 초대 링크를 만들면 새로고침 뒤에도 같은 링크가 남는다", async ({ page }) => // 초대한 사람 흐름
{ // 테스트 시작
    await seed(page); // 준비
    await page.goto("/"); // 메인
    await page.getByRole("button", { name: "사용자 패널 열기와 닫기" }).click(); // 사용자 패널
    await page.getByRole("link", { name: /친구 초대/ }).click(); // 친구 초대
    await expect(page).toHaveURL(/\/rewards#invite$/); // 친구 초대 칸
    await expect(page.getByRole("heading", { level: 2, name: "친구 초대" })).toBeInViewport(); // 헤더에 가리지 않음
    await page.getByRole("button", { name: "내 초대 링크 만들기" }).click(); // 만들기
    const link = await page.getByLabel("내 초대 링크").inputValue(); // 만든 링크
    expect(link).toMatch(/\/invite\/[A-HJ-NP-Z2-9]{8}$/); // 링크 형식
    await page.reload(); // 새로고침
    await expect(page.getByLabel("내 초대 링크")).toHaveValue(link); // 같은 링크
    await page.goto(new URL(link).pathname); // 내 링크 열기
    await expect(page.getByRole("heading", { level: 1, name: "내 초대 링크예요" })).toBeVisible(); // 내 링크 안내
}); // 테스트 종료

test("390px 초대 화면과 친구 초대 칸은 가로로 넘치지 않는다", async ({ page }) => // 넘침 검증
{ // 테스트 시작
    await page.setViewportSize({ width: 390, height: 844 }); // 모바일
    await seed(page); // 준비
    await page.goto("/invite/WXYZ6789"); // 초대 링크
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible(); // 제목
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0); // 넘침 없음
    await page.goto("/rewards#invite"); // 친구 초대 칸
    await page.getByRole("button", { name: "내 초대 링크 만들기" }).click(); // 만들기
    await expect(page.getByLabel("내 초대 링크")).toBeVisible(); // 링크 표시
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0); // 넘침 없음
}); // 테스트 종료
