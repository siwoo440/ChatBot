import { expect, test } from "@playwright/test"; // 브라우저 테스트 도구

const stateKey = "mateverse:v1:state"; // 로컬 저장 키

test("휴대폰으로 처음 들어오면 대화 목록이 화면을 덮지 않고 메인 화면이 바로 보인다", async ({ page }) => // 휴대폰 첫 방문 검증
{ // 테스트 시작
    await page.setViewportSize({ width: 390, height: 844 }); // 휴대폰 크기
    await page.goto("/"); // 저장된 데이터 없이 첫 방문
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible(); // 메인 제목
    await expect(page.getByRole("button", { name: "열린 패널 닫기" })).toHaveCount(0); // 화면을 덮는 배경 없음
    await expect.poll(() => page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? "{}").settings?.leftPanelOpen, stateKey)).toBe(false); // 닫힌 상태로 저장
    await page.getByRole("button", { name: "대화방 패널 열기와 닫기" }).click(); // 직접 열기
    await expect(page.getByRole("button", { name: "열린 패널 닫기" })).toBeVisible(); // 열림
    await page.reload(); // 새로 고침
    await expect(page.getByRole("button", { name: "열린 패널 닫기" })).toBeVisible(); // 내가 열어 둔 상태는 유지
}); // 테스트 종료

test("넓은 화면으로 처음 들어오면 전처럼 대화 목록이 열린 채 시작한다", async ({ page }) => // 데스크톱 첫 방문 검증
{ // 테스트 시작
    await page.setViewportSize({ width: 1440, height: 900 }); // 데스크톱 크기
    await page.goto("/"); // 첫 방문
    await expect(page.getByRole("button", { name: "열린 패널 닫기" })).toBeVisible(); // 대화 목록 열림
    await expect.poll(() => page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? "{}").settings?.leftPanelOpen, stateKey)).toBe(true); // 열린 상태로 저장
}); // 테스트 종료
