import { expect, test, type Page } from "@playwright/test"; // 종단 테스트 도구
import { createInitialState } from "../../src/features/core/initial-state"; // 초기 상태 생성기
import type { AppState } from "../../src/features/core/types"; // 앱 상태 타입

const stateKey = "mateverse:v1:state"; // 로컬 저장 키
const seedKey = "mateverse:e2e:seeded"; // 테스트 준비 키

async function seedState(page: Page, mutate?: (state: AppState) => void): Promise<void> // 상태 준비 함수
{ // 함수 시작
    const state = createInitialState(); // 초기 상태 생성
    state.settings.leftPanelOpen = true; // 왼쪽 패널 열기
    state.settings.rightPanelOpen = false; // 오른쪽 패널 닫기
    mutate?.(state); // 상태 변형 적용
    await page.addInitScript(({ key, guard, value }) => // 초기 저장 스크립트 등록
    { // 스크립트 시작
        if (window.localStorage.getItem(guard) === "true") // 중복 준비 확인
        { // 조건 시작
            return; // 중복 저장 생략
        } // 조건 종료
        window.localStorage.setItem(key, value); // 테스트 상태 저장
        window.localStorage.setItem(guard, "true"); // 준비 완료 기록
    }, { key: stateKey, guard: seedKey, value: JSON.stringify(state) }); // 초기 저장 인자
    await page.goto("/"); // 저장 상태로 메인 이동
    await expect(page.getByRole("complementary", { name: "진행 중인 대화방" })).toHaveAttribute("aria-hidden", "false"); // 상태 복원 확인
} // 함수 종료

test("메뉴와 검색에서 누른 Escape는 왼쪽 창을 닫지 않는다", async ({ page }) => // Escape 처리 검증
{ // 테스트 시작
    await seedState(page); // 상태 준비
    const panel = page.getByRole("complementary", { name: "진행 중인 대화방" }); // 대화 패널
    const more = panel.getByRole("button", { name: "비 오는 교실, 세라 더보기" }); // 더보기 버튼
    await more.click(); // 메뉴 열기
    await expect(panel.getByRole("menuitem", { name: "고정" })).toBeFocused(); // 첫 항목 초점 확인
    await page.keyboard.press("Escape"); // 메뉴 닫기
    await expect(panel.getByRole("menu")).toHaveCount(0); // 메뉴 닫힘 확인
    await expect(more).toBeFocused(); // 초점 복귀 확인
    await expect(panel).toHaveAttribute("aria-hidden", "false"); // 패널 유지 확인
    const search = panel.getByRole("searchbox", { name: "대화방 검색" }); // 검색 입력
    await search.fill("ㅅㄹ"); // 초성 검색
    await expect(panel.locator(".conversation-card-title")).toHaveText(["비 오는 교실, 세라"]); // 검색 결과 확인
    await page.keyboard.press("Escape"); // 검색어 지우기
    await expect(search).toHaveValue(""); // 검색 비움 확인
    await expect(panel).toHaveAttribute("aria-hidden", "false"); // 패널 유지 확인
    await page.keyboard.press("Escape"); // 빈 검색에서 패널 닫기
    await expect(page.locator("aside[aria-label='진행 중인 대화방']")).toHaveAttribute("aria-hidden", "true"); // 패널 닫힘 확인
    await expect(page.getByRole("button", { name: "대화방 패널 열기와 닫기" })).toHaveAttribute("aria-expanded", "false"); // 버튼 상태 확인
}); // 테스트 종료

test("고정과 정렬은 새로고침 뒤에도 유지되고 보관한 대화는 왼쪽 창에서 빠진다", async ({ page }) => // 저장 유지 검증
{ // 테스트 시작
    await seedState(page); // 상태 준비
    const panel = page.getByRole("complementary", { name: "진행 중인 대화방" }); // 대화 패널
    await panel.getByRole("button", { name: "달빛 기록관의 노아 더보기" }).click(); // 노아 메뉴 열기
    await panel.getByRole("menuitem", { name: "고정" }).click(); // 노아 고정
    await panel.getByRole("combobox", { name: "대화방 정렬" }).selectOption("title"); // 이름순 정렬
    await panel.getByRole("button", { name: "비 오는 교실, 세라 더보기" }).click(); // 세라 메뉴 열기
    await panel.getByRole("menuitem", { name: "보관" }).click(); // 세라 보관
    await expect(panel.getByRole("link", { name: /보관함/ })).toContainText("보관한 대화 1"); // 보관 개수 확인
    await page.reload(); // 새로고침
    await expect(panel.getByRole("heading", { name: "고정됨" })).toBeVisible(); // 고정 유지 확인
    await expect(panel.getByRole("combobox", { name: "대화방 정렬" })).toHaveValue("title"); // 정렬 유지 확인
    await expect(panel.locator(".conversation-card-title")).toHaveText(["달빛 기록관의 노아", "새벽 도서관의 리안"]); // 목록 확인
}); // 테스트 종료

test("채팅 중 왼쪽 창에서 바꾼 이름과 닫은 패널은 메시지를 보내도 유지되고 턴 수가 늘어난다", async ({ page }) => // 채팅 병합 검증
{ // 테스트 시작
    await seedState(page); // 상태 준비
    await page.goto("/chat/rian?conversation=conversation-rian&version=conversation-rian-version-1"); // 리안 대화 이동
    const panel = page.getByRole("complementary", { name: "진행 중인 대화방" }); // 대화 패널
    const leftButton = page.getByRole("button", { name: "대화방 패널 열기와 닫기" }); // 왼쪽 버튼
    if (await leftButton.getAttribute("aria-expanded") !== "true") // 패널 닫힘 판정
    { // 조건 시작
        await leftButton.click(); // 패널 열기
    } // 조건 종료
    await expect(panel.locator(".conversation-card-link[aria-current='page']")).toContainText("새벽 도서관의 리안"); // 현재 대화 표시 확인
    await panel.getByRole("button", { name: "새벽 도서관의 리안 더보기" }).click(); // 메뉴 열기
    await panel.getByRole("menuitem", { name: "이름 변경" }).click(); // 이름 변경 선택
    await panel.getByRole("textbox", { name: "대화방 이름" }).fill("새벽 기록 대화"); // 새 이름 입력
    await page.keyboard.press("Enter"); // 이름 저장
    await expect(panel.locator(".conversation-card-title").first()).toHaveText("새벽 기록 대화"); // 이름 변경 확인
    await page.getByRole("button", { name: "열린 패널 닫기" }).click(); // 패널 닫기
    await page.getByRole("textbox", { name: "메시지", exact: true }).fill("이름이 그대로인지 볼게"); // 메시지 입력
    await page.getByRole("button", { name: "전송" }).click(); // 메시지 전송
    await expect(page.getByText("이름이 그대로인지 볼게")).toBeVisible(); // 사용자 메시지 확인
    await expect(page.getByRole("list", { name: "대화 메시지" })).toHaveAttribute("aria-busy", "false", { timeout: 15_000 }); // 응답 완료 확인
    await expect(leftButton).toHaveAttribute("aria-expanded", "false"); // 닫은 패널 유지 확인
    await leftButton.click(); // 패널 다시 열기
    const card = panel.locator(".conversation-card").filter({ hasText: "새벽 기록 대화" }); // 리안 카드
    await expect(card).toContainText("2턴"); // 턴 증가 확인
    await expect(card).toContainText("방금 전"); // 최근 시간 확인
}); // 테스트 종료
