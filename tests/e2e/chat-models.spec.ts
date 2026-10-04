import { expect, test, type Page } from "@playwright/test"; // 브라우저 테스트 도구
import { createInitialState } from "../../src/features/core/initial-state"; // 초기 상태 생성기

const stateKey = "mateverse:v1:state"; // 로컬 저장 키
const seedKey = "mateverse:e2e:models-seeded"; // 테스트 준비 키
const chatUrl = "/chat/rian?conversation=conversation-rian&version=conversation-rian-version-1"; // 리안 대화(버전까지 적은 주소)

async function seed(page: Page): Promise<void> // 패널을 닫은 초기 상태 준비
{ // 함수 시작
    const state = createInitialState(); // 초기 상태
    state.settings.leftPanelOpen = false; // 왼쪽 패널 닫기
    state.settings.rightPanelOpen = false; // 오른쪽 패널 닫기
    state.settings.chatPanelOpen = false; // 채팅방 설정 닫기
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

test("실제 AI 스위치가 꺼진 서버는 모든 등급을 연습용으로 알리고 답변 요청을 받지 않는다", async ({ page }) => // 서버 통로 검증
{ // 테스트 시작
    const status = await page.request.get("/api/chat"); // 상태 묻기
    expect(await status.json()).toEqual({ enabled: false, tiers: { master: false, premium: false, plus: false, balance: false, smart: false, basic: false, open: false }, models: {} }); // 모두 연습용
    const refused = await page.request.post("/api/chat", { data: { tier: "plus" } }); // 답변 요청
    expect(refused.status()).toBe(503); // 받지 않음
    expect((await refused.json() as { error: string }).error).toBe("disabled"); // 꺼짐
}); // 테스트 종료

test("등급 일곱 개를 별명과 모델 이름으로 보여 주고, 고른 등급의 비용으로 대화한 뒤 새로고침해도 등급이 남는다", async ({ page }) => // 등급 선택 검증
{ // 테스트 시작
    await seed(page); // 준비
    await page.setViewportSize({ width: 1440, height: 900 }); // 데스크톱
    await page.goto(chatUrl); // 리안 대화
    await page.getByRole("button", { name: "채팅 모델 베이직챗, 메시지당 1 토큰" }).click(); // 등급 목록
    const items = page.getByRole("menu", { name: "채팅 모델 선택" }).getByRole("menuitemradio"); // 등급 항목
    await expect(items).toHaveCount(7); // 일곱 등급
    await expect(items.locator("strong")).toHaveText(["마스터챗", "프리미엄챗", "플러스챗", "밸런스챗", "스마트챗", "베이직챗", "오픈챗"]); // 별명
    for (const [index, model] of ["Claude Fable", "Claude Opus", "Claude Sonnet", "GPT", "Gemini Pro", "Gemini Flash", "공개 모델"].entries()) // 모델 이름 순회
    { // 순회 시작
        await expect(items.nth(index)).toContainText(model); // 모델 이름
        await expect(items.nth(index)).toContainText("연습용 AI"); // 열쇠가 없어 연습용
    } // 순회 종료
    await items.nth(0).click(); // 마스터챗 고르기
    await expect(page.getByRole("button", { name: "채팅 모델 마스터챗, 메시지당 12 토큰" })).toBeVisible(); // 등급과 비용
    await expect(page.getByText("12토큰 사용")).toBeVisible(); // 보내기 전 예상 비용
    const input = page.getByRole("textbox", { name: "메시지" }); // 입력창
    await input.fill("오늘도 왔어"); // 입력
    await input.press("Enter"); // 전송
    await expect(input).toBeEnabled({ timeout: 15_000 }); // 응답 완료(연습용 AI)
    expect(await page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? "{}").wallet.balance, stateKey)).toBe(1240 - 12); // 마스터챗 비용 차감
    await page.reload(); // 새로고침
    await expect(page.getByRole("button", { name: "채팅 모델 마스터챗, 메시지당 12 토큰" })).toBeVisible(); // 등급 유지
}); // 테스트 종료

for (const [width, height] of [[390, 844], [820, 844], [820, 1180], [1440, 900]]) // 화면 크기 순회(820×1180은 세로로 긴 태블릿: 등급 버튼이 왼쪽에 놓임)
{ // 순회 시작
    test(`${width}×${height} 등급 목록을 열어도 가로로 넘치지 않고 일곱 등급이 모두 보인다`, async ({ page }) => // 넘침 검증
    { // 테스트 시작
        await seed(page); // 준비
        await page.setViewportSize({ width, height }); // 화면 크기
        await page.goto(chatUrl); // 리안 대화
        await page.getByRole("button", { name: /채팅 모델 베이직챗/ }).click(); // 등급 목록
        const menu = page.getByRole("menu", { name: "채팅 모델 선택" }); // 목록
        await expect(menu.getByRole("menuitemradio")).toHaveCount(7); // 일곱 등급
        const box = await menu.boundingBox(); // 목록 위치
        expect(box !== null && box.x >= 0 && box.x + box.width <= width).toBe(true); // 화면 안에 들어옴
        expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0); // 넘침 없음
    }); // 테스트 종료
} // 순회 종료
