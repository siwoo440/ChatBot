import { expect, test, type Page } from "@playwright/test"; // 브라우저 테스트 도구
import { createInitialState } from "../../src/features/core/initial-state"; // 초기 상태 생성기

const stateKey = "mateverse:v1:state"; // 손님 데이터 저장 키
const seedKey = "mateverse:e2e:account-seeded"; // 테스트 준비 키

async function seed(page: Page): Promise<void> // 패널을 닫은 손님 상태 준비
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

test("연습용 계정으로 로그인하면 계정의 데이터가 손님 데이터와 따로 저장되고, 로그아웃하면 손님 데이터로 돌아온다", async ({ page }) => // 계정별 데이터 검증
{ // 테스트 시작
    await seed(page); // 준비
    await page.setViewportSize({ width: 1440, height: 900 }); // 데스크톱
    await page.goto("/characters/harin"); // 하린 상세(손님)
    await page.getByRole("button", { name: "퇴근길 카페의 하린 보관함에 추가" }).click(); // 손님으로 보관
    await expect(page.getByRole("button", { name: "퇴근길 카페의 하린 보관함에서 제거" })).toHaveAttribute("aria-pressed", "true"); // 손님 데이터에 보관됨
    await page.goto("/login"); // 로그인 화면
    await expect(page).toHaveTitle("로그인 | Mate Verse"); // 탭 제목
    await page.getByLabel("계정 이름").fill("소하"); // 계정 이름
    await page.getByRole("button", { name: "로그인" }).click(); // 로그인
    await expect(page).toHaveURL(/\/$/); // 메인으로 새로 엶
    await page.getByRole("button", { name: "사용자 패널 열기와 닫기" }).click(); // 사용자 패널
    await expect(page.getByLabel("로그인 상태")).toContainText("소하"); // 계정 이름
    await expect(page.getByLabel("로그인 상태")).toContainText("연습용 계정"); // 연습용 표시
    await page.getByRole("button", { name: "사용자 패널 열기와 닫기" }).click(); // 사용자 패널 닫기(열린 상태가 저장되지 않게)
    await page.goto("/characters/harin"); // 하린 상세(계정)
    await expect(page.getByRole("button", { name: "퇴근길 카페의 하린 보관함에 추가" })).toHaveAttribute("aria-pressed", "false"); // 계정에는 보관하지 않은 상태
    const keys = await page.evaluate(() => Object.keys(localStorage).filter((key) => key.startsWith("mateverse:v1:u:practice-") && key.endsWith(":state"))); // 계정 칸의 열쇠
    expect(keys).toHaveLength(1); // 계정 데이터가 따로 저장됨
    await page.getByRole("button", { name: "사용자 패널 열기와 닫기" }).click(); // 사용자 패널
    await page.getByRole("button", { name: "로그아웃" }).click(); // 로그아웃
    await expect(page).toHaveURL(/\/$/); // 메인으로 새로 엶
    await page.getByRole("button", { name: "사용자 패널 열기와 닫기" }).click(); // 사용자 패널
    await expect(page.getByRole("link", { name: "로그인", exact: true })).toBeVisible(); // 손님으로 돌아옴
    await page.goto("/characters/harin"); // 하린 상세(손님)
    await expect(page.getByRole("button", { name: "퇴근길 카페의 하린 보관함에서 제거" })).toHaveAttribute("aria-pressed", "true"); // 손님 데이터는 그대로
    await page.goto("/login"); // 로그인 화면
    await expect(page.getByRole("list", { name: "이 브라우저에서 쓴 계정" }).getByRole("button", { name: "소하" })).toBeVisible(); // 쓴 계정이 목록에 남음
}); // 테스트 종료

async function signIn(page: Page, name: string): Promise<void> // 연습용 계정으로 로그인하고 메인이 열릴 때까지 기다리기
{ // 함수 시작
    await page.goto("/login"); // 로그인 화면
    await page.getByLabel("계정 이름").fill(name); // 계정 이름
    await page.getByRole("button", { name: "로그인", exact: true }).click(); // 로그인
    await expect(page).toHaveURL(/\/$/); // 메인으로 새로 엶
    const scrim = page.getByRole("button", { name: "열린 패널 닫기" }); // 넓은 화면의 새 계정은 대화 목록이 열린 채 시작함
    await scrim.waitFor({ state: "visible", timeout: 3000 }).then(() => scrim.click()).catch(() => undefined); // 열려 있으면 닫음(좁은 화면은 닫힌 채 시작)
} // 함수 종료

test("로그인한 계정의 데이터는 서버에 저장되고, 이 기기의 계정 데이터를 지운 뒤 다시 열면 서버에서 받아 온다", async ({ page }) => // 서버 저장 검증
{ // 테스트 시작
    await seed(page); // 준비
    await page.setViewportSize({ width: 1440, height: 900 }); // 데스크톱
    await signIn(page, "소하"); // 로그인
    await page.getByRole("status", { name: "손님 데이터 가져오기" }).getByRole("button", { name: "새로 시작" }).click(); // 새 계정으로 시작
    await page.goto("/characters/harin"); // 하린 상세
    await page.getByRole("button", { name: "퇴근길 카페의 하린 보관함에 추가" }).click(); // 계정에서 보관
    await page.waitForFunction(() => // 서버(연습용)에 올라갈 때까지
    { // 확인 시작
        const key = Object.keys(localStorage).find((item) => item.startsWith("mateverse:v1:practice-server:")); // 연습용 서버의 저장본
        const remote = key === undefined ? null : JSON.parse(localStorage.getItem(key) ?? "null") as { state: string } | null; // 저장본
        return remote !== null && (JSON.parse(remote.state) as { bookmarkedCharacterIds: string[] }).bookmarkedCharacterIds.includes("harin"); // 보관한 캐릭터가 서버에 있음
    }); // 확인 종료
    await page.evaluate(() => Object.keys(localStorage).filter((key) => key.startsWith("mateverse:v1:u:")).forEach((key) => localStorage.removeItem(key))); // 이 기기의 계정 데이터를 모두 지움(다른 기기에서 처음 로그인한 것과 같음)
    await page.goto("/characters/harin"); // 다시 엶
    await expect(page.getByRole("button", { name: "퇴근길 카페의 하린 보관함에서 제거" })).toHaveAttribute("aria-pressed", "true"); // 서버에서 받아 와 그대로 있음
    await page.getByRole("button", { name: "사용자 패널 열기와 닫기" }).click(); // 사용자 패널
    await expect(page.getByLabel("로그인 상태").getByRole("status")).toHaveText("연습용 서버에 저장됨(이 브라우저 안)"); // 저장 상태 표시
}); // 테스트 종료

test("새 계정으로 로그인해 손님 데이터를 가져오면 손님으로 보관한 캐릭터가 계정에도 있다", async ({ page }) => // 손님 데이터 가져오기 검증
{ // 테스트 시작
    await seed(page); // 준비
    await page.setViewportSize({ width: 390, height: 844 }); // 휴대폰
    await page.goto("/characters/harin"); // 하린 상세(손님)
    await page.getByRole("button", { name: "퇴근길 카페의 하린 보관함에 추가" }).click(); // 손님으로 보관
    await signIn(page, "리안"); // 새 계정으로 로그인
    const offer = page.getByRole("status", { name: "손님 데이터 가져오기" }); // 가져오기 물음
    await expect(offer).toBeVisible(); // 물음 표시
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true); // 물음이 떠도 가로로 넘치지 않음
    await offer.getByRole("button", { name: "가져오기" }).click(); // 가져오기
    await expect(page.getByText("이 브라우저에서 쓰던 데이터를 이 계정으로 가져왔어요.")).toBeVisible(); // 결과 안내
    await page.goto("/characters/harin"); // 하린 상세(계정)
    await expect(page.getByRole("button", { name: "퇴근길 카페의 하린 보관함에서 제거" })).toHaveAttribute("aria-pressed", "true"); // 손님 데이터가 계정에 들어옴
    await expect(page.getByRole("status", { name: "손님 데이터 가져오기" })).toHaveCount(0); // 다시 묻지 않음
}); // 테스트 종료

for (const width of [390, 820, 1440]) // 화면 너비 순회
{ // 순회 시작
    test(`${width}px 로그인 화면과 로그인한 사용자 패널은 가로로 넘치지 않는다`, async ({ page }) => // 넘침 검증
    { // 테스트 시작
        await page.setViewportSize({ width, height: 900 }); // 화면 크기
        await seed(page); // 준비
        await page.goto("/login"); // 로그인 화면
        await expect(page.getByRole("heading", { name: "로그인" })).toBeVisible(); // 제목
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true); // 넘침 없음
        await page.getByLabel("계정 이름").fill("이름이조금긴연습용계정스무글자까지"); // 긴 이름
        await page.getByRole("button", { name: "로그인" }).click(); // 로그인
        await expect(page).toHaveURL(/\/$/); // 메인
        await page.getByRole("button", { name: "사용자 패널 열기와 닫기" }).click(); // 사용자 패널
        await expect(page.getByRole("button", { name: "로그아웃" })).toBeVisible(); // 로그아웃 버튼
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true); // 넘침 없음
    }); // 테스트 종료
} // 순회 종료
