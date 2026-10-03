import { expect, test, type Page } from "@playwright/test"; // 브라우저 테스트 도구
import { createInitialState } from "../../src/features/core/initial-state"; // 초기 상태 생성기

const stateKey = "mateverse:v1:state"; // 로컬 저장 키
const seedKey = "mateverse:e2e:discovery-seeded"; // 테스트 준비 키

async function seed(page: Page): Promise<void> // 패널을 닫고 하린을 좋아요한 초기 상태 준비
{ // 함수 시작
    const state = createInitialState(); // 초기 상태
    state.settings.leftPanelOpen = false; // 왼쪽 패널 닫기
    state.settings.rightPanelOpen = false; // 오른쪽 패널 닫기
    state.likedCharacterIds = ["harin", "rian"]; // 하린·리안 좋아요(리안은 대화 중)
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

test("메인에서 장르 여러 개와 조건을 함께 걸고 정렬을 바꾼 뒤 한 번에 지운다", async ({ page }) => // 정렬·필터 흐름 검증
{ // 테스트 시작
    await page.setViewportSize({ width: 1440, height: 900 }); // 데스크톱
    await seed(page); // 준비
    await page.goto("/"); // 메인
    const bar = page.getByRole("region", { name: "정렬과 필터" }); // 정렬과 필터
    const count = bar.getByRole("status", { name: "찾은 캐릭터" }); // 찾은 수
    const genres = page.getByRole("group", { name: "캐릭터 카테고리" }); // 장르
    const results = page.getByRole("region", { name: "캐릭터 탐색 결과" }); // 결과
    await expect(page.getByRole("region", { name: "실시간 랭킹" })).toBeVisible(); // 기본 화면
    await genres.getByRole("button", { name: "힐링" }).click(); // 힐링
    await genres.getByRole("button", { name: "SF" }).click(); // SF도
    await expect(genres.getByRole("button", { name: "힐링" })).toHaveAttribute("aria-pressed", "true"); // 둘 다 고름
    await expect(genres.getByRole("button", { name: "SF" })).toHaveAttribute("aria-pressed", "true"); // 둘 다 고름
    await expect(count).toContainText("조건 2개"); // 조건 수
    await expect(page.getByRole("region", { name: "실시간 랭킹" })).toHaveCount(0); // 기본 영역 숨김
    await bar.getByRole("combobox", { name: "정렬" }).selectOption("name"); // 이름순
    const names = await results.getByRole("heading", { level: 3 }).allTextContents(); // 카드 이름
    expect(names).toEqual([...names].sort((left, right) => left.localeCompare(right, "ko"))); // 가나다순
    await genres.getByRole("button", { name: "전체" }).click(); // 장르 풀기
    await bar.getByRole("checkbox", { name: "관심 목록만" }).check(); // 관심 목록만
    await bar.getByRole("checkbox", { name: "처음 만나는 캐릭터만" }).check(); // 대화해 보지 않은 캐릭터만
    await expect(count).toHaveText("캐릭터 1명 · 조건 2개"); // 하린만 남음
    await expect(results.getByRole("link")).toHaveCount(1); // 한 명
    await expect(results.getByRole("link", { name: /퇴근길 카페의 하린/ })).toBeVisible(); // 하린
    await bar.getByRole("button", { name: "조건 지우기" }).click(); // 지우기
    await expect(bar.getByRole("combobox", { name: "정렬" })).toHaveValue("recommended"); // 추천순
    await expect(page.getByRole("region", { name: "실시간 랭킹" })).toBeVisible(); // 기본 화면 복귀
    await expect(bar.getByRole("button", { name: "조건 지우기" })).toHaveCount(0); // 지우기 버튼 사라짐
}); // 테스트 종료

for (const width of [390, 820, 1440]) // 화면 너비 순회
{ // 순회 시작
    test(`${width}px 메인의 정렬과 필터는 조건을 걸어도 가로로 넘치지 않는다`, async ({ page }) => // 넘침 검증
    { // 테스트 시작
        await page.setViewportSize({ width, height: 900 }); // 화면 크기
        await seed(page); // 준비
        await page.goto("/"); // 메인
        const bar = page.getByRole("region", { name: "정렬과 필터" }); // 정렬과 필터
        await expect(bar).toBeVisible(); // 보임
        expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0); // 기본 화면 넘침 없음
        await bar.getByRole("combobox", { name: "정렬" }).selectOption("popular"); // 인기순
        await bar.getByRole("combobox", { name: "이용 등급" }).selectOption("teen"); // 15세
        await bar.getByRole("checkbox", { name: "처음 만나는 캐릭터만" }).check(); // 조건
        await expect(bar.getByRole("button", { name: "조건 지우기" })).toBeVisible(); // 지우기 버튼
        expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0); // 조건을 건 화면 넘침 없음
    }); // 테스트 종료
} // 순회 종료
