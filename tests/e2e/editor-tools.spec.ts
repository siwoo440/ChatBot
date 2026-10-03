import { expect, test, type Page } from "@playwright/test"; // 브라우저 테스트 도구
import { createInitialState } from "../../src/features/core/initial-state"; // 초기 상태 생성기

const stateKey = "mateverse:v1:state"; // 로컬 저장 키
const seedKey = "mateverse:e2e:editor-seeded"; // 테스트 준비 키

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

test("새 캐릭터를 단계별로 쓰다가 새로고침해도 자동 저장한 내용을 이어 쓰고, 시험 대화 뒤 공개 저장한다", async ({ page }) => // 제작 도구 흐름 검증
{ // 테스트 시작
    await page.setViewportSize({ width: 1440, height: 900 }); // 데스크톱
    await seed(page); // 준비
    await page.goto("/characters/new"); // 새 캐릭터
    const nav = page.getByRole("navigation", { name: "편집 단계" }); // 편집 단계
    await expect(nav.getByRole("button", { name: /기본 정보/ })).toHaveAttribute("aria-current", "step"); // 첫 단계
    await page.getByLabel("캐릭터 이름").fill("새벽 사서"); // 이름
    await page.getByLabel("한 줄 소개").fill("새벽에만 문을 여는 도서관의 사서"); // 소개
    await page.getByRole("button", { name: "다음 단계 ›" }).click(); // 성격과 세계관
    await page.getByRole("textbox", { name: "성격", exact: true }).fill("차분하고 다정하다"); // 성격
    await expect(page.getByText(/작성 중인 내용을 자동 저장했어요/)).toBeVisible(); // 자동 저장 표시
    page.once("dialog", (dialog) => void dialog.accept()); // 저장하지 않은 변경 경고는 넘김
    await page.reload(); // 새로고침
    const notice = page.getByRole("group", { name: "자동 저장 안내" }); // 자동 저장 안내
    await notice.getByRole("button", { name: "이어서 쓰기" }).click(); // 이어 쓰기
    await expect(page.getByLabel("캐릭터 이름")).toHaveValue("새벽 사서"); // 이름 복원
    await nav.getByRole("button", { name: /성격과 세계관/ }).click(); // 둘째 단계
    await expect(page.getByRole("textbox", { name: "성격", exact: true })).toHaveValue("차분하고 다정하다"); // 성격 복원
    await page.getByLabel("첫 인사").fill("어서 와, 오늘도 왔구나."); // 첫 인사
    await page.getByRole("button", { name: "시험 대화" }).click(); // 시험 대화
    const dialog = page.getByRole("dialog", { name: "새벽 사서 시험 대화" }); // 대화상자
    await expect(dialog.getByText("어서 와, 오늘도 왔구나.")).toBeVisible(); // 첫 인사
    await dialog.getByRole("textbox", { name: "시험 메시지" }).fill("안녕, 처음 왔어"); // 입력
    await dialog.getByRole("textbox", { name: "시험 메시지" }).press("Enter"); // 보내기
    await expect(dialog.getByText("1/10턴")).toBeVisible({ timeout: 15_000 }); // 1턴
    await dialog.getByRole("button", { name: "닫기", exact: true }).click(); // 닫기
    await page.getByRole("button", { name: "공개 저장" }).click(); // 저장
    await expect(page.getByRole("status", { name: "저장 상태" })).toHaveText("공개 저장했습니다."); // 저장 완료
    await page.goto("/characters/new"); // 다시 새 캐릭터
    await expect(page.getByRole("group", { name: "자동 저장 안내" })).toHaveCount(0); // 저장을 마쳐 자동 저장분 없음
    await page.goto("/settings/tokens"); // 토큰 이용 내역
    await expect(page.getByText("최근 7일 동안 0토큰을 받고 0토큰을 썼어요.")).toBeVisible(); // 시험 대화는 토큰을 쓰지 않음
}); // 테스트 종료

for (const width of [390, 820, 1440]) // 화면 너비 순회
{ // 순회 시작
    test(`${width}px 편집기는 단계 줄과 시험 대화 창이 있어도 가로로 넘치지 않는다`, async ({ page }) => // 넘침 검증
    { // 테스트 시작
        await page.setViewportSize({ width, height: 900 }); // 화면 크기
        await seed(page); // 준비
        await page.goto("/characters/new"); // 새 캐릭터
        await expect(page.getByRole("navigation", { name: "편집 단계" })).toBeVisible(); // 단계 줄
        expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0); // 넘침 없음
        await page.getByRole("button", { name: "전체 펼쳐 보기" }).click(); // 전체 보기
        await page.getByLabel("캐릭터 이름").fill("새벽 사서"); // 이름
        await page.getByLabel("한 줄 소개").fill("새벽에만 문을 여는 도서관의 사서"); // 소개
        await page.getByRole("textbox", { name: "성격", exact: true }).fill("차분하고 다정하다"); // 성격
        await page.getByLabel("첫 인사").fill("어서 와, 오늘도 왔구나."); // 첫 인사
        await page.getByRole("button", { name: "시험 대화" }).click(); // 시험 대화
        await expect(page.getByRole("dialog", { name: "새벽 사서 시험 대화" })).toBeVisible(); // 대화상자
        expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0); // 넘침 없음
    }); // 테스트 종료
} // 순회 종료
