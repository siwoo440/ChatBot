import { expect, test } from "@playwright/test"; // 브라우저 테스트 도구

test("화면 레이아웃에서 언어를 영어로 바꾸면 메뉴가 영어로 바뀌고 새로고침 뒤에도 남는다", async ({ page }) => // 언어 전환 검증
{ // 테스트 시작
    await page.setViewportSize({ width: 1440, height: 900 }); // 데스크톱
    await page.goto("/settings/display"); // 화면 레이아웃
    const mainMenu = page.getByRole("navigation", { name: "주요 메뉴" }); // 위쪽 메뉴(한국어)
    await expect(mainMenu.getByRole("link", { name: "탐색" })).toBeVisible(); // 한국어 메뉴
    await expect(page.locator("html")).toHaveAttribute("lang", "ko"); // 문서 언어
    await page.getByRole("combobox", { name: "화면 언어" }).selectOption("en"); // 영어로
    const englishMenu = page.getByRole("navigation", { name: "Main menu" }); // 위쪽 메뉴(영어)
    await expect(englishMenu.getByRole("link", { name: "Explore" })).toBeVisible(); // 영어 메뉴
    await expect(page.locator("html")).toHaveAttribute("lang", "en"); // 문서 언어
    await page.reload(); // 새로고침
    await expect(page.getByRole("navigation", { name: "Main menu" }).getByRole("link", { name: "Explore" })).toBeVisible(); // 영어 유지
    await page.getByRole("combobox", { name: "Display language" }).selectOption("ko"); // 다시 한국어로
    await expect(page.getByRole("navigation", { name: "주요 메뉴" }).getByRole("link", { name: "탐색" })).toBeVisible(); // 한국어 복귀
}); // 테스트 종료

test.describe("영어 브라우저", () => // 영어 브라우저 묶음
{ // 묶음 시작
    test.use({ locale: "en-US" }); // 브라우저 언어를 영어로

    test("언어를 고르지 않았으면 브라우저 언어를 따라 영어로 보이고, 한국어로 바꿀 수 있다", async ({ page }) => // 자동 언어 검증
    { // 테스트 시작
        await page.setViewportSize({ width: 1440, height: 900 }); // 데스크톱
        await page.goto("/settings/display"); // 화면 레이아웃
        await expect(page.getByRole("navigation", { name: "Main menu" }).getByRole("link", { name: "Explore" })).toBeVisible(); // 영어 메뉴
        await expect(page.locator("html")).toHaveAttribute("lang", "en"); // 문서 언어
        await expect(page.getByRole("combobox", { name: "Display language" })).toHaveValue("auto"); // 자동
        await page.getByRole("combobox", { name: "Display language" }).selectOption("ko"); // 한국어로
        await expect(page.getByRole("navigation", { name: "주요 메뉴" }).getByRole("link", { name: "탐색" })).toBeVisible(); // 한국어 메뉴
    }); // 테스트 종료

    for (const width of [390, 820, 1440]) // 화면 너비 순회
    { // 순회 시작
        test(`${width}px 영어 화면의 메인은 가로로 넘치지 않는다`, async ({ page }) => // 넘침 검증
        { // 테스트 시작
            await page.setViewportSize({ width, height: 900 }); // 화면 크기
            await page.goto("/"); // 메인
            await expect(page.getByRole("heading", { level: 1 })).toBeVisible(); // 제목 표시
            expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0); // 넘침 없음
        }); // 테스트 종료
    } // 순회 종료
}); // 묶음 종료
