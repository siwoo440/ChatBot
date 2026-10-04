// 영어 사전: 한국어 화면 글자 → 영어. 화면 묶음별 파일을 하나로 합친다.
import { shell } from "@/lib/i18n/en/shell"; // 공통 메뉴·기본 화면

export const en: Record<string, string> = { ...shell }; // 영어 사전
