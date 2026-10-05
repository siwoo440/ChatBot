import { expect, test, type Page } from "@playwright/test"; // 종단 테스트 도구
import { createInitialState } from "../../src/features/core/initial-state"; // 초기 상태 생성기
import type { AppState } from "../../src/features/core/types"; // 앱 상태 타입

const stateKey = "mateverse:v1:state"; // 로컬 저장 키
const seedKey = "mateverse:e2e:seeded"; // 테스트 준비 키

async function seedState(page: Page, mutate?: (state: AppState) => void): Promise<void> // 상태 준비 함수
{ // 함수 시작
    const state = createInitialState(); // 초기 상태 생성
    state.settings.leftPanelOpen = false; // 왼쪽 패널 닫기
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
    await page.goto("/"); // 저장 상태로 탐색 이동
    await expect(page.locator("aside[aria-label='진행 중인 대화방']")).toHaveAttribute("aria-hidden", "true"); // 상태 복원 확인
} // 함수 종료

async function openHarinDetail(page: Page, mutate?: (state: AppState) => void): Promise<void> // 하린 상세 준비 함수
{ // 함수 시작
    await seedState(page, mutate); // 초기 상태 준비
    await page.goto("/characters/harin"); // 하린 상세 이동
    await expect(page.getByRole("heading", { level: 1, name: "퇴근길 카페의 하린" })).toBeVisible(); // 상세 제목 확인
} // 함수 종료

async function useKeyboard(page: Page, target: ReturnType<Page["getByRole"]>, key: "Enter" | "Space"): Promise<void> // 키보드 실행 함수
{ // 함수 시작
    await target.focus(); // 대상 초점
    await expect(target).toBeFocused(); // 초점 확인
    await page.keyboard.press(key); // 키 입력
} // 함수 종료

test("탐색부터 두 개의 하린 대화를 시작하고 보관함에서 각각 확인한다", async ({ page }) => // 핵심 흐름 검증
{ // 테스트 시작
    await seedState(page); // 초기 상태 준비
    await page.goto("/"); // 탐색 이동
    await page.getByRole("link", { name: /퇴근길 카페의 하린/ }).first().click(); // 하린 카드 선택
    await expect(page).toHaveURL(/\/characters\/harin$/); // 상세 주소 확인
    await page.getByRole("radio", { name: /마감 뒤의 한 잔/ }).click(); // 둘째 프리셋 선택
    await page.getByRole("button", { name: "히어로 새 대화 시작" }).click(); // 첫 대화 시작
    await expect(page).toHaveURL(/\/chat\/harin\?conversation=.*&version=.*/); // 대화 주소 확인
    await expect(page.getByRole("heading", { level: 1, name: /퇴근길 카페의 하린/ })).toBeVisible(); // 대화 화면 확인
    await expect(page.getByRole("img", { name: /현재 장면/ })).toHaveCount(0); // 왼쪽 장면 영역 없음
    await page.goto("/characters/harin"); // 상세 재방문
    await expect(page.getByRole("button", { name: "최근 대화 이어하기", exact: true })).toBeVisible(); // 이어하기 노출 확인
    await page.getByRole("button", { name: "최근 대화 이어하기", exact: true }).click(); // 최근 대화 이동
    await expect(page).toHaveURL(/\/chat\/harin\?conversation=.*&version=.*/); // 이어가기 주소 확인
    await page.goto("/characters/harin"); // 상세 재방문
    await page.getByRole("radio", { name: /퇴근 후의 위로/ }).click(); // 첫째 프리셋 선택
    await page.getByRole("button", { name: "새 대화 시작", exact: true }).click(); // 둘째 대화 시작
    await expect(page).toHaveURL(/\/chat\/harin\?conversation=.*&version=.*/); // 둘째 대화 주소 확인
    await page.goto("/library"); // 보관함 이동
    await page.getByRole("tab", { name: "진행 중인 대화" }).click(); // 대화 탭 선택
    const conversationPanel = page.getByRole("tabpanel", { name: "진행 중인 대화" }); // 대화 목록 조회
    await expect(conversationPanel.getByText("퇴근길 카페의 하린 · 마감 뒤의 한 잔", { exact: true })).toBeVisible(); // 첫 대화 확인
    await expect(conversationPanel.getByText("퇴근길 카페의 하린 · 퇴근 후의 위로", { exact: true })).toBeVisible(); // 둘째 대화 확인
}); // 테스트 종료

for (const viewport of [{ width: 390, height: 844 }, { width: 820, height: 1180 }, { width: 1440, height: 1000 }]) // 화면 크기 순회
{ // 반복 시작
    test(`${viewport.width}px 상세 화면에 가로 넘침이 없다`, async ({ page }) => // 반응형 검증
    { // 테스트 시작
        await page.setViewportSize(viewport); // 화면 크기 설정
        await openHarinDetail(page); // 상세 화면 열기
        const widths = await page.evaluate(() => ({ body: document.body.scrollWidth, document: document.documentElement.scrollWidth, viewport: window.innerWidth })); // 가로 너비 수집
        expect(widths.body).toBeLessThanOrEqual(widths.viewport); // 본문 넘침 확인
        expect(widths.document).toBeLessThanOrEqual(widths.viewport); // 문서 넘침 확인
    }); // 테스트 종료
} // 반복 종료

test("긴 설명과 긴 태그도 모바일 화면을 벗어나지 않는다", async ({ page }) => // 긴 콘텐츠 검증
{ // 테스트 시작
    await page.setViewportSize({ width: 390, height: 844 }); // 모바일 크기 설정
    await openHarinDetail(page, (state) => // 긴 상태 주입
    { // 변형 시작
        const harin = state.characters.find((character) => character.id === "harin"); // 하린 조회
        if (harin === undefined) // 하린 부재 확인
        { // 조건 시작
            throw new Error("하린 테스트 데이터 부재"); // 데이터 오류
        } // 조건 종료
        harin.description = "비가 오래 이어지는 저녁에도 손님의 표정을 세심히 살피는 하린의 이야기를 충분히 확인하기 위한 긴 설명입니다. ".repeat(10); // 긴 설명 설정
        harin.tags = ["아주긴태그이름".repeat(12), "퇴근길공감대화", "따뜻한카페이야기"]; // 긴 태그 설정
    }); // 변형 종료
    await expect(page.getByRole("button", { name: "캐릭터 상세 전체 보기" })).toBeVisible(); // 확장 버튼 확인
    const widths = await page.evaluate(() => ({ body: document.body.scrollWidth, document: document.documentElement.scrollWidth, viewport: window.innerWidth })); // 가로 너비 수집
    expect(widths.body).toBeLessThanOrEqual(widths.viewport); // 본문 넘침 확인
    expect(widths.document).toBeLessThanOrEqual(widths.viewport); // 문서 넘침 확인
}); // 테스트 종료

test("모바일 대화 동작은 첫 화면부터 하단 메뉴 위에 고정된다", async ({ page }) => // 모바일 고정 동작 검증
{ // 테스트 시작
    await page.setViewportSize({ width: 390, height: 844 }); // 모바일 크기 설정
    await openHarinDetail(page); // 상세 화면 열기
    const actionBar = page.getByRole("region", { name: "대화 시작 동작", exact: true }); // 대화 동작 조회
    const mobileNavigation = page.getByRole("navigation", { name: "모바일 메뉴" }); // 모바일 메뉴 조회
    const position = await actionBar.evaluate((element) => window.getComputedStyle(element).position); // 배치 방식 조회
    const actionBox = await actionBar.boundingBox(); // 대화 동작 위치 조회
    const navigationBox = await mobileNavigation.boundingBox(); // 모바일 메뉴 위치 조회
    expect(position).toBe("fixed"); // 고정 배치 확인
    expect(actionBox).not.toBeNull(); // 대화 동작 위치 확인
    expect(navigationBox).not.toBeNull(); // 모바일 메뉴 위치 확인
    expect((actionBox?.y ?? 0) + (actionBox?.height ?? 0)).toBeLessThanOrEqual(navigationBox?.y ?? 0); // 메뉴 겹침 방지 확인
}); // 테스트 종료

test("키보드만으로 확장·프리셋·보관·공유·신고·대화 시작을 수행한다", async ({ page, context }) => // 키보드 접근성 검증
{ // 테스트 시작
    await context.grantPermissions(["clipboard-read", "clipboard-write"]); // 클립보드 권한 허용
    await openHarinDetail(page, (state) => // 긴 설명 상태 주입
    { // 변형 시작
        const harin = state.characters.find((character) => character.id === "harin"); // 하린 조회
        if (harin === undefined) // 하린 부재 확인
        { // 조건 시작
            throw new Error("하린 테스트 데이터 부재"); // 데이터 오류
        } // 조건 종료
        harin.description = "키보드 확장 동작을 확인하기 위한 하린의 긴 상세 설명입니다. ".repeat(12); // 긴 설명 설정
    }); // 변형 종료
    const expandButton = page.getByRole("button", { name: "캐릭터 상세 전체 보기" }); // 확장 버튼 조회
    await useKeyboard(page, expandButton, "Enter"); // 상세 확장 실행
    await expect(page.getByRole("button", { name: "캐릭터 상세 접기" })).toBeVisible(); // 확장 상태 확인
    const preset = page.getByRole("radio", { name: /마감 뒤의 한 잔/ }); // 프리셋 조회
    await useKeyboard(page, preset, "Enter"); // 프리셋 선택 실행
    await expect(preset).toHaveAttribute("aria-checked", "true"); // 프리셋 상태 확인
    const bookmark = page.getByRole("button", { name: "퇴근길 카페의 하린 보관함에 추가" }); // 보관 버튼 조회
    await useKeyboard(page, bookmark, "Space"); // 보관 실행
    await expect(page.getByRole("button", { name: "퇴근길 카페의 하린 보관함에서 제거" })).toHaveAttribute("aria-pressed", "true"); // 보관 상태 확인
    const share = page.getByRole("button", { name: "퇴근길 카페의 하린 공유" }); // 공유 버튼 조회
    await useKeyboard(page, share, "Enter"); // 공유 실행
    await expect(page.getByRole("status")).toHaveText("공유 링크를 복사했습니다."); // 공유 결과 확인
    const more = page.getByRole("button", { name: "퇴근길 카페의 하린 신고" }); // 신고 버튼 조회
    await useKeyboard(page, more, "Enter"); // 신고 창 열기
    const reportDialog = page.getByRole("dialog", { name: "캐릭터 신고" }); // 신고 창 조회
    await expect(reportDialog).toBeVisible(); // 신고 창 표시 확인
    const reportReason = page.getByRole("radio", { name: "저작권 또는 권리 침해" }); // 신고 사유 조회
    await useKeyboard(page, reportReason, "Space"); // 신고 사유 선택
    const submitReport = page.getByRole("button", { name: "신고 접수" }); // 신고 접수 버튼 조회
    await useKeyboard(page, submitReport, "Enter"); // 신고 접수 실행
    await expect(reportDialog).toBeHidden(); // 신고 창 닫힘 확인
    await expect(more).toBeFocused(); // 초점 복귀 확인
    const startButton = page.getByRole("button", { name: "새 대화 시작", exact: true }); // 새 대화 버튼 조회
    await useKeyboard(page, startButton, "Enter"); // 새 대화 시작
    await expect(page).toHaveURL(/\/chat\/harin\?conversation=.*&version=.*/); // 대화 이동 확인
}); // 테스트 종료

test("Mock 모드 상세 흐름은 외부 HTTP와 WebSocket을 사용하지 않는다", async ({ page }) => // 외부 통신 차단 검증
{ // 테스트 시작
    const externalConnections: string[] = []; // 외부 통신 목록
    page.on("request", (request) => // 요청 감시
    { // 감시 시작
        const url = new URL(request.url()); // 요청 주소 분석
        if (url.protocol.startsWith("http") && url.hostname !== "127.0.0.1") // 외부 요청 판정
        { // 조건 시작
            externalConnections.push(request.url()); // 외부 요청 기록
        } // 조건 종료
    }); // 요청 감시 종료
    page.on("websocket", (socket) => // 소켓 감시
    { // 감시 시작
        const url = new URL(socket.url()); // 소켓 주소 분석
        if (url.hostname !== "127.0.0.1") // 외부 소켓 판정
        { // 조건 시작
            externalConnections.push(socket.url()); // 외부 소켓 기록
        } // 조건 종료
    }); // 소켓 감시 종료
    await openHarinDetail(page); // 상세 화면 열기
    await page.getByRole("button", { name: "퇴근길 카페의 하린 좋아요" }).click(); // 로컬 좋아요 실행
    await page.getByRole("button", { name: "새 대화 시작", exact: true }).click(); // 로컬 대화 시작
    await expect(page).toHaveURL(/\/chat\/harin\?conversation=.*&version=.*/); // 대화 이동 확인
    expect(externalConnections).toEqual([]); // 외부 통신 부재 확인
}); // 테스트 종료
