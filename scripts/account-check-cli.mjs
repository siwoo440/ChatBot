import nextEnv from "@next/env"; // Next 환경 파일 로더
import { checkAccountSetup, formatAccountCheck } from "./account-check.mjs"; // 읽기 전용 점검

try // 설정과 연결 확인
{ // 시도 시작
    let envLoadFailed = false; // 환경 파일 읽기 실패 표시
    const logger = // 민감 값 없는 환경 파일 기록기
    { // 기록기 시작
        info: () => undefined, // 설정 값 기록 생략
        error: () => // 환경 파일 오류 처리
        { // 처리 시작
            envLoadFailed = true; // 읽기 실패만 기록
        }, // 처리 종료
    }; // 기록기 종료
    nextEnv.loadEnvConfig(process.cwd(), true, logger); // 개발 서버 순서의 환경 파일 읽기
    if (envLoadFailed) // 환경 파일 읽기 실패
    { // 조건 시작
        throw new Error("환경 파일 읽기 실패"); // 원시 오류 출력 방지
    } // 조건 종료
    const report = await checkAccountSetup({ service: process.env.NEXT_PUBLIC_ACCOUNT_SERVICE, url: process.env.NEXT_PUBLIC_SUPABASE_URL, anonKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY }); // 공개 연결 설정만 사용
    console.log(formatAccountCheck(report)); // 민감 값 없는 안내 출력
    process.exitCode = report.readyForManualCheck ? 0 : 2; // 준비 상태에 맞는 종료 코드
} // 시도 종료
catch // 예상 밖 오류 처리
{ // 실패 시작
    console.error("계정 점검을 완료하지 못했습니다. 설정 파일과 네트워크 상태를 확인해 주세요. 비밀 값은 출력하지 않았습니다."); // 고정 실패 안내
    process.exitCode = 2; // 미준비 종료 코드
} // 실패 종료
