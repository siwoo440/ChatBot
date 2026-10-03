import { expect, test, type Page } from "@playwright/test"; // 브라우저 테스트 도구
import { createInitialState } from "../../src/features/core/initial-state"; // 초기 상태 생성기

const stateKey = "mateverse:v1:state"; // 로컬 저장 키
const seedKey = "mateverse:e2e:events-seeded"; // 테스트 준비 키

async function openRianChat(page: Page): Promise<void> // 패널을 닫고 리안 대화 열기
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
    await page.goto("/chat/rian?conversation=conversation-rian"); // 리안 대화
    await expect(page.getByRole("heading", { level: 1, name: "새벽 도서관의 리안" })).toBeVisible(); // 화면 확인
} // 함수 종료

async function send(page: Page, text: string): Promise<void> // Enter로 보내기
{ // 함수 시작
    const input = page.getByRole("textbox", { name: "메시지" }); // 입력창
    await input.fill(text); // 입력
    await input.press("Enter"); // 전송
    await expect(input).toBeEnabled({ timeout: 15_000 }); // 응답 완료
} // 함수 종료

test("조건이 맞으면 이벤트 카드와 칭호가 나오고 새로고침 뒤에도 남으며, 알림함과 그래프에서 확인할 수 있다", async ({ page }) => // 이벤트 흐름 검증
{ // 테스트 시작
    await page.setViewportSize({ width: 1440, height: 900 }); // 데스크톱
    await openRianChat(page); // 열기(호감도 34, 예시 이벤트: 20 이상이면 한 걸음 가까이)
    await send(page, "안녕, 또 왔어"); // 보내기
    const card = page.getByRole("note", { name: "이벤트: 한 걸음 가까이" }); // 이벤트 카드
    await expect(card).toContainText("리안의 말투가 눈에 띄게 부드러워졌다."); // 내레이션
    const panel = page.getByRole("region", { name: "상태창" }); // 상태창
    await expect(panel.getByLabel("칭호")).toContainText("리안 · 말벗"); // 칭호
    await send(page, "오늘은 뭐 읽어?"); // 다음 턴
    await expect(page.getByRole("note", { name: /^이벤트:/ })).toHaveCount(1); // 한 번만
    await panel.getByRole("button", { name: "그래프" }).click(); // 그래프 펼치기
    await expect(panel.getByRole("img", { name: /리안 호감도 변화: 2턴 \d+, 3턴 \d+/ })).toBeVisible(); // 턴별 그래프
    await page.reload(); // 새로고침
    await expect(page.getByRole("note", { name: "이벤트: 한 걸음 가까이" })).toBeVisible(); // 카드 유지
    await page.getByRole("button", { name: /^알림/ }).click(); // 알림함
    await expect(page.getByText("이벤트: 한 걸음 가까이")).toBeVisible(); // 이벤트 알림
}); // 테스트 종료

for (const width of [390, 820, 1440]) // 화면 너비 순회
{ // 순회 시작
    test(`${width}px 대화 화면은 이벤트 카드와 그래프가 있어도 가로로 넘치지 않는다`, async ({ page }) => // 넘침 검증
    { // 테스트 시작
        await page.setViewportSize({ width, height: 900 }); // 화면 크기
        await openRianChat(page); // 열기
        await send(page, "선물 가져왔어, 고마워"); // 보내기
        await expect(page.getByRole("note", { name: "이벤트: 한 걸음 가까이" })).toBeVisible(); // 이벤트 카드
        await page.getByRole("region", { name: "상태창" }).getByRole("button", { name: "그래프" }).click(); // 그래프
        await page.getByText("표로 보기").click(); // 표 펼치기
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth); // 가로 넘침
        expect(overflow).toBeLessThanOrEqual(0); // 넘침 없음
    }); // 테스트 종료
} // 순회 종료
