import { expect, test, type Page } from "@playwright/test"; // 브라우저 테스트 도구
import { createInitialState } from "../../src/features/core/initial-state"; // 초기 상태 생성기

const stateKey = "mateverse:v1:state"; // 로컬 저장 키
const seedKey = "mateverse:e2e:message-actions-seeded"; // 테스트 준비 키
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

test("메시지 동작은 작은 그림 버튼으로 보이고, 눌러서 복사와 책갈피를 할 수 있다", async ({ page, context }) => // 그림 버튼 동작 검증
{ // 테스트 시작
    await context.grantPermissions(["clipboard-read", "clipboard-write"]); // 클립보드 허용
    await seed(page); // 준비
    await page.setViewportSize({ width: 1440, height: 900 }); // 데스크톱
    await page.goto(chatUrl); // 리안 대화
    const reply = page.getByRole("list", { name: "대화 메시지" }).getByRole("listitem").last(); // 마지막 답변
    const actions = reply.getByRole("group", { name: "메시지 동작" }); // 동작 묶음
    await expect(actions.getByRole("button")).toHaveCount(5); // 복사·삭제·다시 생성·책갈피·명장면 카드
    for (const name of ["복사", "삭제", "다시 생성", "책갈피", "명장면 카드"]) // 버튼 순회
    { // 순회 시작
        const button = actions.getByRole("button", { name, exact: true }); // 이름으로 찾은 버튼
        await expect(button).toHaveText(""); // 보이는 글자 없음
        await expect(button).toHaveAttribute("title", name); // 풍선 도움말
        await expect(button.locator("svg")).toBeVisible(); // 그림
        const box = await button.boundingBox(); // 버튼 크기
        expect(box !== null && box.width <= 32 && box.height <= 32).toBe(true); // 작은 버튼
    } // 순회 종료
    await actions.getByRole("button", { name: "복사", exact: true }).click(); // 복사
    await expect(reply.getByRole("status")).toHaveText("메시지를 복사했습니다."); // 복사 안내
    await actions.getByRole("button", { name: "책갈피", exact: true }).click(); // 책갈피 켜기
    await expect(actions.getByRole("button", { name: "책갈피", exact: true })).toHaveAttribute("aria-pressed", "true"); // 켜짐
    await page.reload(); // 새로고침
    await expect(page.getByRole("list", { name: "대화 메시지" }).getByRole("listitem").last().getByRole("button", { name: "책갈피", exact: true })).toHaveAttribute("aria-pressed", "true"); // 책갈피 유지
}); // 테스트 종료

for (const width of [390, 820, 1440]) // 화면 너비 순회
{ // 순회 시작
    test(`${width}px 메시지 동작 버튼은 한 줄에 놓이고 가로로 넘치지 않는다`, async ({ page }) => // 배치 검증
    { // 테스트 시작
        await seed(page); // 준비
        await page.setViewportSize({ width, height: 844 }); // 화면 크기
        await page.goto(chatUrl); // 리안 대화
        const items = page.getByRole("list", { name: "대화 메시지" }).getByRole("listitem"); // 메시지 항목
        const count = await items.count(); // 메시지 수
        for (let index = 0; index < count; index += 1) // 메시지 순회
        { // 순회 시작
            const boxes = await items.nth(index).getByRole("group", { name: "메시지 동작" }).getByRole("button").evaluateAll((buttons) => buttons.map((button) => { const box = button.getBoundingClientRect(); return { top: Math.round(box.top), width: box.width, height: box.height, right: box.right }; })); // 버튼 위치
            expect(boxes.length).toBeGreaterThan(0); // 버튼 있음
            expect(new Set(boxes.map((box) => box.top)).size).toBe(1); // 한 줄
            expect(boxes.every((box) => box.width <= 32 && box.height <= 32 && box.right <= width)).toBe(true); // 작고 화면 안
        } // 순회 종료
        expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0); // 넘침 없음
    }); // 테스트 종료
} // 순회 종료
