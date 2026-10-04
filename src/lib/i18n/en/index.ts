// 영어 사전: 한국어 화면 글자 → 영어. 화면 묶음별 파일을 하나로 합친다.
import { character } from "@/lib/i18n/en/character"; // 캐릭터 상세·편집기
import { chat } from "@/lib/i18n/en/chat"; // 채팅 화면
import { discovery } from "@/lib/i18n/en/discovery"; // 메인·탐색·성인 인증·대화 목록
import { shell } from "@/lib/i18n/en/shell"; // 공통 메뉴·기본 화면

export const en: Record<string, string> = { ...shell, ...discovery, ...character, ...chat }; // 영어 사전
