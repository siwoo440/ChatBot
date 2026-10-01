import { expect, test, type Page } from "@playwright/test"; // 브라우저 테스트 도구

async function closeOpenPanels(page: Page): Promise<void> // 기본 패널 닫기
{ // 함수 시작
    const closeButton = page.getByRole("button", { name: "열린 패널 닫기" }); // 배경 닫기 조회
    if (await closeButton.isVisible()) // 열린 패널 확인
    { // 조건 시작
        await closeButton.click(); // 패널 닫기
    } // 조건 종료
} // 함수 종료

test("없는 페이지는 앱 헤더를 유지한 채 404 안내를 보여 준다", async ({ page }) => // 404 화면 검증
{ // 테스트 시작
    const response = await page.goto("/missing-page-for-e2e"); // 없는 주소 열기
    expect(response?.status()).toBe(404); // 응답 코드 확인
    await expect(page.getByRole("heading", { level: 1, name: "페이지를 찾을 수 없습니다" })).toBeVisible(); // 안내 제목 확인
    await expect(page.getByRole("navigation", { name: "주요 메뉴" })).toBeVisible(); // 앱 헤더 유지 확인
    await closeOpenPanels(page); // 기본 패널 닫기
    await page.getByRole("main").getByRole("link", { name: "탐색으로 이동" }).click(); // 탐색 이동
    await expect(page).toHaveURL(/\/$/); // 홈 주소 확인
}); // 테스트 종료

test("없는 캐릭터의 대화 주소는 앱을 멈추지 않고 부재 안내를 보여 준다", async ({ page }) => // 대화 부재 검증
{ // 테스트 시작
    const pageErrors: string[] = []; // 페이지 오류 기록
    page.on("pageerror", (error) => pageErrors.push(error.message)); // 오류 수집
    await page.goto("/chat/unknown-character"); // 없는 캐릭터 대화 열기
    await expect(page.getByRole("heading", { level: 1, name: "대화할 캐릭터를 찾을 수 없습니다" })).toBeVisible(); // 안내 제목 확인
    await expect(page.getByRole("main").getByRole("link", { name: "보관함 열기" })).toHaveAttribute("href", "/library"); // 보관함 링크 확인
    expect(pageErrors).toEqual([]); // 실행 오류 부재 확인
}); // 테스트 종료

test("390px 화면에서 안내 카드가 가로로 넘치지 않는다", async ({ page }) => // 모바일 넘침 검증
{ // 테스트 시작
    await page.setViewportSize({ width: 390, height: 844 }); // 모바일 크기 설정
    await page.goto("/characters/unknown-character"); // 없는 캐릭터 상세 열기
    await expect(page.getByRole("heading", { level: 1, name: "캐릭터를 찾을 수 없습니다" })).toBeVisible(); // 안내 제목 확인
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth); // 가로 넘침 계산
    expect(overflow).toBeLessThanOrEqual(0); // 넘침 부재 확인
}); // 테스트 종료
