import { expect, test, type Page } from "@playwright/test"; // 브라우저 테스트 도구
import { createInitialState } from "../../src/features/core/initial-state"; // 초기 상태 생성기

const stateKey = "mateverse:v1:state"; // 로컬 저장 키
const seedKey = "mateverse:e2e:rewards-seeded"; // 테스트 준비 키

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

test("메인 카드로 들어가 출석하면 토큰을 받고 새로고침 뒤에도 출석 완료로 남는다", async ({ page }) => // 출석 흐름 검증
{ // 테스트 시작
    await seed(page); // 준비
    await page.goto("/"); // 메인
    const menu = page.getByRole("button", { name: "사용자 패널 열기와 닫기" }); // 메뉴 버튼
    await expect(menu).toHaveAttribute("title", "받을 수 있는 출석·미션 보상 1개"); // 받을 보상 점
    await page.getByRole("link", { name: /오늘의 출석 도장을 찍어 보세요/ }).click(); // 메인 카드
    await expect(page).toHaveURL(/\/rewards$/); // 보상 페이지
    await expect(page.getByRole("heading", { level: 1, name: "출석과 미션" })).toBeVisible(); // 제목
    await expect(page.getByRole("navigation", { name: "설정 메뉴" }).getByRole("link", { name: /출석과 미션/ })).toHaveAttribute("aria-current", "page"); // 현재 메뉴
    await page.getByRole("button", { name: "출석하기 · +5토큰" }).click(); // 출석
    await expect(page.getByText("출석 1일차 도장을 찍고 5토큰을 받았습니다.")).toBeVisible(); // 안내
    await expect(page.getByRole("listitem", { name: "1일차, 5토큰, 출석 완료" })).toBeVisible(); // 도장
    await expect(page.getByRole("region", { name: "보상 요약" }).getByText("1,245")).toBeVisible(); // 잔액 +5
    await expect(menu).not.toHaveAttribute("title"); // 받을 보상 없음
    await page.reload(); // 새로고침
    await expect(page.getByRole("button", { name: "오늘 출석 완료" })).toBeDisabled(); // 출석 유지
    await expect(page.getByRole("list", { name: "받은 토큰 기록" }).getByText("출석 1일차")).toBeVisible(); // 기록 유지
}); // 테스트 종료

test("대화에서 메시지를 보내면 미션 진행이 오르고 오른쪽 패널 카드에 반영된다", async ({ page }) => // 미션 진행 검증
{ // 테스트 시작
    await seed(page); // 준비
    await page.goto("/chat/rian?conversation=conversation-rian&version=conversation-rian-version-1"); // 리안 대화(버전까지 적은 주소: 주소를 정리하느라 화면을 다시 만드는 사이에 보낸 말이 사라지지 않게)
    const input = page.getByRole("textbox", { name: "메시지" }); // 입력창
    await input.fill("오늘도 왔어"); // 입력
    await input.press("Enter"); // 전송
    await expect(page.getByRole("region", { name: "상태창" })).toContainText("2턴", { timeout: 15_000 }); // 응답이 끝나 상태창이 2턴으로 바뀜(끝나기 전에 화면을 옮기면 대화가 저장되지 않음)
    await expect(input).toBeEnabled({ timeout: 15_000 }); // 응답 완료
    await page.getByRole("button", { name: "사용자 패널 열기와 닫기" }).click(); // 사용자 패널
    const card = page.getByRole("link", { name: /출석·미션/ }); // 출석·미션 카드
    await expect(card).toContainText("오늘 출석 전"); // 출석 전
    await card.click(); // 보상 페이지로
    await expect(page).toHaveURL(/\/rewards$/); // 보상 페이지
    await expect(page.getByRole("progressbar", { name: "메시지 5번 보내기 진행" })).toHaveAttribute("aria-valuenow", "1"); // 1/5
}); // 테스트 종료

for (const width of [390, 820, 1440]) // 화면 너비 순회
{ // 순회 시작
    test(`${width}px 출석과 미션 화면은 가로로 넘치지 않고 외부 요청이 없다`, async ({ page }) => // 넘침 검증
    { // 테스트 시작
        const external: string[] = []; // 외부 요청
        page.on("request", (request) => // 요청 감시
        { // 감시 시작
            const url = new URL(request.url()); // 주소
            if (!["127.0.0.1", "localhost"].includes(url.hostname) && url.protocol !== "data:" && url.protocol !== "blob:") // 외부 판정
            { // 조건 시작
                external.push(request.url()); // 기록
            } // 조건 종료
        }); // 감시 종료
        await page.setViewportSize({ width, height: 900 }); // 화면 크기
        await seed(page); // 준비
        await page.goto("/rewards"); // 보상 페이지
        await expect(page.getByRole("heading", { level: 1, name: "출석과 미션" })).toBeVisible(); // 제목
        await page.getByRole("button", { name: "출석하기 · +5토큰" }).click(); // 출석
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth); // 가로 넘침
        expect(overflow).toBeLessThanOrEqual(0); // 넘침 없음
        expect(external).toEqual([]); // 외부 요청 없음
    }); // 테스트 종료
} // 순회 종료
