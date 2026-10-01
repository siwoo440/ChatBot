import { expect, test, type Page } from "@playwright/test"; // 종단 테스트 도구
import { createInitialState } from "../../src/features/core/initial-state"; // 초기 상태 생성기

async function seedClosedPanels(page: Page): Promise<void> // 양쪽 패널을 닫은 상태 준비
{ // 함수 시작
    const state = createInitialState(); // 초기 상태
    state.settings.leftPanelOpen = false; // 왼쪽 패널 닫기
    state.settings.rightPanelOpen = false; // 오른쪽 패널 닫기
    await page.addInitScript(({ value }) => // 초기 저장 스크립트
    { // 스크립트 시작
        if (window.localStorage.getItem("mateverse:e2e:seeded") !== "true") // 첫 방문 판정
        { // 조건 시작
            window.localStorage.setItem("mateverse:v1:state", value); // 상태 저장
            window.localStorage.setItem("mateverse:e2e:seeded", "true"); // 준비 기록
        } // 조건 종료
    }, { value: JSON.stringify(state) }); // 저장 인자
} // 함수 종료

test("이미지를 만들어 새로고침 뒤에도 갤러리에 남고 캐릭터 대표 이미지로 쓸 수 있다", async ({ page }) => // 이미지 스튜디오 흐름
{ // 테스트 시작
    await seedClosedPanels(page); // 패널 닫은 상태 준비
    await page.goto("/images"); // 스튜디오 이동
    await page.getByLabel("장면 설명").fill("비 그친 밤, 기록관 창가의 사서"); // 설명 입력
    await page.getByText("수채화", { exact: true }).click(); // 그림체 선택
    await page.getByRole("button", { name: "이미지 만들기 · 20 토큰" }).click(); // 생성
    await expect(page.getByRole("status", { name: "생성 상태" })).toHaveText("이미지를 만들어 내 이미지에 저장했어요."); // 안내 확인
    const gallery = page.getByRole("region", { name: "내 이미지" }); // 갤러리
    await expect(gallery.getByRole("article")).toHaveCount(1); // 저장 확인
    await page.reload(); // 새로고침
    await expect(gallery.getByRole("article")).toHaveCount(1); // 유지 확인
    const source = await gallery.getByRole("img", { name: "비 그친 밤, 기록관 창가의 사서" }).getAttribute("src"); // 이미지 주소
    expect(source).toMatch(/^data:image\/svg\+xml/); // Mock 이미지 형식
    await gallery.getByRole("link", { name: "캐릭터 대표 이미지로 쓰기" }).click(); // 캐릭터 만들기로 이동
    await expect(page).toHaveURL(/\/characters\/new\?image=image-/); // 주소 확인
    await expect(page.getByRole("radio", { name: "비 그친 밤, 기록관 창가의 사서" })).toBeChecked(); // 대표 이미지 선택 확인
    await expect(page.getByTestId("character-preview").getByRole("img")).toHaveAttribute("src", source ?? ""); // 미리보기 확인
}); // 테스트 종료
