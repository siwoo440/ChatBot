import type { NextConfig } from "next"; // 설정 타입

const nextConfig: NextConfig = // 설정 객체
{ // 객체 시작
    typedRoutes: true, // 타입 경로 활성화
    agentRules: false, // 에이전트 규칙 자동 생성 차단
    async redirects() // 경로 이동 규칙
    { // 함수 시작
        return [ // 규칙 목록
            { source: "/text-play/download", destination: "/text-play", permanent: true }, // 통합 전 다운로드 주소 이동
            { source: "/settings", destination: "/settings/profile", permanent: false }, // 설정 첫 화면 이동
        ]; // 목록 종료
    }, // 함수 종료
}; // 객체 종료

export default nextConfig; // 설정 내보내기
