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

test("스토리 모드에서 스토리를 시작해 상대를 골라 말하고 이야기를 진행하면 새로고침 뒤에도 남는다", async ({ page }) => // 스토리 대화 흐름
{ // 테스트 시작
    await seedClosedPanels(page); // 패널 닫은 상태 준비
    await page.goto("/"); // 메인 이동
    await page.getByRole("navigation", { name: "대화 모드" }).getByRole("link", { name: /스토리 모드/ }).click(); // 스토리 모드 이동
    await expect(page).toHaveURL(/\/stories$/); // 주소 확인
    await page.getByRole("link", { name: /비 그친 밤의 기록관/ }).click(); // 스토리 상세 이동
    await expect(page.getByRole("heading", { level: 1, name: "비 그친 밤의 기록관" })).toBeVisible(); // 상세 확인
    await page.getByRole("button", { name: "스토리 시작" }).click(); // 스토리 시작
    await expect(page).toHaveURL(/\/stories\/story-moonlit-archive\/chat\?conversation=/); // 대화 주소 확인
    await expect(page.locator("[data-narration]").first()).toContainText("펼쳐진 책의 마지막 페이지"); // 시작 내레이션 확인
    await expect(page.locator("[data-speaker='rian']").first()).toContainText("왔구나"); // 첫 대사 확인
    await expect(page.getByRole("region", { name: "등장인물" })).toContainText("세라"); // 등장인물 패널 확인
    await page.getByRole("combobox", { name: "말 걸 상대" }).selectOption("sera"); // 세라 지목
    await page.getByRole("textbox", { name: "메시지", exact: true }).fill("이 페이지, 같이 읽어 줄래?"); // 메시지 입력
    await page.getByRole("button", { name: "전송", exact: true }).click(); // 전송
    await expect(page.getByText("@세라", { exact: true })).toBeVisible(); // 지목 표시 확인
    await expect(page.getByRole("button", { name: "전송", exact: true })).toBeVisible({ timeout: 15_000 }); // 응답 완료 대기
    await expect(page.locator("[data-speaker='sera']")).toHaveCount(2); // 세라 응답 확인
    await page.getByRole("button", { name: "이야기 진행" }).click(); // 이야기 진행
    await expect(page.getByText("다음 장면으로")).toBeVisible(); // 진행 표시 확인
    await expect(page.getByRole("button", { name: "이야기 진행" })).toBeEnabled({ timeout: 15_000 }); // 응답 완료 대기
    await page.reload(); // 새로고침
    await expect(page.getByText("다음 장면으로")).toBeVisible(); // 대화 유지 확인
    await expect(page.locator("[data-speaker='sera']")).not.toHaveCount(0); // 대사 유지 확인
}); // 테스트 종료

test("새 스토리를 만들어 공개 저장하고 상세에서 바로 시작할 수 있다", async ({ page }) => // 스토리 제작 흐름
{ // 테스트 시작
    await seedClosedPanels(page); // 패널 닫은 상태 준비
    await page.goto("/stories/new"); // 제작 화면 이동
    await page.getByLabel("스토리 제목").fill("옥상 위 마지막 공연"); // 제목
    await page.getByLabel("한 줄 소개", { exact: true }).fill("비가 그친 옥상에서 마지막 곡을 맞춘다."); // 소개
    await page.getByRole("button", { name: "다음 단계 ›" }).click(); // 이야기와 등장인물 단계로
    const picker = page.getByRole("group", { name: "등장인물 고르기" }); // 인물 고르기
    await picker.getByText("옥상 밴드의 유나").click(); // 유나 선택
    await picker.getByText("퇴근길 카페의 하린").click(); // 하린 선택
    await expect(picker).toContainText("2/4명"); // 인원 확인
    await page.getByLabel("옥상 밴드의 유나 첫 대사").fill("마지막 곡, 같이 맞춰 볼래?"); // 첫 대사
    await page.getByLabel("시작 장면").fill("젖은 옥상 바닥 위로 앰프 불빛이 번진다."); // 시작 장면
    await page.getByRole("navigation", { name: "편집 단계" }).getByRole("button", { name: /공개 설정/ }).click(); // 공개 설정 단계로
    await page.getByRole("combobox", { name: "공개 범위" }).selectOption("public"); // 전체 공개
    await page.getByRole("button", { name: "공개 저장" }).click(); // 공개 저장
    await expect(page.getByRole("status", { name: "저장 상태" })).toHaveText("공개 저장했습니다."); // 저장 확인
    await page.getByRole("link", { name: "스토리 보기" }).click(); // 상세 이동
    await expect(page.getByRole("heading", { level: 1, name: "옥상 위 마지막 공연" })).toBeVisible(); // 상세 확인
    await page.getByRole("button", { name: "스토리 시작" }).click(); // 시작
    await expect(page.locator("[data-speaker='yuna']").first()).toContainText("마지막 곡"); // 첫 대사 확인
    await page.goto("/stories"); // 스토리 모드 이동
    await expect(page.getByRole("link", { name: /옥상 위 마지막 공연/ }).first()).toBeVisible(); // 목록 노출 확인
}); // 테스트 종료
