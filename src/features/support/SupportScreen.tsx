"use client"; // 클라이언트 컴포넌트

import { useState } from "react"; // 리액트 상태
import { useAppStore } from "@/features/core/AppProvider"; // 앱 상태
import { buildDiagnostics } from "@/features/settings/settings-insights"; // 진단 정보
import { SettingsPageHeader } from "@/features/settings/SettingsShell"; // 페이지 머리말
import { faqTopics, filterFaqs, type FaqTopic } from "@/features/support/faq"; // 자주 묻는 질문
import styles from "@/features/settings/SettingsScreen.module.css"; // 설정 스타일

const appVersion = "1.0.0"; // 앱 버전

function measureStorage(): number | null // 이 서비스가 브라우저에 저장한 용량(알 수 없으면 없음)
{ // 함수 시작
    try // 읽기 시도
    { // 시도 시작
        let bytes = 0; // 합계
        for (let index = 0; index < window.localStorage.length; index += 1) // 저장 항목 순회
        { // 순회 시작
            const key = window.localStorage.key(index); // 항목 이름
            if (key !== null && key.startsWith("mateverse:")) // 이 서비스 항목
            { // 조건 시작
                bytes += new Blob([key, window.localStorage.getItem(key) ?? ""]).size; // 이름과 값 크기
            } // 조건 종료
        } // 순회 종료
        return bytes; // 합계 반환
    } // 시도 종료
    catch // 읽기 실패
    { // 실패 시작
        return null; // 알 수 없음
    } // 실패 종료
} // 함수 종료

export function SupportScreen() // 고객 지원 화면
{ // 함수 시작
    const { state } = useAppStore(); // 앱 상태 조회
    const [query, setQuery] = useState(""); // 검색어
    const [topic, setTopic] = useState<FaqTopic | "all">("all"); // 고른 주제
    const [copyStatus, setCopyStatus] = useState(""); // 복사 안내
    const results = filterFaqs(query, topic); // 조건에 맞는 질문
    const diagnostics = buildDiagnostics({ appVersion, state, storageBytes: typeof window === "undefined" ? null : measureStorage(), viewport: typeof window === "undefined" ? null : { width: window.innerWidth, height: window.innerHeight }, userAgent: typeof navigator === "undefined" ? null : navigator.userAgent }); // 진단 정보
    const copyDiagnostics = async () => // 진단 정보 복사
    { // 함수 시작
        try // 복사 시도
        { // 시도 시작
            if (navigator.clipboard?.writeText === undefined) // 클립보드 부재 확인
            { // 조건 시작
                throw new Error("clipboard-unavailable"); // 복사 불가
            } // 조건 종료
            await navigator.clipboard.writeText(diagnostics); // 클립보드 쓰기
            setCopyStatus("진단 정보를 복사했습니다."); // 성공 안내
        } // 시도 종료
        catch // 복사 실패
        { // 실패 시작
            setCopyStatus("복사하지 못했습니다. 아래 글을 직접 선택해 복사해 주세요."); // 실패 안내
        } // 실패 종료
    }; // 함수 종료
    return ( // 화면 반환
        <> {/* 고객 지원 화면 */}
            <SettingsPageHeader kicker="SUPPORT · HELP" title="고객 지원" description="자주 묻는 질문을 찾아보고, 문의할 때 필요한 앱 정보를 복사할 수 있습니다." /> {/* 페이지 머리말 */}
            <section className={styles.card} aria-labelledby="support-faq-title"> {/* 질문 영역 */}
                <h2 id="support-faq-title">자주 묻는 질문</h2> {/* 질문 제목 */}
                <label className={styles.field}>질문 검색<input type="search" value={query} placeholder="예: 토큰, 저장, ㅌㅋ" onChange={(event) => setQuery(event.target.value)} /></label> {/* 검색 */}
                <div className={styles.filterRow} role="group" aria-label="질문 주제"> {/* 주제 */}
                    <button type="button" aria-pressed={topic === "all"} onClick={() => setTopic("all")}>전체</button> {/* 전체 */}
                    {faqTopics.map((item) => <button key={item.id} type="button" aria-pressed={topic === item.id} onClick={() => setTopic(item.id)}>{item.label}</button>)} {/* 주제 순회 */}
                </div> {/* 주제 종료 */}
                <p className={styles.resultCount} role="status" aria-label="찾은 질문">질문 {results.length}개</p> {/* 결과 수 */}
                {results.length === 0 ? <p className={styles.note}>찾는 질문이 없어요. 다른 낱말로 찾아보거나 주제를 전체로 바꿔 보세요.</p> : <div className={styles.faqList}>{results.map((faq) => <details key={faq.question}><summary>{faq.question}</summary><p>{faq.answer}</p></details>)}</div>} {/* 질문 목록 */}
            </section> {/* 질문 영역 종료 */}
            <section className={styles.card} aria-labelledby="support-contact-title"> {/* 문의 영역 */}
                <h2 id="support-contact-title">문의하기</h2> {/* 문의 제목 */}
                <p className={styles.note}>문의 접수 창구는 서비스 운영 정책이 확정된 뒤 열립니다. 그동안 아래 진단 정보를 함께 적어 두면 문제를 확인하는 데 도움이 됩니다.</p> {/* 준비 안내 */}
                <dl className={styles.infoGrid}> {/* 앱 정보 */}
                    <div><dt>앱 버전</dt><dd>{appVersion}</dd></div> {/* 앱 버전 */}
                    <div><dt>데이터 버전</dt><dd>{state.schemaVersion}</dd></div> {/* 데이터 버전 */}
                    <div><dt>응답 방식</dt><dd>{state.providerMode === "mock" ? "로컬 Mock(외부 API 없음)" : state.providerMode}</dd></div> {/* 공급자 모드 */}
                </dl> {/* 앱 정보 종료 */}
                <label className={styles.field}>진단 정보<textarea className={styles.diagnostics} readOnly rows={9} value={diagnostics} /></label> {/* 진단 정보 */}
                <p>이름이나 대화 내용 같은 개인 정보는 들어 있지 않아요.</p> {/* 개인 정보 안내 */}
                <button type="button" className={styles.secondary} onClick={() => void copyDiagnostics()}>진단 정보 복사</button> {/* 복사 */}
                {copyStatus.length === 0 ? null : <p className={styles.status} role="status" aria-label="복사 안내">{copyStatus}</p>} {/* 복사 안내 */}
            </section> {/* 문의 영역 종료 */}
        </> // 고객 지원 화면 종료
    ); // 반환 종료
} // 함수 종료
