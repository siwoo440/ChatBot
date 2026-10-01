import { expect, test } from "@playwright/test"; // 브라우저 테스트 도구

test("19+ 스위치로 모의 성인 인증을 마치고 19세 캐릭터 상세를 연다", async ({ page }) => // 인증 흐름 검증
{ // 테스트 시작
    await page.goto("/characters/rank-017"); // 19세 캐릭터 주소 열기
    await expect(page.getByRole("heading", { level: 1, name: "19세 이상 이용 가능한 캐릭터입니다" })).toBeVisible(); // 잠금 화면 확인
    await page.keyboard.press("Escape"); // 기본 패널 닫기
    const toggle = page.getByRole("switch", { name: "19+ 콘텐츠 보기" }); // 헤더 스위치
    await expect(toggle).toHaveAttribute("aria-checked", "false"); // 꺼짐 확인
    await toggle.click(); // 켜기 요청
    const dialog = page.getByRole("dialog", { name: "성인 인증" }); // 인증 창
    await dialog.getByLabel("생년월일").fill("1995-03-10"); // 생년월일 입력
    await dialog.getByRole("checkbox", { name: /19세 이상이며/ }).check(); // 이용 동의
    await dialog.getByRole("button", { name: "인증하기" }).click(); // 인증 제출
    await expect(dialog).toBeHidden(); // 창 닫힘 확인
    await expect(toggle).toHaveAttribute("aria-checked", "true"); // 켜짐 확인
    await expect(page.getByRole("heading", { level: 1, name: "비 내리는 미래 도시의 태오" })).toBeVisible(); // 상세 표시 확인
    await page.reload(); // 새로고침
    await expect(page.getByRole("heading", { level: 1, name: "비 내리는 미래 도시의 태오" })).toBeVisible(); // 저장 상태 유지 확인
    await page.getByRole("switch", { name: "19+ 콘텐츠 보기" }).click(); // 스위치 끄기
    await expect(page.getByRole("heading", { level: 1, name: "19세 이상 이용 가능한 캐릭터입니다" })).toBeVisible(); // 다시 잠금 확인
}); // 테스트 종료

test("390px·800px 헤더에 19+ 스위치가 넘치지 않고 보인다", async ({ page }) => // 반응형 검증
{ // 테스트 시작
    for (const width of [390, 800]) // 화면 너비 순회
    { // 순회 시작
        await page.setViewportSize({ width, height: 844 }); // 화면 크기 설정
        for (const path of ["/", "/characters/rank-017"]) // 페이지 순회
        { // 페이지 순회 시작
            await page.goto(path); // 페이지 열기
            await expect(page.getByRole("heading", { level: 1 })).toBeVisible(); // 제목 표시 확인
            const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth); // 가로 넘침 계산
            expect(overflow, `${width}px ${path}`).toBeLessThanOrEqual(0); // 넘침 부재 확인
            await expect(page.getByRole("switch", { name: "19+ 콘텐츠 보기" })).toBeInViewport(); // 스위치 노출 확인
            await expect(page.getByRole("button", { name: "사용자 패널 열기와 닫기" })).toBeInViewport(); // 메뉴 버튼 노출 확인
        } // 페이지 순회 종료
    } // 순회 종료
}); // 테스트 종료
