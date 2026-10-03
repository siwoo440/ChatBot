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

test("메인 검색창에서 #태그를 여러 개 골라 작품을 좁혀 간다", async ({ page }) => // 태그 검색 흐름 검증
{ // 테스트 시작
    await page.setViewportSize({ width: 1440, height: 900 }); // 데스크톱
    await seed(page); // 준비
    await page.goto("/"); // 메인
    const search = page.getByRole("searchbox", { name: "제목과 작가 검색" }); // 검색창
    const count = page.getByRole("region", { name: "정렬과 필터" }).getByRole("status", { name: "찾은 캐릭터" }); // 찾은 수
    const read = async () => Number(/캐릭터 (\d+)명/.exec(await count.innerText())?.[1]); // 찾은 수 읽기
    const total = await read(); // 전체 수
    await search.fill("#판"); // 태그 입력 시작
    const panel = page.getByRole("region", { name: "태그로 좁히기" }); // 태그 영역
    await expect(panel.getByRole("list", { name: "태그 제안" }).getByRole("button").first()).toHaveAccessibleName(/^#판타지 태그 더하기/); // 첫 제안
    await search.press("Enter"); // 첫 제안 고르기
    await expect(search).toHaveValue(""); // 입력 중이던 토막 지워짐
    await expect(panel.getByRole("button", { name: "#판타지 태그 빼기" })).toBeVisible(); // 칩
    const fantasy = await read(); // 판타지 작품 수
    expect(fantasy).toBeLessThan(total); // 줄어듦
    await panel.getByRole("button", { name: /^#미스터리 태그 더하기/ }).click(); // 미스터리도
    await expect(count).toContainText("조건 2개"); // 조건 수
    const both = await read(); // 둘 다 가진 작품 수
    expect(both).toBeGreaterThan(0); // 결과 있음
    expect(both).toBeLessThan(fantasy); // 더 좁혀짐
    await expect(page.getByRole("region", { name: "캐릭터 탐색 결과" }).getByRole("link", { name: /달빛 기록관의 노아/ })).toBeVisible(); // 둘 다 가진 노아
    await search.fill("#감성 "); // 다 적고 띄어쓰기
    await expect(panel.getByRole("button", { name: "#감성 태그 빼기" })).toBeVisible(); // 정확히 같은 태그라 칩으로
    expect(await read()).toBeLessThanOrEqual(both); // 더 좁혀지거나 그대로
    await panel.getByRole("button", { name: "#판타지 태그 빼기" }).click(); // 판타지 빼기
    await expect(panel.getByRole("button", { name: "#판타지 태그 빼기" })).toHaveCount(0); // 빠짐
    await page.getByRole("button", { name: "조건 지우기" }).click(); // 지우기
    await expect(page.getByRole("region", { name: "태그로 좁히기" })).toHaveCount(0); // 태그 영역 사라짐
    expect(await read()).toBe(total); // 처음으로
    const results = page.getByRole("region", { name: "캐릭터 탐색 결과" }); // 결과
    await search.fill("아카이브 스튜디오"); // #이 없으면 작가 이름으로
    await expect(results.getByRole("link", { name: /새벽 도서관의 리안/ })).toBeVisible(); // 그 작가의 작품
    await search.fill("ㅎㄹ"); // 제목 초성(하린)
    await expect(results.getByRole("link", { name: /퇴근길 카페의 하린/ })).toBeVisible(); // 제목으로 찾음
    await search.fill("판타지"); // 태그 이름을 #없이
    await expect(results.getByRole("link", { name: /새벽 도서관의 리안/ })).toHaveCount(0); // 태그는 #을 붙여야 찾음
    await search.fill("리안 #판"); // 제목과 태그를 함께
    await expect(results.getByRole("link")).toHaveCount(1); // 리안만
    await expect(results.getByRole("link", { name: /새벽 도서관의 리안/ })).toBeVisible(); // 리안
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
        await bar.getByRole("button", { name: "조건 지우기" }).click(); // 조건을 지우고 태그 검색으로
        const search = page.getByRole("searchbox", { name: "제목과 작가 검색" }); // 검색창
        await search.fill("#힐링 "); // 태그 고르기
        await search.fill("#"); // 이어서 좁힐 태그 보기
        await expect(page.getByRole("region", { name: "태그로 좁히기" }).getByRole("list", { name: "태그 제안" })).toBeVisible(); // 제안 목록
        expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0); // 태그 영역 넘침 없음
    }); // 테스트 종료
} // 순회 종료
