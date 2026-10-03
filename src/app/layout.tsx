import type { ReactNode } from "react"; // 자식 요소 타입
import { AppShell } from "@/components/app-shell/AppShell"; // 공통 앱 셸
import { AppProvider } from "@/features/core/AppProvider"; // 앱 상태 공급자
import { THEME_STORAGE_KEY } from "@/lib/theme/stored-theme"; // 테마 저장 키
import "./globals.css"; // 전역 스타일

const themeScript = `try{if(localStorage.getItem('${THEME_STORAGE_KEY}')==='dark'){document.documentElement.dataset.theme='dark'}}catch(e){}`; // 첫 화면 깜빡임 방지(저장된 다크 모드를 그리기 전에 적용)

export interface RootLayoutProps // 레이아웃 속성
{ // 속성 시작
    children: ReactNode; // 화면 내용
} // 속성 종료

export default function RootLayout( // 루트 레이아웃 함수
{ children }: RootLayoutProps) // 레이아웃 속성
{ // 함수 시작
    return <html lang="ko" suppressHydrationWarning><head><script dangerouslySetInnerHTML={{ __html: themeScript }} /></head><body><AppProvider><AppShell>{children}</AppShell></AppProvider></body></html>; // 공통 셸 문서 반환(테마는 그리기 전에 적용)
} // 함수 종료
