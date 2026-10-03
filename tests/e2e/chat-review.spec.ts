import { expect, test, type Page } from "@playwright/test"; // 브라우저 테스트 도구
import { createInitialState } from "../../src/features/core/initial-state"; // 초기 상태 생성기

const stateKey = "mateverse:v1:state"; // 로컬 저장 키
const seedKey = "mateverse:e2e:review-seeded"; // 테스트 준비 키
const rianChat = "/chat/rian?conversation=conversation-rian&version=conversation-rian-version-1"; // 리안 대화(버전까지 적은 주소)

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

const messages = (page: Page) => page.getByRole("list", { name: "대화 메시지" }).getByRole("listitem"); // 메시지 항목

test("답변에 책갈피를 넣으면 새로고침 뒤에도 남고, 보관함 책갈피에서 그 답변으로 바로 간다", async ({ page }) => // 책갈피 흐름 검증
{ // 테스트 시작
    await page.setViewportSize({ width: 1440, height: 900 }); // 데스크톱
    await seed(page); // 준비
    await page.goto(rianChat); // 리안 대화
    const last = messages(page).nth(2); // 마지막 답변
    await last.getByRole("button", { name: "책갈피" }).click(); // 책갈피 넣기
    await expect(last.getByRole("button", { name: "책갈피" })).toHaveAttribute("aria-pressed", "true"); // 켜짐
    await expect.poll(async () => page.evaluate((key) => (JSON.parse(window.localStorage.getItem(key) ?? "{}").messages ?? []).some((message: { id: string; bookmarked?: boolean }) => message.id === "message-rian-3" && message.bookmarked === true), stateKey)).toBe(true); // 브라우저에 저장됨
    await page.reload(); // 새로고침
    await expect(messages(page).nth(2).getByRole("button", { name: "책갈피" })).toHaveAttribute("aria-pressed", "true"); // 유지
    await page.goto("/library"); // 보관함
    await page.getByRole("tab", { name: "책갈피" }).click(); // 책갈피 탭
    const link = page.getByRole("list", { name: "책갈피한 답변" }).getByRole("link"); // 답변 링크
    await expect(link).toContainText("오늘도 네 자리를 남겨뒀어."); // 답변 글
    await link.click(); // 그 답변으로
    await expect(page).toHaveURL(/[?&]message=message-rian-3$/); // 답변을 가리키는 주소
    await expect(messages(page).nth(2)).toHaveAttribute("data-focus", "true"); // 그 답변 강조
    await expect(messages(page).nth(2)).toBeInViewport(); // 화면 안에 보임
}); // 테스트 종료

test("대화 안에서 말을 찾아 이전·다음으로 옮기고, 명장면 카드를 이미지로 저장한다", async ({ page }) => // 검색·카드 검증
{ // 테스트 시작
    await page.setViewportSize({ width: 1440, height: 900 }); // 데스크톱
    await seed(page); // 준비
    await page.goto(rianChat); // 리안 대화
    await page.getByRole("button", { name: "다시 보기" }).click(); // 다시 보기 열기
    const bar = page.getByRole("region", { name: "대화 다시 보기" }); // 다시 보기 막대
    await bar.getByRole("searchbox", { name: "대화 검색" }).fill("자리"); // 검색
    await expect(bar.getByRole("status", { name: "찾은 말" })).toHaveText("2/2"); // 가장 최근 것부터
    await expect(messages(page).nth(2)).toHaveAttribute("data-focus", "true"); // 최근 답변
    await bar.getByRole("button", { name: "이전 찾은 말" }).click(); // 이전
    await expect(bar.getByRole("status", { name: "찾은 말" })).toHaveText("1/2"); // 첫 번째
    await expect(messages(page).nth(0)).toHaveAttribute("data-focus", "true"); // 첫 답변
    await bar.getByRole("searchbox", { name: "대화 검색" }).fill("ㅊㄱ"); // 초성(창가)
    await expect(bar.getByRole("status", { name: "찾은 말" })).toHaveText("1/1"); // 한 개
    await bar.getByRole("button", { name: "대화 다시 보기 닫기" }).click(); // 닫기
    await expect(messages(page).nth(0)).not.toHaveAttribute("data-found", "true"); // 찾은 표시 지움
    await messages(page).nth(2).getByRole("button", { name: "명장면 카드" }).click(); // 카드 열기
    const dialog = page.getByRole("dialog", { name: "명장면 카드" }); // 대화상자
    await expect(dialog.getByRole("figure", { name: "카드 미리보기" })).toContainText("오늘도 네 자리를 남겨뒀어."); // 미리보기
    const download = page.waitForEvent("download"); // 내려받기 대기
    await dialog.getByRole("button", { name: "이미지로 저장" }).click(); // 저장
    const file = await download; // 받은 파일
    expect(file.suggestedFilename()).toMatch(/^mateverse-scene-새벽-도서관의-리안-\d{8}\.png$/); // 파일 이름
    await expect(dialog.getByRole("status", { name: "카드 안내" })).toHaveText("명장면 카드를 이미지로 저장했습니다."); // 안내
}); // 테스트 종료

for (const width of [390, 820, 1440]) // 화면 너비 순회
{ // 순회 시작
    test(`${width}px 대화 다시 보기와 명장면 카드는 가로로 넘치지 않는다`, async ({ page }) => // 넘침 검증
    { // 테스트 시작
        await page.setViewportSize({ width, height: 900 }); // 화면 크기
        await seed(page); // 준비
        await page.goto(rianChat); // 리안 대화
        await messages(page).nth(2).getByRole("button", { name: "책갈피" }).click(); // 책갈피 넣기
        await page.getByRole("button", { name: "다시 보기" }).click(); // 다시 보기 열기
        const bar = page.getByRole("region", { name: "대화 다시 보기" }); // 다시 보기 막대
        await bar.getByRole("searchbox", { name: "대화 검색" }).fill("자리"); // 검색
        await bar.getByRole("button", { name: "책갈피 1" }).click(); // 책갈피 목록
        await expect(bar.getByRole("list", { name: "책갈피한 답변" })).toBeVisible(); // 목록 보임
        expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0); // 다시 보기 넘침 없음
        await messages(page).nth(2).getByRole("button", { name: "명장면 카드" }).click(); // 카드 열기
        await expect(page.getByRole("dialog", { name: "명장면 카드" })).toBeVisible(); // 대화상자
        expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0); // 카드 넘침 없음
    }); // 테스트 종료
} // 순회 종료
