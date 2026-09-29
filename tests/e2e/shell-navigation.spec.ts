import { expect, test } from "@playwright/test"; // 브라우저 테스트 도구

test("헤더 내부 이동은 전체 새로고침 없이 패널을 닫는다", async ({ page }) => // 패널 이동 회귀 검증
{ // 테스트 시작
    await page.goto("/"); // 탐색 화면 열기
    const closeButton = page.getByRole("button", { name: "열린 패널 닫기" }); // 배경 닫기 조회
    if (await closeButton.isVisible()) // 기본 패널 확인
    { // 조건 시작
        await closeButton.click(); // 기본 패널 닫기
    } // 조건 종료
    await page.getByRole("button", { name: "사용자 패널 열기와 닫기" }).click(); // 오른쪽 패널 열기
    await page.evaluate(() => window.addEventListener("beforeunload", () => window.sessionStorage.setItem("mateverse:e2e:beforeunload", "true"))); // 새로고침 감시 등록
    await page.getByRole("link", { name: "내 작품" }).click(); // 보관함 이동
    await expect(page).toHaveURL(/\/library$/); // 보관함 주소 확인
    await expect(page.getByRole("button", { name: "대화방 패널 열기와 닫기" })).toHaveAttribute("aria-expanded", "false"); // 왼쪽 닫힘 확인
    await expect(page.getByRole("button", { name: "사용자 패널 열기와 닫기" })).toHaveAttribute("aria-expanded", "false"); // 오른쪽 닫힘 확인
    await expect.poll(() => page.evaluate(() => window.sessionStorage.getItem("mateverse:e2e:beforeunload"))).toBeNull(); // 전체 새로고침 부재 확인
}); // 테스트 종료
