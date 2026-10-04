import { expect, test, type Page } from "@playwright/test"; // 브라우저 테스트 도구
import { createInitialState } from "../../src/features/core/initial-state"; // 초기 상태 생성기

const stateKey = "mateverse:v1:state"; // 로컬 저장 키
const seedKey = "mateverse:e2e:polish-extras-seeded"; // 테스트 준비 키

async function seed(page: Page, oldCreators = false): Promise<void> // 패널을 닫은 초기 상태 준비(예전 제작자 모양으로도 준비 가능)
{ // 함수 시작
    const state = createInitialState(); // 초기 상태
    state.settings.leftPanelOpen = false; // 왼쪽 패널 닫기
    state.settings.rightPanelOpen = false; // 오른쪽 패널 닫기
    if (oldCreators) // 예전 저장 데이터 모양
    { // 조건 시작
        state.characters = state.characters.map((character) => character.id.startsWith("rank-") ? { ...character, creatorId: "creator-ranking-lab", creatorName: "메이트버스 랭킹 연구소" } : character); // 랭킹 캐릭터를 한 제작자로
        state.followedCreatorIds = ["creator-ranking-lab"]; // 예전 제작자 팔로우
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

test("삭제 확인 창은 키보드만으로 다룰 수 있다", async ({ page }) => // 대화상자 키보드 검증
{ // 테스트 시작
    await seed(page); // 준비
    await page.setViewportSize({ width: 1440, height: 900 }); // 데스크톱
    await page.goto("/library"); // 보관함
    await page.getByRole("tab", { name: "진행 중인 대화" }).click(); // 대화 탭
    const opener = page.getByRole("button", { name: "새벽 도서관의 리안 삭제" }); // 삭제 버튼
    await opener.focus(); // 키보드로 이동
    await page.keyboard.press("Enter"); // 창 열기
    const dialog = page.getByRole("dialog", { name: "대화 삭제" }); // 삭제 창
    await expect(dialog.getByRole("button", { name: "취소" })).toBeFocused(); // 취소에 초점
    await page.keyboard.press("Tab"); // 다음
    await expect(dialog.getByRole("button", { name: "대화 삭제 확인" })).toBeFocused(); // 확인으로
    await page.keyboard.press("Tab"); // 마지막에서 다음
    await expect(dialog.getByRole("button", { name: "취소" })).toBeFocused(); // 창 안에서 처음으로
    await page.keyboard.press("Escape"); // 닫기
    await expect(dialog).toHaveCount(0); // 창 닫힘
    await expect(opener).toBeFocused(); // 연 버튼으로 복귀
}); // 테스트 종료

test("예전에 저장한 데이터의 기본 캐릭터도 제작자가 고르게 나뉜다", async ({ page }) => // 제작자 나누기 검증
{ // 테스트 시작
    await seed(page, true); // 예전 모양으로 준비
    await page.setViewportSize({ width: 1440, height: 900 }); // 데스크톱
    await page.goto("/explore"); // 탐색
    const creators = page.getByRole("region", { name: "주목할 제작자" }); // 제작자 줄
    await expect(creators.getByRole("article")).toHaveCount(15); // 제작자 15명
    await expect(creators.getByRole("heading", { name: "메이트버스 랭킹 연구소" })).toHaveCount(0); // 예전 제작자 없음
    await expect(creators.getByRole("heading", { name: "별무리 공방" })).toBeVisible(); // 나눈 제작자
    await page.goto("/settings/profile"); // 프로필 관리
    await expect(page.getByRole("list", { name: "팔로우한 제작자 목록" }).getByRole("listitem")).toHaveCount(8); // 팔로우도 나눈 제작자로
}); // 테스트 종료

test.describe("영어 화면 문구", () => // 영어 묶음
{ // 묶음 시작
    test.use({ locale: "en-US" }); // 브라우저 언어를 영어로

    test("탭 이름과 수 옆 낱말이 자리에 맞는 영어로 보인다", async ({ page }) => // 자리별 번역 검증
    { // 테스트 시작
        await seed(page); // 준비
        await page.setViewportSize({ width: 1440, height: 900 }); // 데스크톱
        await page.goto("/library"); // 보관함
        await expect(page.getByRole("tab", { name: "Drafts" })).toBeVisible(); // 임시 저장 탭
        await expect(page.getByRole("tab", { name: "Bookmarks" })).toBeVisible(); // 책갈피 탭
        await page.goto("/images"); // 이미지 스튜디오
        await expect(page.getByRole("heading", { level: 1 })).toHaveText("Image Studio"); // 제목
        await page.goto("/settings/tokens"); // 토큰 이용 내역
        await expect(page.getByRole("heading", { name: "Get tokens" })).toBeVisible(); // 토큰 받기 제목
        await expect(page.getByText("In the last 7 days you earned 0 tokens and spent 0 tokens.")).toBeVisible(); // 수와 낱말 사이 띄어쓰기
        await page.goto("/settings/display"); // 화면 레이아웃
        await expect(page.getByRole("heading", { name: "Language · 언어" })).toBeVisible(); // 두 언어로 적은 제목
        await page.goto("/"); // 메인
        await expect(page.getByText(/^[\d,]+ chats$/).first()).toBeVisible(); // 대화 수
    }); // 테스트 종료
}); // 묶음 종료
