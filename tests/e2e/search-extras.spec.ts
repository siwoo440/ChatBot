import { expect, test, type Page } from "@playwright/test"; // 브라우저 테스트 도구
import { createInitialState } from "../../src/features/core/initial-state"; // 초기 상태 생성기

const stateKey = "mateverse:v1:state"; // 로컬 저장 키
const seedKey = "mateverse:e2e:search-seeded"; // 테스트 준비 키

async function seed(page: Page, leftPanelOpen = false): Promise<void> // 초기 상태 준비(오른쪽 패널은 닫음)
{ // 함수 시작
    const state = createInitialState(); // 초기 상태
    state.settings.leftPanelOpen = leftPanelOpen; // 왼쪽 패널
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

test("탐색에서 태그를 이어서 골라 좁히고 새로고침해도 고른 태그가 남는다", async ({ page }) => // 여러 태그 검증
{ // 테스트 시작
    await seed(page); // 준비
    await page.setViewportSize({ width: 1440, height: 900 }); // 데스크톱
    await page.goto("/explore"); // 탐색
    await page.getByRole("searchbox", { name: "태그 검색" }).fill("힐링"); // 태그 찾기
    await page.getByRole("group", { name: "태그 검색 결과" }).getByRole("button", { name: /#힐링/ }).click(); // 힐링 고르기
    const narrow = page.getByRole("group", { name: "이어서 좁힐 태그" }); // 이어서 좁히기
    const secondTag = ((await narrow.getByRole("button").first().locator("span").first().textContent()) ?? "").replace("#", ""); // 첫 제안 이름
    await narrow.getByRole("button").first().click(); // 둘째 태그 고르기
    await expect(page.getByRole("heading", { level: 2, name: new RegExp(`#힐링 #${secondTag} 작품`) })).toBeVisible(); // 두 태그 제목
    expect(new URL(page.url()).searchParams.getAll("tag")).toEqual(["힐링", secondTag]); // 주소에 두 태그
    await page.reload(); // 새로고침
    await expect(page.getByRole("group", { name: "고른 태그" }).getByRole("button")).toHaveCount(2); // 두 태그 유지
    await page.getByRole("button", { name: "태그 선택 해제" }).click(); // 모두 해제
    await expect(page.getByRole("group", { name: "고른 태그" })).toHaveCount(0); // 결과 영역 사라짐
}); // 테스트 종료

test("대화 목록에서 지난 말로 찾아 누르면 그 대화가 열린다", async ({ page }) => // 대화 전체 검색 검증
{ // 테스트 시작
    await seed(page, true); // 대화 목록을 연 채로 준비
    await page.setViewportSize({ width: 1440, height: 900 }); // 데스크톱
    await page.goto("/library"); // 보관함
    const panel = page.getByRole("complementary", { name: "진행 중인 대화방" }); // 대화 패널
    await panel.getByRole("searchbox", { name: "대화방 검색" }).fill("창가"); // 지난 말
    await expect(panel.locator(".conversation-card")).toHaveCount(1); // 한 대화만
    await expect(panel.getByRole("link", { name: /새벽 도서관의 리안/ })).toContainText("찾은 말"); // 찾은 말 표시
    await panel.getByRole("link", { name: /새벽 도서관의 리안/ }).click(); // 대화 열기
    await expect(page).toHaveURL(/message=message-rian-1/); // 그 말로 가는 주소
    await expect(page.getByRole("list", { name: "대화 메시지" })).toContainText("이 자리는 늘 네가 오던 창가야."); // 대화 화면
}); // 테스트 종료

test("보관함과 스토리 목록에서 낱말로 찾는다", async ({ page }) => // 목록 검색 검증
{ // 테스트 시작
    await seed(page); // 준비
    await page.setViewportSize({ width: 1440, height: 900 }); // 데스크톱
    await page.goto("/library"); // 보관함
    await page.getByRole("tab", { name: "진행 중인 대화" }).click(); // 대화 탭
    await page.getByRole("searchbox", { name: "보관함 검색" }).fill("우산"); // 세라 대화의 말
    await expect(page.getByRole("status", { name: "찾은 수" })).toHaveText("1개 찾음"); // 찾은 수
    await expect(page.getByRole("tabpanel")).toContainText("비 오는 교실, 세라"); // 세라 대화
    await page.getByRole("searchbox", { name: "보관함 검색" }).fill("없는말"); // 없는 낱말
    await expect(page.getByRole("tabpanel")).toContainText("‘없는말’에 맞는 항목이 없어요."); // 빈 안내
    await page.goto("/stories"); // 스토리 목록
    const list = page.getByRole("region", { name: "지금 시작할 수 있는 스토리" }); // 공개 스토리
    const all = await list.getByRole("link").count(); // 전체 수
    await page.getByRole("searchbox", { name: "스토리 검색" }).fill("하린"); // 등장인물
    await expect(page.getByRole("status", { name: "찾은 수" })).toContainText("개 찾음"); // 찾은 수
    expect(await list.getByRole("link").count()).toBeLessThan(all); // 좁혀짐
}); // 테스트 종료

test("메인에서 고른 정렬과 태그는 새로고침하거나 다른 페이지에 다녀와도 남는다", async ({ page }) => // 조건 기억 검증
{ // 테스트 시작
    await seed(page); // 준비
    await page.setViewportSize({ width: 1440, height: 900 }); // 데스크톱
    await page.goto("/"); // 메인
    await page.getByRole("combobox", { name: "정렬" }).selectOption("popular"); // 인기순
    await page.getByRole("searchbox", { name: "제목과 작가 검색" }).fill("#힐링 "); // 태그 칩으로
    await expect(page.getByRole("button", { name: "#힐링 태그 빼기" })).toBeVisible(); // 칩 생김
    await page.reload(); // 새로고침
    await expect(page.getByRole("combobox", { name: "정렬" })).toHaveValue("popular"); // 정렬 유지
    await expect(page.getByRole("button", { name: "#힐링 태그 빼기" })).toBeVisible(); // 태그 유지
    await page.getByRole("navigation", { name: "주요 메뉴" }).getByRole("link", { name: "탐색" }).click(); // 다른 페이지로
    await expect(page).toHaveURL(/\/explore$/); // 이동이 끝난 뒤
    await page.goBack(); // 돌아오기
    await expect(page.getByRole("button", { name: "#힐링 태그 빼기" })).toBeVisible(); // 태그 유지
    await page.getByRole("button", { name: "조건 지우기" }).click(); // 조건 지우기
    await page.reload(); // 새로고침
    await expect(page.getByRole("combobox", { name: "정렬" })).toHaveValue("recommended"); // 기본으로
    await expect(page.getByRole("button", { name: "#힐링 태그 빼기" })).toHaveCount(0); // 태그 없음
}); // 테스트 종료

for (const width of [390, 820, 1440]) // 화면 너비 순회
{ // 순회 시작
    test(`${width}px 검색창을 넣은 화면과 태그 두 개를 고른 탐색은 가로로 넘치지 않는다`, async ({ page }) => // 넘침 검증
    { // 테스트 시작
        await seed(page); // 준비
        await page.setViewportSize({ width, height: 900 }); // 화면 크기
        for (const target of ["/explore?tag=%ED%9E%90%EB%A7%81&tag=%ED%8C%90%ED%83%80%EC%A7%80", "/library", "/stories", "/images"]) // 화면 순회
        { // 순회 시작
            await page.goto(target); // 화면 열기
            await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible(); // 제목 표시
            const search = page.getByRole("searchbox").first(); // 검색창
            if (await search.count() > 0 && await search.isVisible()) // 검색창이 보이면
            { // 조건 시작
                await search.fill("찾을 수 없는 아주 긴 검색어를 넣어도 넘치지 않아야 해요"); // 긴 검색어
            } // 조건 종료
            expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth), target).toBeLessThanOrEqual(0); // 넘침 없음
        } // 순회 종료
    }); // 테스트 종료
} // 순회 종료
