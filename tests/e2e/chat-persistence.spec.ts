import { expect, test, type Page } from "@playwright/test"; // 브라우저 테스트 도구
import { createInitialState } from "../../src/features/core/initial-state"; // 초기 상태 생성기

const stateKey = "mateverse:v1:state"; // 로컬 저장 키
const seedKey = "mateverse:e2e:persistence-seeded"; // 테스트 준비 키
const chatUrl = "/chat/rian?conversation=conversation-rian&version=conversation-rian-version-1"; // 리안 대화(버전까지 적은 주소)

async function seed(page: Page, balance?: number): Promise<void> // 패널을 닫은 초기 상태 준비(잔액을 정할 수 있음)
{ // 함수 시작
    const state = createInitialState(); // 초기 상태
    state.settings.leftPanelOpen = false; // 왼쪽 패널 닫기
    state.settings.rightPanelOpen = false; // 오른쪽 패널 닫기
    state.settings.chatPanelOpen = false; // 채팅방 설정 닫기
    if (balance !== undefined) // 잔액 지정
    { // 조건 시작
        state.wallet.balance = balance; // 잔액 반영
    } // 조건 종료
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

async function send(page: Page, text: string): Promise<void> // 말을 보내고 답이 끝날 때까지 기다리기
{ // 함수 시작
    const input = page.getByRole("textbox", { name: "메시지", exact: true }); // 입력창
    await input.fill(text); // 입력
    await input.press("Enter"); // 전송
    await expect(page.getByRole("list", { name: "대화 메시지" }).getByText(text)).toBeVisible(); // 보낸 말 표시
    await expect(input).toBeEnabled({ timeout: 15_000 }); // 응답 완료
} // 함수 종료

test("말을 보내고 새로 고친 뒤 같은 대화에 또 보내도 저장되고, 다시 새로 고쳐도 두 말이 모두 남는다", async ({ page }) => // 새로 고침 뒤 저장 검증
{ // 테스트 시작
    await seed(page); // 준비
    await page.setViewportSize({ width: 1440, height: 900 }); // 데스크톱
    await page.goto(chatUrl); // 리안 대화
    await send(page, "첫 번째로 보낸 말"); // 첫 전송
    await page.reload(); // 새로 고침
    await send(page, "새로 고침 뒤에 보낸 말"); // 둘째 전송
    await expect(page.getByText("저장하지 못했습니다. 브라우저 저장공간을 확인해 주세요.")).toHaveCount(0); // 저장 실패 안내 없음
    await page.reload(); // 다시 새로 고침
    const list = page.getByRole("list", { name: "대화 메시지" }); // 메시지 목록
    await expect(list.getByText("첫 번째로 보낸 말")).toBeVisible(); // 첫 말 유지
    await expect(list.getByText("새로 고침 뒤에 보낸 말")).toBeVisible(); // 둘째 말 유지
    const saved = await page.evaluate((key) => // 저장된 상태 확인
    { // 확인 시작
        const state = JSON.parse(localStorage.getItem(key) ?? "{}"); // 저장 상태
        const ids = state.messages.filter((message: { conversationId: string }) => message.conversationId === "conversation-rian").map((message: { id: string }) => message.id); // 이 대화의 식별자
        return { count: ids.length, unique: new Set(ids).size, balance: state.wallet.balance }; // 개수와 잔액
    }, stateKey); // 확인 종료
    expect(saved).toEqual({ count: 7, unique: 7, balance: 1238 }); // 기본 3개 + 내 말 2개 + 답 2개, 베이직챗 두 번 차감
}); // 테스트 종료

test("토큰이 모자라 보내지 못하면 쓴 글이 입력칸에 남고, 메시지는 추가되지 않는다", async ({ page }) => // 토큰 부족 검증
{ // 테스트 시작
    await seed(page, 0); // 잔액 없이 준비
    await page.setViewportSize({ width: 390, height: 844 }); // 휴대폰
    await page.goto(chatUrl); // 리안 대화
    const input = page.getByRole("textbox", { name: "메시지", exact: true }); // 입력창
    await input.fill("길게 쓴 글이 사라지면 곤란해요"); // 입력
    await input.press("Enter"); // 전송 시도
    await expect(page.getByText("토큰이 부족합니다.")).toBeVisible(); // 부족 안내
    await expect(input).toHaveValue("길게 쓴 글이 사라지면 곤란해요"); // 쓴 글 유지
    await expect(page.getByRole("list", { name: "대화 메시지" }).getByRole("listitem")).toHaveCount(3); // 메시지는 그대로
}); // 테스트 종료
