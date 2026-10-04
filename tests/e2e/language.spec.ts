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

    test("없는 주소의 안내와 Text-Play 소개, 자주 묻는 질문도 영어로 보인다", async ({ page }) => // 나머지 화면 검증
    { // 테스트 시작
        await page.setViewportSize({ width: 1440, height: 900 }); // 데스크톱
        await page.goto("/no-such-page"); // 없는 주소
        await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible(); // 영어 안내
        await expect(page.getByRole("link", { name: "Open library" })).toBeVisible(); // 영어 링크
        await page.goto("/text-play"); // Text-Play 소개
        await expect(page.getByText("Choices + typing")).toBeVisible(); // 요약 글자
        await expect(page.getByText("Run the installer")).toBeVisible(); // 설치 순서
        await page.goto("/support"); // 고객 지원
        await page.getByRole("searchbox", { name: "Search questions" }).fill("token"); // 영어로 질문 찾기
        await expect(page.getByText("How do I get tokens?")).toBeVisible(); // 영어 질문
    }); // 테스트 종료

    test("영어 화면에서는 AI가 영어로 답하고 상태창과 추천 답변도 영어로 나온다", async ({ page }) => // 답변 언어 검증
    { // 테스트 시작
        await page.setViewportSize({ width: 1440, height: 900 }); // 데스크톱
        await page.goto("/chat/rian?conversation=conversation-rian&version=conversation-rian-version-1"); // 리안 대화(버전까지 적은 주소)
        const input = page.getByRole("textbox", { name: "Message", exact: true }); // 입력창
        await input.fill("Hello again"); // 입력
        await input.press("Enter"); // 전송
        await expect(input).toBeEnabled({ timeout: 15_000 }); // 응답 완료
        await expect(page.getByRole("list", { name: "Chat messages" })).toContainText(/I want to hear more of your story|I'll remember how you feel|The mood changed when you came/); // 영어 답변
        await expect(page.getByRole("region", { name: "Status panel" })).toContainText(/(Sun|Mon|Tues|Wednes|Thurs|Fri|Satur)day \d\d:\d\d/); // 작품 속 시간도 영어
        await expect(page.getByRole("region", { name: "Status panel" })).toContainText("Affection"); // 기본 스탯 이름도 영어
    }); // 테스트 종료

    test("영어 화면에서는 브라우저 탭 제목과 날짜도 영어로 보인다", async ({ page }) => // 탭 제목·날짜 검증
    { // 테스트 시작
        await page.setViewportSize({ width: 1440, height: 900 }); // 데스크톱
        await page.goto("/settings/tokens"); // 토큰 이용 내역
        await expect(page).toHaveTitle("Token history | Mate Verse"); // 영어 탭 제목
        await expect(page.locator('[aria-label^="Tokens over the last 7 days"]')).toHaveAttribute("aria-label", /(Mon|Tue|Wed|Thu|Fri|Sat|Sun), [A-Z][a-z]{2} \d+/); // 영어 날짜
        await page.getByRole("navigation", { name: "Main menu" }).getByRole("link", { name: "Explore" }).click(); // 메뉴로 이동
        await expect(page).toHaveTitle("Explore | Mate Verse"); // 옮긴 화면의 제목도 영어
        await page.goto("/settings/display"); // 화면 레이아웃
        await page.getByRole("combobox", { name: "Display language" }).selectOption("ko"); // 한국어로
        await expect(page).toHaveTitle("화면 레이아웃 | Mate Verse"); // 제목도 한국어로 돌아옴
    }); // 테스트 종료

    for (const target of ["/settings/privacy", "/rewards", "/support", "/text-play", "/library"]) // 나머지 화면 순회
    { // 순회 시작
        test(`390px 영어 화면의 ${target} 화면은 가로로 넘치지 않는다`, async ({ page }) => // 넘침 검증
        { // 테스트 시작
            await page.setViewportSize({ width: 390, height: 844 }); // 휴대폰 크기
            await page.goto(target); // 화면 열기
            await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible(); // 제목 표시
            expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0); // 넘침 없음
        }); // 테스트 종료
    } // 순회 종료

    for (const width of [390, 820, 1440]) // 화면 너비 순회
    { // 순회 시작
        test(`${width}px 영어 화면의 메인은 가로로 넘치지 않는다`, async ({ page }) => // 넘침 검증
        { // 테스트 시작
            await page.setViewportSize({ width, height: 900 }); // 화면 크기
            await page.goto("/"); // 메인
            await expect(page.getByRole("heading", { level: 1 })).toHaveText(/whose world will you step into\?/); // 제목 표시(낱말 사이 띄어쓰기)
            await expect(page.getByText(/\d+ mates are waiting/)).toBeVisible(); // 숫자와 낱말 사이 띄어쓰기
            expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0); // 넘침 없음
        }); // 테스트 종료
    } // 순회 종료
}); // 묶음 종료
