import type { Metadata } from "next"; // 메타데이터 타입
import { TextPlayDownloadScreen } from "@/features/text-play/TextPlayDownloadScreen"; // 다운로드 화면

export const metadata: Metadata = // 페이지 메타데이터
{ // 메타데이터 시작
    title: "Text-Play Windows 다운로드 | Mate Verse", // 페이지 제목
    description: "MATE Text-Play Windows 프로그램의 배포 상태와 안전 정보를 확인하는 다운로드 페이지", // 페이지 설명
}; // 메타데이터 종료

export default function TextPlayDownloadPage() // 다운로드 페이지
{ // 함수 시작
    return <TextPlayDownloadScreen />; // 다운로드 화면 반환
} // 함수 종료
