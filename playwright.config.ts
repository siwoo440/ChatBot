import { defineConfig, devices } from "@playwright/test"; // 종단 설정 도구

const serverPort = process.env.PLAYWRIGHT_PORT ?? "3000"; // 테스트 서버 포트
const baseURL = `http://127.0.0.1:${serverPort}`; // 테스트 기본 주소

export default defineConfig( // 설정 내보내기
{ // 설정 시작
    testDir: "./tests/e2e", // 종단 테스트 경로
    fullyParallel: false, // 순차 실행
    use: // 공통 사용 설정
    { // 공통 설정 시작
        baseURL, // 기본 주소
        locale: "ko-KR", // 화면 언어를 한국어로 고정(자동 언어는 브라우저 언어를 따름)
        trace: "on-first-retry", // 재시도 추적
    }, // 공통 설정 종료
    projects: // 브라우저 목록
    [ // 목록 시작
        { // 브라우저 시작
            name: "chromium", // 브라우저 이름
            use: { ...devices["Desktop Chrome"] }, // 데스크톱 환경
        }, // 브라우저 종료
    ], // 목록 종료
    webServer: // 개발 서버 설정
    { // 서버 설정 시작
        command: `node node_modules/next/dist/bin/next dev --webpack --hostname 127.0.0.1 --port ${serverPort}`, // 서버 실행 명령
        url: baseURL, // 서버 확인 주소
        reuseExistingServer: true, // 기존 서버 재사용
        env: { ENABLE_REAL_PROVIDERS: "false" }, // 테스트 서버는 실제 AI를 끔(.env.local에 열쇠가 있어도 요금이 나가지 않게)
        timeout: 120_000, // 서버 준비 제한
    }, // 서버 설정 종료
}); // 설정 종료
