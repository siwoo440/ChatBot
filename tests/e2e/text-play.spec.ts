import { expect, test } from "@playwright/test"; // 브라우저 테스트 도구

test("이전 다운로드 주소는 통합 Text-Play 페이지로 영구 이동한다", async ({ page, request }) => // 주소 이동 검증
{ // 테스트 시작
    const response = await request.get("/text-play/download", { maxRedirects: 0 }); // 이동 응답 조회
    expect(response.status()).toBe(308); // 영구 이동 확인
    expect(response.headers()["location"]).toBe("/text-play"); // 이동 대상 확인
    await page.goto("/text-play/download"); // 이전 주소 열기
    await expect(page).toHaveURL(/\/text-play$/); // 통합 주소 확인
    await expect(page.getByRole("heading", { level: 1, name: /이야기를 읽는 순간에서/ })).toBeVisible(); // 통합 화면 확인
}); // 테스트 종료

test("헤더의 Text-Play 다운로드 버튼 하나로 통합 페이지를 연다", async ({ page }) => // 단일 메뉴 검증
{ // 테스트 시작
    await page.goto("/"); // 홈 열기
    const navigation = page.getByRole("navigation", { name: "주요 메뉴" }); // 주요 메뉴 조회
    await expect(navigation.getByRole("link", { name: /Text-Play|Windows/ })).toHaveCount(1); // 단일 메뉴 확인
    await navigation.getByRole("link", { name: "Text-Play 다운로드" }).click(); // 메뉴 선택
    await expect(page).toHaveURL(/\/text-play$/); // 통합 주소 확인
    await expect(page.getByRole("main").getByRole("button", { name: "다운로드 준비 중" })).toHaveCount(1); // 단일 다운로드 버튼 확인
}); // 테스트 종료

test("하단 안내의 다운로드 버튼 이동은 헤더에 가리지 않는 위치로 이동한다", async ({ page }) => // 앵커 이동 검증
{ // 테스트 시작
    await page.goto("/text-play"); // 통합 페이지 열기
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible(); // 상태 복원 대기
    await page.keyboard.press("Escape"); // 기본 패널 닫기
    await page.getByRole("link", { name: "다운로드 버튼으로 이동" }).click(); // 바로가기 선택
    await expect(page).toHaveURL(/#text-play-download$/); // 앵커 주소 확인
    const position = await page.evaluate(() => // 위치 계산
    { // 계산 시작
        const section = document.getElementById("text-play-download")?.getBoundingClientRect().top ?? -1; // 다운로드 위치
        const header = document.querySelector(".app-header")?.getBoundingClientRect().bottom ?? 0; // 헤더 하단
        return { section, header }; // 위치 반환
    }); // 계산 종료
    expect(position.section).toBeGreaterThanOrEqual(position.header); // 헤더 아래 확인
}); // 테스트 종료

for (const width of [390, 820, 1440]) // 화면 크기 순회
{ // 순회 시작
    test(`${width}px 화면에서 Text-Play 페이지가 가로로 넘치지 않는다`, async ({ page }) => // 반응형 검증
    { // 테스트 시작
        await page.setViewportSize({ width, height: 900 }); // 화면 크기 설정
        await page.goto("/text-play"); // 통합 페이지 열기
        await expect(page.getByRole("heading", { level: 1 })).toBeVisible(); // 제목 표시 확인
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth); // 가로 넘침 계산
        expect(overflow).toBeLessThanOrEqual(0); // 넘침 부재 확인
    }); // 테스트 종료
} // 순회 종료
