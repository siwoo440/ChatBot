import { screen } from "@testing-library/react"; // 화면 도구
import { describe, expect, it } from "vitest"; // 테스트 도구
import TextPlayHomePage from "@/app/text-play/page"; // Text-Play 홈
import TextPlayDownloadPage from "@/app/text-play/download/page"; // 다운로드 화면
import { DownloadAction } from "@/features/text-play/DownloadAction"; // 다운로드 동작
import { textPlayRelease } from "@/features/text-play/release-config"; // 배포 설정
import { renderWithApp } from "@/test/render-with-app"; // 앱 렌더

describe("Text-Play 다운로드 화면", () => // 다운로드 화면 묶음
{ // 묶음 시작
    it("확인되지 않은 배포 정보를 준비 중 상태로 표시한다", () => // 준비 상태 검증
    { // 검증 시작
        renderWithApp(<TextPlayDownloadPage />); // 다운로드 화면 렌더
        expect(screen.getByRole("heading", { name: "MATE Text-Play for Windows" })).toBeInTheDocument(); // 화면 제목 확인
        expect(screen.getByRole("button", { name: "다운로드 준비 중" })).toBeDisabled(); // 비활성 버튼 확인
        expect(screen.getAllByText("확인 필요").length).toBeGreaterThan(2); // 미확정 정보 확인
        expect(screen.getByText("Windows용 프로그램")).toBeInTheDocument(); // 플랫폼 확인
    }); // 검증 종료

    it("Text-Play 홈과 하단 경로를 실제 화면으로 연결한다", () => // 경로 연결 검증
    { // 검증 시작
        renderWithApp(<TextPlayDownloadPage />); // 다운로드 화면 렌더
        expect(screen.getByRole("link", { name: "Text-Play 홈" })).toHaveAttribute("href", "/text-play"); // Text-Play 홈 경로 확인
        expect(screen.getByRole("link", { name: "Character Chat" })).toHaveAttribute("href", "/"); // 챗봇 경로 확인
        expect(screen.getByText("개인정보처리방침 · 준비 중")).toHaveAttribute("aria-disabled", "true"); // 개인정보 준비 상태 확인
        expect(screen.getByText("이용약관 · 준비 중")).toHaveAttribute("aria-disabled", "true"); // 약관 준비 상태 확인
        expect(screen.getByText("고객지원 · 준비 중")).toHaveAttribute("aria-disabled", "true"); // 지원 준비 상태 확인
    }); // 검증 종료

    it("Text-Play 홈에서 다운로드 화면으로 이동한다", () => // 홈 이동 검증
    { // 검증 시작
        renderWithApp(<TextPlayHomePage />); // Text-Play 홈 렌더
        expect(screen.getByRole("link", { name: "Windows 다운로드 확인" })).toHaveAttribute("href", "/text-play/download"); // 다운로드 경로 확인
    }); // 검증 종료

    it("실제 주소가 있으면 다운로드 버튼을 활성화한다", () => // 활성 버튼 검증
    { // 검증 시작
        const release = // 배포 주소 설정
        { // 설정 시작
            ...textPlayRelease, // 기본 배포 정보
            downloadUrl: "/downloads/mate-text-play.exe", // 다운로드 주소
            fileName: "mate-text-play.exe", // 다운로드 파일명
        }; // 설정 종료
        renderWithApp(<DownloadAction release={release} />); // 다운로드 동작 렌더
        expect(screen.getByRole("link", { name: "Windows용 다운로드" })).toHaveAttribute("href", "/downloads/mate-text-play.exe"); // 활성 링크 확인
    }); // 검증 종료

    it("외부 HTTPS 주소를 브라우저 다운로드 링크로 제공한다", () => // 외부 주소 검증
    { // 검증 시작
        const release = // 외부 배포 주소 설정
        { // 설정 시작
            ...textPlayRelease, // 기본 배포 정보
            downloadUrl: "https://downloads.example.com/mate-text-play.exe", // 외부 다운로드 주소
            fileName: "mate-text-play.exe", // 다운로드 파일명
        }; // 설정 종료
        renderWithApp(<DownloadAction release={release} />); // 다운로드 동작 렌더
        expect(screen.getByRole("link", { name: "Windows용 다운로드" })).toHaveAttribute("href", "https://downloads.example.com/mate-text-play.exe"); // 외부 링크 확인
    }); // 검증 종료

    it("활성 다운로드에 실패 대응 안내를 함께 표시한다", () => // 실패 안내 검증
    { // 검증 시작
        const release = // 배포 주소 설정
        { // 설정 시작
            ...textPlayRelease, // 기본 배포 정보
            downloadUrl: "/downloads/mate-text-play.exe", // 다운로드 주소
            fileName: "mate-text-play.exe", // 다운로드 파일명
        }; // 설정 종료
        renderWithApp(<DownloadAction release={release} />); // 다운로드 동작 렌더
        expect(screen.getByText(/다운로드가 시작되지 않으면/)).toBeInTheDocument(); // 실패 대응 안내 확인
    }); // 검증 종료
}); // 묶음 종료
