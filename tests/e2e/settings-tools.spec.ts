import { expect, test, type Page } from "@playwright/test"; // 브라우저 테스트 도구
import { createInitialState } from "../../src/features/core/initial-state"; // 초기 상태 생성기
import type { AppState } from "../../src/features/core/types"; // 상태 타입

const stateKey = "mateverse:v1:state"; // 로컬 저장 키
const seedKey = "mateverse:e2e:settings-seeded"; // 테스트 준비 키
const rianChat = "/chat/rian?conversation=conversation-rian&version=conversation-rian-version-1"; // 리안 대화(버전까지 적은 주소)
const settingsPages = ["/settings/profile", "/settings/tokens", "/settings/display", "/settings/notifications", "/settings/privacy", "/support"]; // 설정 페이지 목록

async function seed(page: Page, change: (state: AppState) => void = () => undefined): Promise<void> // 패널을 닫은 초기 상태 준비
{ // 함수 시작
    const state = createInitialState(); // 초기 상태
    state.settings.leftPanelOpen = false; // 왼쪽 패널 닫기
    state.settings.rightPanelOpen = false; // 오른쪽 패널 닫기
    change(state); // 테스트별 변경
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

test("화면 레이아웃에서 고른 배치가 채팅 화면에 적용되고 새로고침 뒤에도 남는다", async ({ page }) => // 배치 적용 검증
{ // 테스트 시작
    await page.setViewportSize({ width: 1440, height: 900 }); // 데스크톱
    await seed(page); // 준비
    await page.goto("/settings/display"); // 화면 레이아웃
    const group = page.getByRole("group", { name: "채팅방 설정 위치" }); // 배치 선택
    await expect(group.getByRole("radio", { name: /^자동/ })).toBeChecked(); // 처음에는 자동
    await expect(group.getByText("지금 화면에 추천")).toHaveCount(1); // 추천은 하나
    await group.getByText("옆 열 넓게", { exact: true }).click(); // 넓게 고르기
    await expect(page.getByText("저장했습니다.")).toBeVisible(); // 저장 안내
    await page.goto(rianChat); // 리안 대화
    await expect(page.locator("main[data-layout]")).toHaveAttribute("data-layout", "D2"); // 넓은 열
    await expect(page.locator("main[data-layout]")).not.toHaveAttribute("data-overlay", "true"); // 옆 열로 보임
    await page.goto("/settings/display"); // 다시 화면 레이아웃
    await expect(group.getByRole("radio", { name: /옆 열 넓게/ })).toBeChecked(); // 새로 열어도 유지
    await group.getByText("서랍형", { exact: true }).click(); // 서랍형 고르기
    await expect(group.getByRole("radio", { name: /서랍형/ })).toBeChecked(); // 선택 반영
    await page.goto(rianChat); // 리안 대화
    await expect(page.locator("main[data-layout]")).toHaveAttribute("data-layout", "M1"); // 서랍형
    await expect(page.locator("main[data-layout]")).toHaveAttribute("data-overlay", "true"); // 서랍으로 열림
}); // 테스트 종료

test("프로필의 팔로우 해제와 개인정보의 메모리 삭제·신고 취소가 새로고침 뒤에도 남는다", async ({ page }) => // 목록 관리 검증
{ // 테스트 시작
    await page.setViewportSize({ width: 1440, height: 900 }); // 데스크톱
    await seed(page, (state) => // 팔로우·메모리·신고가 있는 상태
    { // 변경 시작
        state.followedCreatorIds = ["creator-evening"]; // 팔로우
        state.memories = [{ id: "m1", characterId: "rian", conversationId: "conversation-rian", category: "long", content: "커피를 싫어한다", sourceMessageIds: [], editedByUser: false, createdAt: "2026-10-01T09:00:00.000Z", updatedAt: "2026-10-01T09:00:00.000Z" }]; // 메모리
        state.localReports = [{ id: "report-1", characterId: "rian", reason: "spam", createdAt: "2026-10-01T10:00:00.000Z" }]; // 신고
    }); // 변경 종료
    await page.goto("/settings/profile"); // 프로필
    await expect(page.getByRole("list", { name: "활동 요약" }).getByRole("listitem").filter({ hasText: "팔로우" })).toContainText("1"); // 팔로우 1
    await page.getByRole("button", { name: "저녁다섯시 팔로우 해제" }).click(); // 해제
    await expect(page.getByText(/아직 팔로우한 제작자가 없어요/)).toBeVisible(); // 빈 안내
    await page.goto("/settings/privacy"); // 개인정보
    await page.getByText("새벽 도서관의 리안 · 1개").click(); // 대화방 펼치기
    await page.getByRole("button", { name: "장기 기억 삭제: 커피를 싫어한다" }).click(); // 메모리 삭제
    await expect(page.getByText(/아직 기억해 둔 내용이 없어요/)).toBeVisible(); // 빈 안내
    await page.getByRole("button", { name: "새벽 도서관의 리안 신고 취소" }).click(); // 신고 취소
    await expect(page.getByText("신고한 캐릭터가 없어요.")).toBeVisible(); // 빈 안내
    await page.reload(); // 새로고침
    await expect(page.getByText(/아직 기억해 둔 내용이 없어요/)).toBeVisible(); // 메모리 삭제 유지
    await expect(page.getByText("신고한 캐릭터가 없어요.")).toBeVisible(); // 신고 취소 유지
    await page.goto("/settings/profile"); // 프로필
    await expect(page.getByText(/아직 팔로우한 제작자가 없어요/)).toBeVisible(); // 팔로우 해제 유지
}); // 테스트 종료

test("고객 지원에서 질문을 초성으로 찾고 진단 정보를 본다", async ({ page }) => // 지원 검증
{ // 테스트 시작
    await page.setViewportSize({ width: 1440, height: 900 }); // 데스크톱
    await seed(page); // 준비
    await page.goto("/support"); // 고객 지원
    const count = page.getByRole("status", { name: "찾은 질문" }); // 찾은 질문 수
    await expect(count).toHaveText("질문 11개"); // 전체
    await page.getByRole("searchbox", { name: "질문 검색" }).fill("ㅅㅎ ㄷㅎ"); // 초성(시험 대화)
    await expect(count).toHaveText("질문 1개"); // 한 개
    await page.getByText("만들던 작품을 저장하기 전에 시험해 볼 수 있나요?").click(); // 질문 펼치기
    await expect(page.getByText(/토큰을 쓰지 않고 기록도 남지 않으며/)).toBeVisible(); // 답
    await expect(page.getByRole("textbox", { name: "진단 정보" })).toHaveValue(/데이터 버전: 18\n[\s\S]*화면: 1440×900\n/); // 진단 정보
    await expect(page.getByRole("button", { name: "진단 정보 복사" })).toBeVisible(); // 복사 버튼
}); // 테스트 종료

for (const width of [390, 820, 1440]) // 화면 너비 순회(목록이 채워진 상태)
{ // 순회 시작
    test(`${width}px 설정·지원 페이지는 내용이 있어도 가로로 넘치지 않는다`, async ({ page }) => // 넘침 검증
    { // 테스트 시작
        await page.setViewportSize({ width, height: 900 }); // 화면 크기
        await seed(page, (state) => // 목록이 채워진 상태
        { // 변경 시작
            state.followedCreatorIds = ["creator-evening", "creator-rain"]; // 팔로우
            state.memories = [{ id: "m1", characterId: "rian", conversationId: "conversation-rian", category: "long", content: "아주긴기억".repeat(30), sourceMessageIds: [], editedByUser: false, createdAt: "2026-10-01T09:00:00.000Z", updatedAt: "2026-10-01T09:00:00.000Z" }]; // 긴 메모리
            state.localReports = [{ id: "report-1", characterId: "rian", reason: "harmful-content", createdAt: "2026-10-01T10:00:00.000Z" }]; // 신고
        }); // 변경 종료
        for (const path of settingsPages) // 페이지 순회
        { // 순회 시작
            await page.goto(path); // 페이지 열기
            await expect(page.getByRole("heading", { level: 1 })).toBeVisible(); // 제목 표시 확인
            if (path === "/settings/privacy") // 개인정보 판정
            { // 조건 시작
                await page.getByText("새벽 도서관의 리안 · 1개").click(); // 긴 메모리 펼치기
            } // 조건 종료
            expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth), path).toBeLessThanOrEqual(0); // 넘침 부재 확인
        } // 순회 종료
    }); // 테스트 종료
} // 순회 종료
