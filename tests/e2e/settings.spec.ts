import { expect, test } from "@playwright/test"; // 브라우저 테스트 도구

const settingsPages = ["/settings/profile", "/settings/tokens", "/settings/display", "/settings/notifications", "/settings/privacy", "/support"]; // 설정 페이지 목록

test("설정 첫 주소는 프로필 관리로 이동한다", async ({ page, request }) => // 첫 주소 이동 검증
{ // 테스트 시작
    const response = await request.get("/settings", { maxRedirects: 0 }); // 이동 응답 조회
    expect(response.status()).toBe(307); // 임시 이동 확인
    expect(response.headers()["location"]).toBe("/settings/profile"); // 이동 대상 확인
    await page.goto("/settings"); // 설정 주소 열기
    await expect(page).toHaveURL(/\/settings\/profile$/); // 프로필 주소 확인
    await expect(page.getByRole("heading", { level: 1, name: "프로필 관리" })).toBeVisible(); // 프로필 제목 확인
}); // 테스트 종료

test("오른쪽 사용자 패널의 토큰 이용 내역 메뉴로 해당 페이지를 연다", async ({ page }) => // 패널 이동 검증
{ // 테스트 시작
    await page.goto("/"); // 메인 열기
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible(); // 상태 복원 대기
    await page.keyboard.press("Escape"); // 기본 패널 닫기
    await page.getByRole("button", { name: "사용자 패널 열기와 닫기" }).click(); // 사용자 패널 열기
    await page.getByRole("navigation", { name: "사용자 메뉴" }).getByRole("link", { name: /토큰 이용 내역/ }).click(); // 토큰 메뉴 선택
    await expect(page).toHaveURL(/\/settings\/tokens$/); // 토큰 주소 확인
    await expect(page.getByRole("heading", { level: 1, name: "토큰 이용 내역" })).toBeVisible(); // 토큰 제목 확인
    await expect(page.getByRole("navigation", { name: "설정 메뉴" }).getByRole("link", { name: /토큰 이용 내역/ })).toHaveAttribute("aria-current", "page"); // 현재 메뉴 확인
}); // 테스트 종료

test("390px 화면에서 설정·지원 페이지가 가로로 넘치지 않고 현재 메뉴가 보인다", async ({ page }) => // 모바일 검증
{ // 테스트 시작
    await page.setViewportSize({ width: 390, height: 844 }); // 모바일 크기 설정
    for (const path of settingsPages) // 페이지 순회
    { // 순회 시작
        await page.goto(path); // 페이지 열기
        await expect(page.getByRole("heading", { level: 1 })).toBeVisible(); // 제목 표시 확인
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth); // 가로 넘침 계산
        expect(overflow, path).toBeLessThanOrEqual(0); // 넘침 부재 확인
        await expect(page.getByRole("navigation", { name: "설정 메뉴" }).locator("[aria-current='page']")).toBeInViewport(); // 현재 메뉴 노출 확인
    } // 순회 종료
}); // 테스트 종료
