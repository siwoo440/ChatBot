import { expect, test, type Page } from "@playwright/test"; // 브라우저 테스트 도구
import { createInitialState } from "../../src/features/core/initial-state"; // 초기 상태 생성기
import type { AppState } from "../../src/features/core/types"; // 상태 타입

const stateKey = "mateverse:v1:state"; // 로컬 저장 키
const seedKey = "mateverse:e2e:lore-seeded"; // 테스트 준비 키

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

async function fillLore(page: Page): Promise<void> // 설정 하나와 예시 대화 하나 적기
{ // 함수 시작
    await page.getByRole("button", { name: "＋ 설정 추가 (0/20)" }).click(); // 설정 추가
    await page.getByRole("textbox", { name: "설정 이름" }).fill("금서 구역"); // 이름
    await page.getByRole("textbox", { name: "키워드" }).fill("금서, 봉인"); // 키워드
    await page.getByRole("textbox", { name: "설정 내용" }).fill("금서 구역은 사서만 들어갈 수 있고 밤에는 문이 잠긴다."); // 내용
    await page.getByRole("button", { name: "＋ 예시 추가 (0/5)" }).click(); // 예시 추가
    await page.getByRole("textbox", { name: "사용자 말" }).fill("오늘 뭐 해?"); // 사용자 말
    await page.getByRole("textbox", { name: "캐릭터 답" }).fill("책을 정리하고 있었어."); // 답
} // 함수 종료

test("새 캐릭터에 설정집과 예시 대화를 적고 시험 대화로 확인한 뒤 저장하면, 고칠 때 접힌 채로 다시 보인다", async ({ page }) => // 편집 흐름 검증
{ // 테스트 시작
    await page.setViewportSize({ width: 1440, height: 900 }); // 데스크톱
    await seed(page); // 준비
    await page.goto("/characters/new"); // 새 캐릭터
    await page.getByLabel("캐릭터 이름").fill("새벽 사서"); // 이름
    await page.getByLabel("한 줄 소개").fill("새벽에만 문을 여는 도서관의 사서"); // 소개
    await page.getByRole("button", { name: "다음 단계 ›" }).click(); // 성격과 세계관
    await page.getByRole("textbox", { name: "성격", exact: true }).fill("차분하고 다정하다"); // 성격
    await page.getByLabel("첫 인사").fill("어서 와, 오늘도 왔구나."); // 첫 인사
    await fillLore(page); // 설정집·예시 대화
    await expect(page.getByText("내용 31/500자")).toBeVisible(); // 글자 수
    await page.getByRole("button", { name: "시험 대화" }).click(); // 시험 대화
    const dialog = page.getByRole("dialog", { name: "새벽 사서 시험 대화" }); // 대화상자
    const input = dialog.getByRole("textbox", { name: "시험 메시지" }); // 입력
    await input.fill("봉인된 책이 있어?"); // 키워드가 든 말
    await input.press("Enter"); // 보내기
    await expect(dialog.getByText("1/10턴")).toBeVisible({ timeout: 15_000 }); // 1턴
    await expect(dialog.getByText(/이번 답변에 참고한 설정:/)).toContainText("금서 구역"); // 참고한 설정
    await expect(dialog.getByText(/‘금서 구역’ 이야기가 떠오른다\./)).toBeVisible(); // 답에 드러남
    await input.fill("오늘 뭐 해?"); // 예시와 같은 말
    await input.press("Enter"); // 보내기
    await expect(dialog.getByText("2/10턴")).toBeVisible({ timeout: 15_000 }); // 2턴
    await expect(dialog.getByText("책을 정리하고 있었어.")).toBeVisible(); // 예시 답
    await dialog.getByRole("button", { name: "닫기", exact: true }).click(); // 닫기
    await page.getByRole("button", { name: "공개 저장" }).click(); // 저장
    await expect(page.getByRole("status", { name: "저장 상태" })).toHaveText("공개 저장했습니다."); // 저장 완료
    await expect.poll(async () => page.evaluate((key) => (JSON.parse(window.localStorage.getItem(key) ?? "{}").characters ?? []).some((character: { name: string }) => character.name === "새벽 사서"), stateKey)).toBe(true); // 브라우저에 저장됨
    const id = await page.evaluate((key) => JSON.parse(window.localStorage.getItem(key) ?? "{}").characters.find((character: { name: string }) => character.name === "새벽 사서").id as string, stateKey); // 저장한 캐릭터
    await page.goto(`/characters/${id}/edit`); // 고치기 화면
    const card = page.getByRole("group", { name: "금서 구역" }); // 설정 카드
    await expect(card.getByText("키워드: 금서, 봉인")).toBeVisible(); // 접힌 요약
    await expect(card.getByRole("textbox", { name: "설정 내용" })).toHaveCount(0); // 입력은 접혀 있음
    await card.getByRole("button", { name: "금서 구역 펼치기" }).click(); // 펼치기
    await expect(card.getByRole("textbox", { name: "설정 내용" })).toHaveValue("금서 구역은 사서만 들어갈 수 있고 밤에는 문이 잠긴다."); // 저장된 내용
    await expect(page.getByRole("textbox", { name: "캐릭터 답" })).toHaveValue("책을 정리하고 있었어."); // 예시 대화
}); // 테스트 종료

test("실제 대화에서도 키워드를 말하면 설정이 답에 드러나고 예시와 같은 말에는 예시 답이 온다", async ({ page }) => // 실제 대화 검증
{ // 테스트 시작
    await page.setViewportSize({ width: 1440, height: 900 }); // 데스크톱
    await seed(page, (state) => // 리안에게 설정집과 예시 대화
    { // 변경 시작
        state.characters[0] = { ...state.characters[0], lorebook: [{ id: "lore-forbidden", title: "금서 구역", keywords: ["금서"], content: "사서만 들어갈 수 있다." }], examples: [{ id: "example-1", user: "오늘 뭐 해?", reply: "책을 정리하고 있었어." }] }; // 설정집·예시
    }); // 변경 종료
    await page.goto("/chat/rian?conversation=conversation-rian&version=conversation-rian-version-1"); // 리안 대화(버전까지 적은 주소: 주소를 정리하느라 화면을 다시 만드는 사이에 보낸 말이 사라지지 않게)
    const input = page.getByRole("textbox", { name: "메시지" }); // 입력창
    const log = page.getByRole("list", { name: "대화 메시지" }); // 대화 기록
    await input.fill("금서가 궁금해"); // 키워드
    await input.press("Enter"); // 전송
    await expect(input).toBeEnabled({ timeout: 15_000 }); // 응답 완료
    await expect(log.getByText(/‘금서 구역’ 이야기가 떠오른다\./)).toBeVisible(); // 답에 드러남
    await expect(page.getByText(/참고한 설정/)).toHaveCount(0); // 사용자에게는 설정 안내를 보이지 않음
    await input.fill("오늘 뭐 해?"); // 예시와 같은 말
    await input.press("Enter"); // 전송
    await expect(input).toBeEnabled({ timeout: 15_000 }); // 응답 완료
    await expect(log.getByText("책을 정리하고 있었어.")).toBeVisible(); // 예시 답
}); // 테스트 종료

for (const width of [390, 820, 1440]) // 화면 너비 순회
{ // 순회 시작
    test(`${width}px 편집기는 설정집과 예시 대화를 펼쳐도 가로로 넘치지 않는다`, async ({ page }) => // 넘침 검증
    { // 테스트 시작
        await page.setViewportSize({ width, height: 900 }); // 화면 크기
        await seed(page); // 준비
        await page.goto("/characters/new"); // 새 캐릭터
        await page.getByRole("button", { name: "다음 단계 ›" }).click(); // 성격과 세계관
        await fillLore(page); // 설정집·예시 대화
        await page.getByRole("textbox", { name: "키워드" }).fill("아주긴키워드아주긴키워드아주긴키워드, 금서, 봉인, 사서, 자정"); // 긴 키워드
        expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0); // 펼친 상태 넘침 없음
        await page.getByRole("button", { name: "금서 구역 접기" }).click(); // 접기
        await expect(page.getByText(/^키워드: 아주긴키워드/)).toBeVisible(); // 접힌 요약
        expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0); // 접은 상태 넘침 없음
    }); // 테스트 종료
} // 순회 종료
