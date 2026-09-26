import type { Metadata } from "next"; // 메타데이터 타입
import { TextPlayHomeScreen } from "@/features/text-play/TextPlayHomeScreen"; // Text-Play 홈 화면

export const metadata: Metadata = // 페이지 메타데이터
{ // 메타데이터 시작
    title: "MATE Text-Play | Mate Verse", // 페이지 제목
    description: "Mate Verse의 Windows 텍스트 게임 경험인 MATE Text-Play 소개", // 페이지 설명
}; // 메타데이터 종료

export default function TextPlayPage() // Text-Play 페이지
{ // 함수 시작
    return <TextPlayHomeScreen />; // 홈 화면 반환
} // 함수 종료
