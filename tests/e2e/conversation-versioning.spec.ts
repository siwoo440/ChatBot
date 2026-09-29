import { expect, test, type Page } from "@playwright/test"; // 종단 테스트 도구
import { createInitialState } from "../../src/features/core/initial-state"; // 초기 상태 생성기
import type { AppState } from "../../src/features/core/types"; // 앱 상태 타입

const stateKey = "mateverse:v1:state"; // 로컬 저장 키
const seedKey = "mateverse:e2e:version-seeded"; // 테스트 준비 키

async function openRianChat(page: Page, mutate?: (state: AppState) => void): Promise<AppState> // 리안 대화 열기
{ // 함수 시작
    const state = createInitialState(); // 초기 상태 생성
    state.settings.leftPanelOpen = false; // 왼쪽 패널 닫기
    state.settings.rightPanelOpen = false; // 오른쪽 패널 닫기
    mutate?.(state); // 상태 변형 적용
    await page.addInitScript(({ key, guard, value }) => // 초기 저장 스크립트 등록
    { // 스크립트 시작
        if (window.localStorage.getItem(guard) === "true") // 중복 준비 판정
        { // 조건 시작
            return; // 상태 덮어쓰기 방지
        } // 조건 종료
        window.localStorage.setItem(key, value); // 테스트 상태 저장
        window.localStorage.setItem(guard, "true"); // 준비 완료 기록
    }, { key: stateKey, guard: seedKey, value: JSON.stringify(state) }); // 초기 저장 인자
    const conversation = state.conversations.find((item) => item.id === "conversation-rian")!; // 리안 대화 조회
    await page.goto(`/chat/rian?conversation=${conversation.id}&version=${conversation.currentVersionId}`); // 리안 대화 이동
    await expect(page.getByRole("heading", { level: 1, name: "새벽 도서관의 리안" })).toBeVisible(); // 대화 화면 확인
    return state; // 준비 상태 반환
} // 함수 종료

test("메시지를 수정하고 원본과 새 버전을 왕복한 뒤 새로고침한다", async ({ page }) => // 버전 경로 검증
{ // 검증 시작
    await openRianChat(page); // 리안 대화 열기
    const userMessage = page.locator('li[data-role="user"]').first(); // 사용자 메시지 조회
    await userMessage.getByRole("button", { name: "수정" }).click(); // 수정 시작
    await userMessage.getByLabel("메시지 수정").fill("새 버전으로 남길 기록이 있어."); // 수정 내용 입력
    await userMessage.getByRole("button", { name: "수정 전송" }).click(); // 수정 전송
    await expect(page.getByLabel("대화 버전 2/2")).toBeVisible(); // 새 버전 확인
    await expect(page).toHaveURL(/version=conversation-rian-version-2/); // 새 버전 주소 확인
    const previous = page.getByRole("button", { name: "이전 대화 버전" }); // 이전 버전 버튼 조회
    await previous.focus(); // 이전 버튼 초점
    await page.keyboard.press("Enter"); // 키보드 전환 실행
    await expect(page.getByLabel("대화 버전 1/2")).toBeVisible(); // 원본 버전 확인
    await expect(page).toHaveURL(/version=conversation-rian-version-1/); // 원본 주소 확인
    await page.reload(); // 대화 화면 새로고침
    await expect(page.getByLabel("대화 버전 1/2")).toBeVisible(); // 새로고침 버전 확인
    const next = page.getByRole("button", { name: "다음 대화 버전" }); // 다음 버전 버튼 조회
    await next.focus(); // 다음 버튼 초점
    await page.keyboard.press("Enter"); // 키보드 전환 실행
    await expect(page.getByLabel("대화 버전 2/2")).toBeVisible(); // 수정 버전 복귀 확인
    page.once("dialog", (dialog) => dialog.accept()); // 삭제 확인 승인
    await page.getByRole("button", { name: "현재 버전 삭제" }).click(); // 수정 버전 삭제
    await expect(page.getByLabel("대화 버전 1/2")).toHaveCount(0); // 전환기 제거 확인
    await expect(page).toHaveURL(/version=conversation-rian-version-1/); // 부모 주소 복귀 확인
}); // 검증 종료

test("스트리밍 중 메시지 동작을 잠그고 완료 뒤 다시 활성화한다", async ({ page }) => // 스트리밍 잠금 검증
{ // 검증 시작
    await openRianChat(page); // 리안 대화 열기
    const editor = page.getByPlaceholder("이야기를 이어가세요"); // 메시지 입력 조회
    await editor.fill("스트리밍 잠금 확인"); // 메시지 입력
    await page.getByRole("button", { name: "전송" }).click(); // 메시지 전송
    await expect(page.getByRole("button", { name: "응답 중단" })).toBeVisible(); // 응답 진행 확인
    await expect(page.getByRole("button", { name: "수정" }).first()).toBeDisabled(); // 수정 잠금 확인
    await expect(page.getByRole("button", { name: "응답 중단" })).toBeHidden(); // 응답 완료 확인
    await expect(page.getByRole("button", { name: "수정" }).first()).toBeEnabled(); // 수정 활성 확인
}); // 검증 종료

test("토큰 부족 수정은 원본 대화와 잔액을 유지한다", async ({ page }) => // 실패 원자성 검증
{ // 검증 시작
    await openRianChat(page, (state) => // 토큰 없는 상태 준비
    { // 변형 시작
        state.wallet.balance = 0; // 잔액 제거
    }); // 토큰 없는 대화 열기
    const originalState = await page.evaluate((key) => window.localStorage.getItem(key), stateKey); // 원본 저장 상태 조회
    const userMessage = page.locator('li[data-role="user"]').first(); // 사용자 메시지 조회
    await userMessage.getByRole("button", { name: "수정" }).click(); // 수정 시작
    await userMessage.getByLabel("메시지 수정").fill("실패해야 하는 수정"); // 수정 내용 입력
    await userMessage.getByRole("button", { name: "수정 전송" }).click(); // 수정 전송
    await expect(page.getByText("수정에 사용할 토큰이 부족합니다.")).toBeVisible(); // 부족 안내 확인
    await expect(page.getByLabel(/대화 버전/)).toHaveCount(0); // 새 버전 부재 확인
    const savedState = await page.evaluate((key) => window.localStorage.getItem(key), stateKey); // 실패 후 저장 상태 조회
    const parsedState = JSON.parse(savedState ?? "{}"); // 저장 상태 해석
    expect(parsedState.wallet.balance).toBe(0); // 잔액 유지 확인
    expect(parsedState.messages.find((message: { id: string; content: string }) => message.id === "message-rian-2")?.content).toBe("오늘 기록할 이야기가 많아."); // 원본 메시지 유지 확인
    expect(JSON.parse(originalState ?? "{}").wallet.balance).toBe(0); // 원본 잔액 확인
}); // 검증 종료

test("390픽셀 채팅 화면과 Mock 흐름은 가로 넘침과 외부 요청이 없다", async ({ page }) => // 모바일 통신 검증
{ // 검증 시작
    const externalConnections: string[] = []; // 외부 통신 목록
    page.on("request", (request) => // 요청 감시
    { // 감시 시작
        const url = new URL(request.url()); // 요청 주소 분석
        if (url.protocol.startsWith("http") && url.hostname !== "127.0.0.1") // 외부 요청 판정
        { // 조건 시작
            externalConnections.push(request.url()); // 외부 요청 기록
        } // 조건 종료
    }); // 요청 감시 종료
    await page.setViewportSize({ width: 390, height: 844 }); // 모바일 화면 설정
    await openRianChat(page); // 리안 대화 열기
    const widths = await page.evaluate(() => ({ body: document.body.scrollWidth, document: document.documentElement.scrollWidth, viewport: window.innerWidth })); // 화면 너비 수집
    expect(widths.body).toBeLessThanOrEqual(widths.viewport); // 본문 넘침 확인
    expect(widths.document).toBeLessThanOrEqual(widths.viewport); // 문서 넘침 확인
    expect(externalConnections).toEqual([]); // 외부 요청 부재 확인
}); // 검증 종료
