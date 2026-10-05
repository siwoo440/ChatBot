import { expect, test, type Page } from "@playwright/test"; // 브라우저 테스트 도구
import { createInitialState } from "../../src/features/core/initial-state"; // 초기 상태 생성기

const stateKey = "mateverse:v1:state"; // 로컬 저장 키
const seedKey = "mateverse:e2e:polish-seeded"; // 테스트 준비 키

async function seed(page: Page, mature = false): Promise<void> // 패널을 닫은 초기 상태 준비(19+ 보기를 켤 수 있음)
{ // 함수 시작
    const state = createInitialState(); // 초기 상태
    state.settings.leftPanelOpen = false; // 왼쪽 패널 닫기
    state.settings.rightPanelOpen = false; // 오른쪽 패널 닫기
    state.settings.matureContentEnabled = mature; // 19+ 보기
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

test("탭 제목은 페이지마다 다르고 작품 화면에서는 작품 이름이 들어간다", async ({ page }) => // 탭 제목 검증
{ // 테스트 시작
    await seed(page); // 준비
    await page.setViewportSize({ width: 1440, height: 900 }); // 데스크톱
    await page.goto("/"); // 메인
    await expect(page).toHaveTitle("Mate Verse"); // 기본 제목
    await page.goto("/library"); // 보관함
    await expect(page).toHaveTitle("보관함 | Mate Verse"); // 보관함 제목
    await page.goto("/characters/harin"); // 캐릭터 상세
    await expect(page).toHaveTitle("퇴근길 카페의 하린 | Mate Verse"); // 작품 이름
    await page.getByRole("navigation", { name: "주요 메뉴" }).getByRole("link", { name: "탐색" }).click(); // 메뉴로 이동
    await expect(page).toHaveTitle("탐색 | Mate Verse"); // 옮긴 화면 제목
    await page.goto("/chat/rian?conversation=conversation-rian&version=conversation-rian-version-1"); // 리안 대화
    await expect(page).toHaveTitle("새벽 도서관의 리안 | Mate Verse"); // 대화 상대 이름
    await page.goto("/characters/new"); // 캐릭터 만들기
    await expect(page).toHaveTitle("새 캐릭터 만들기 | Mate Verse"); // 만들기 제목
}); // 테스트 종료

test("사용자 패널에서 19+ 보기를 끄면 안내가 보이고 대화는 그대로 남으며, 로그아웃 버튼은 없다", async ({ page }) => // 19+ 보기 끄기 검증
{ // 테스트 시작
    await seed(page, true); // 19+ 보기를 켠 채 준비
    await page.setViewportSize({ width: 1440, height: 900 }); // 데스크톱
    await page.goto("/library"); // 보관함
    await page.getByRole("button", { name: "사용자 패널 열기와 닫기" }).click(); // 사용자 패널
    page.once("dialog", (dialog) => void dialog.accept()); // 확인 창 수락
    await expect(page.getByRole("button", { name: "로그아웃" })).toHaveCount(0); // 로그인이 없으니 로그아웃도 없음
    await page.getByRole("button", { name: "19+ 보기 끄기" }).click(); // 끄기
    await expect(page.getByText("19+ 보기를 껐습니다. 캐릭터와 대화는 이 브라우저에 그대로 남아 있어요.")).toBeVisible(); // 안내
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem("mateverse:v1:state") ?? "{}").settings.matureContentEnabled)).toBe(false); // 19+ 보기 꺼짐
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem("mateverse:v1:state") ?? "{}").conversations.length)).toBeGreaterThan(0); // 대화 그대로
}); // 테스트 종료

test("고객 지원에서 업데이트 소식을 보고 문의 글을 미리 써서 복사한다", async ({ page, context }) => // 고객 지원 검증
{ // 테스트 시작
    await seed(page); // 준비
    await context.grantPermissions(["clipboard-read", "clipboard-write"]); // 클립보드 허용
    await page.setViewportSize({ width: 1440, height: 900 }); // 데스크톱
    await page.goto("/support"); // 고객 지원
    const news = page.getByRole("list", { name: "업데이트 소식 목록" }); // 소식 목록
    await expect(news.getByRole("heading", { level: 3 })).toHaveCount(2); // 최근 두 묶음
    await page.getByRole("button", { name: /지난 소식 더 보기/ }).click(); // 더 보기
    await expect(news.getByRole("heading", { level: 3 })).toHaveCount(4); // 모두 표시
    await page.getByRole("button", { name: "문의 글 복사" }).click(); // 빈 채로 복사
    await expect(page.getByText("제목을 적어 주세요.")).toBeVisible(); // 빈 칸 안내
    await page.getByRole("combobox", { name: "문의 종류" }).selectOption("idea"); // 기능 제안
    await page.getByRole("textbox", { name: "제목" }).fill("보관함 검색"); // 제목
    await page.getByRole("textbox", { name: "내용" }).fill("보관함에서도 찾고 싶어요."); // 내용
    await page.getByRole("button", { name: "문의 글 복사" }).click(); // 복사
    await expect(page.getByRole("status", { name: "문의 안내" })).toContainText("문의 글을 복사했습니다."); // 성공 안내
    const copied = await page.evaluate(() => navigator.clipboard.readText()); // 복사된 글
    expect(copied).toContain("[문의 종류] 기능 제안"); // 종류
    expect(copied).toContain("[제목] 보관함 검색"); // 제목
    expect(copied).toContain("[진단 정보]"); // 진단 정보
}); // 테스트 종료

test("토큰 이용 기록을 기간으로 좁히고 멤버십 비교표를 본다", async ({ page }) => // 기간·비교표 검증
{ // 테스트 시작
    await seed(page); // 준비
    await page.setViewportSize({ width: 1440, height: 900 }); // 데스크톱
    await page.goto("/rewards"); // 출석과 미션
    await page.getByRole("button", { name: "출석하기 · +5토큰" }).click(); // 출석(오늘 기록 1건)
    await page.goto("/settings/tokens"); // 토큰 이용 내역
    const filter = page.getByRole("group", { name: "기록 종류" }); // 종류 필터
    await expect(filter.getByRole("button", { name: "전체 1" })).toBeVisible(); // 오늘 기록
    await page.getByRole("combobox", { name: "기간" }).selectOption("today"); // 오늘
    await expect(page.getByRole("status", { name: "기간 합계" })).toHaveText("이 기간에 받음 +5 · 사용 −0 · 기록 1건"); // 합계
    await page.getByRole("combobox", { name: "기간" }).selectOption("custom"); // 직접 고르기
    await page.getByLabel("끝 날짜").fill("2026-01-01"); // 지난 날짜까지
    await expect(filter.getByRole("button", { name: "전체 0" })).toBeVisible(); // 기록 없음
    await expect(page.getByText("이 기간에는 기록이 없어요. 기간을 넓히거나 종류를 바꿔 보세요.")).toBeVisible(); // 빈 안내
    await page.goto("/settings/profile"); // 프로필 관리
    const table = page.getByRole("table", { name: "멤버십 비교" }); // 비교표
    await expect(table.getByRole("columnheader", { name: /FREE/ })).toContainText("이용 중"); // 지금 멤버십
    await expect(table.getByRole("row", { name: /가격/ })).toContainText("정해지지 않음"); // 가격은 정해지지 않음
}); // 테스트 종료

for (const width of [390, 820, 1440]) // 화면 너비 순회
{ // 순회 시작
    test(`${width}px 고객 지원·프로필 관리·토큰 이용 내역은 가로로 넘치지 않는다`, async ({ page }) => // 넘침 검증
    { // 테스트 시작
    await seed(page); // 준비
        await page.setViewportSize({ width, height: 900 }); // 화면 크기
        for (const target of ["/support", "/settings/profile", "/settings/tokens"]) // 화면 순회
        { // 순회 시작
            await page.goto(target); // 화면 열기
            await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible(); // 제목 표시
            if (target === "/settings/tokens") // 토큰 화면
            { // 조건 시작
                await page.getByRole("combobox", { name: "기간" }).selectOption("custom"); // 날짜 입력까지 펼침
            } // 조건 종료
            expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth), target).toBeLessThanOrEqual(0); // 넘침 없음
        } // 순회 종료
    }); // 테스트 종료
} // 순회 종료
