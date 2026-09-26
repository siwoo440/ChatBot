import Link from "next/link"; // 내부 경로 링크
import { DownloadAction } from "@/features/text-play/DownloadAction"; // 다운로드 동작
import { displayReleaseValue, getDistributionLabel, textPlayRelease } from "@/features/text-play/release-config"; // 배포 정보 도구
import styles from "@/features/text-play/TextPlayScreen.module.css"; // 화면 스타일

const installationSteps = [ // 설치 단계 목록
    "설치 파일 다운로드", // 다운로드 단계
    "설치 프로그램 실행", // 실행 단계
    "Windows 보안 안내 확인", // 보안 단계
    "Mate Verse 계정 로그인", // 로그인 단계
    "Text-Play 작품 다운로드 및 실행", // 작품 실행 단계
] as const; // 읽기 전용 목록

const features = [ // 주요 기능 목록
    { // 게임 실행 기능 시작
        title: "텍스트 게임 실행", // 기능 제목
        description: "다운로드한 작품을 Windows 환경에서 실행하는 런처 흐름", // 기능 설명
    }, // 게임 실행 기능 종료
    { // 입력 기능 시작
        title: "선택지와 자유 입력", // 기능 제목
        description: "선택형 진행과 직접 입력을 함께 사용하는 상호작용", // 기능 설명
    }, // 입력 기능 종료
    { // 저장 기능 시작
        title: "로컬 세이브", // 기능 제목
        description: "진행 상황을 기기에 저장하고 이어서 플레이하는 구조", // 기능 설명
    }, // 저장 기능 종료
    { // 기억 기능 시작
        title: "상태와 장기 기억", // 기능 제목
        description: "작품의 게임 상태와 장기 기억을 구분해 관리", // 기능 설명
    }, // 기억 기능 종료
    { // 모델 기능 시작
        title: "동일 LLM 모델 연동", // 기능 제목
        description: "기존 Character Chat과 같은 LLM 모델 연결 기준", // 기능 설명
    }, // 모델 기능 종료
    { // 업데이트 기능 시작
        title: "작품 다운로드와 업데이트", // 기능 제목
        description: "작품 패키지 내려받기와 업데이트 상태 확인", // 기능 설명
    }, // 업데이트 기능 종료
] as const; // 읽기 전용 목록

const faqs = [ // 질문 목록
    { // 버전 차이 시작
        question: "웹 버전과 Windows 버전은 무엇이 다른가요?", // 질문 문구
        answer: "웹의 Character Chat은 브라우저 대화 경험이며, Windows용 Text-Play는 다운로드한 텍스트 게임 작품의 실행과 로컬 상태 관리를 중심으로 설계됩니다.", // 답변 문구
    }, // 버전 차이 종료
    { // 체험 안내 시작
        question: "설치 없이 체험할 수 있나요?", // 질문 문구
        answer: "현재 웹에서는 Character Chat을 이용할 수 있습니다. Windows Text-Play의 별도 웹 체험판 제공 여부는 확인 필요입니다.", // 답변 문구
    }, // 체험 안내 종료
    { // 저장 위치 시작
        question: "저장 데이터는 어디에 보관되나요?", // 질문 문구
        answer: "Windows 프로그램의 실제 저장 경로는 실행 프로그램 설계 후 확정해야 하므로 현재는 확인 필요입니다.", // 답변 문구
    }, // 저장 위치 종료
    { // 연결 안내 시작
        question: "인터넷 연결이 필요한 기능은 무엇인가요?", // 질문 문구
        answer: "계정 로그인, LLM 연동, 작품 다운로드와 업데이트에는 인터넷 연결이 필요할 예정입니다. 오프라인 지원 범위는 확인 필요입니다.", // 답변 문구
    }, // 연결 안내 종료
    { // 업데이트 안내 시작
        question: "프로그램은 어떻게 업데이트되나요?", // 질문 문구
        answer: "자동 업데이트 서버는 이번 범위에 포함되지 않습니다. 실제 업데이트 방식과 배포 채널은 확인 필요입니다.", // 답변 문구
    }, // 업데이트 안내 종료
] as const; // 읽기 전용 목록

export function TextPlayDownloadScreen() // 다운로드 화면
{ // 함수 시작
    const statusLabel = getDistributionLabel(textPlayRelease.status); // 상태 문구 조회
    return ( // 화면 반환
        <main className={styles.page}> {/* 다운로드 화면 */}
            <section className={styles.hero} aria-labelledby="text-play-download-title"> {/* 상단 소개 */}
                <div className={styles.heroCopy}> {/* 소개 문구 */}
                    <p className={styles.eyebrow}>MATE VERSE · TEXT-PLAY LAUNCHER</p> {/* 상단 표제 */}
                    <h1 id="text-play-download-title">MATE Text-Play for Windows</h1> {/* 화면 제목 */}
                    <p className={styles.lead}>선택지와 자유 입력으로 텍스트 게임을 플레이하고, 작품·세이브·장기 기억을 한곳에서 관리하는 Windows 프로그램입니다.</p> {/* 화면 설명 */}
                    <div className={styles.badges}> {/* 상태 배지 */}
                        <span className={styles.platformBadge}>Windows용 프로그램</span> {/* 플랫폼 배지 */}
                        <span className={styles.statusBadge} data-status={textPlayRelease.status}>{statusLabel}</span> {/* 배포 상태 */}
                    </div> {/* 상태 배지 종료 */}
                </div> {/* 소개 문구 종료 */}
                <div className={styles.launcherPreview} aria-label="Text-Play 배포 준비 단계"> {/* 런처 미리보기 */}
                    <span className={styles.previewLabel}>RELEASE CHECK</span> {/* 미리보기 표제 */}
                    <ol> {/* 준비 단계 */}
                        <li data-complete="true"><span>페이지 구성</span><strong>완료</strong></li> {/* 페이지 상태 */}
                        <li data-complete="true"><span>다운로드 안전 처리</span><strong>완료</strong></li> {/* 안전 처리 상태 */}
                        <li data-current="true"><span>설치 파일 등록</span><strong>대기</strong></li> {/* 파일 상태 */}
                        <li><span>코드 서명 확인</span><strong>대기</strong></li> {/* 서명 상태 */}
                    </ol> {/* 준비 단계 종료 */}
                </div> {/* 런처 미리보기 종료 */}
            </section> {/* 상단 소개 종료 */}

            <section className={styles.downloadCard} aria-labelledby="download-card-title"> {/* 다운로드 카드 */}
                <div className={styles.sectionHeading}> {/* 카드 제목 영역 */}
                    <div> {/* 제목 문구 */}
                        <p className={styles.sectionKicker}>WINDOWS RELEASE</p> {/* 카드 표제 */}
                        <h2 id="download-card-title">다운로드 정보</h2> {/* 카드 제목 */}
                    </div> {/* 제목 문구 종료 */}
                    <span className={styles.releaseState}>{statusLabel}</span> {/* 현재 상태 */}
                </div> {/* 카드 제목 영역 종료 */}
                <dl className={styles.metadataGrid}> {/* 배포 정보 목록 */}
                    <div><dt>버전</dt><dd>{displayReleaseValue(textPlayRelease.version)}</dd></div> {/* 버전 정보 */}
                    <div><dt>배포 채널</dt><dd>{displayReleaseValue(textPlayRelease.channel)}</dd></div> {/* 채널 정보 */}
                    <div><dt>파일 형식</dt><dd>{displayReleaseValue(textPlayRelease.fileType)}</dd></div> {/* 형식 정보 */}
                    <div><dt>파일 크기</dt><dd>{displayReleaseValue(textPlayRelease.fileSize)}</dd></div> {/* 크기 정보 */}
                    <div><dt>게시일</dt><dd>{displayReleaseValue(textPlayRelease.publishedAt)}</dd></div> {/* 게시일 정보 */}
                    <div><dt>파일명</dt><dd>{displayReleaseValue(textPlayRelease.fileName)}</dd></div> {/* 파일명 정보 */}
                </dl> {/* 배포 정보 종료 */}
                <div className={styles.requirements}> {/* 요구사항 영역 */}
                    <div> {/* 윈도우 영역 */}
                        <h3>지원 Windows</h3> {/* 윈도우 제목 */}
                        <ul>{textPlayRelease.supportedWindows.map((item) => <li key={item}>{item}</li>)}</ul> {/* 윈도우 목록 */}
                    </div> {/* 윈도우 영역 종료 */}
                    <div> {/* 최소 사양 영역 */}
                        <h3>최소 시스템 요구사항</h3> {/* 요구사항 제목 */}
                        <ul>{textPlayRelease.minimumRequirements.map((item) => <li key={item}>{item}</li>)}</ul> {/* 요구사항 목록 */}
                    </div> {/* 최소 사양 영역 종료 */}
                </div> {/* 요구사항 영역 종료 */}
                <DownloadAction release={textPlayRelease} /> {/* 다운로드 동작 */}
            </section> {/* 다운로드 카드 종료 */}

            <section className={styles.safetySection} aria-labelledby="safety-title"> {/* 안전 정보 */}
                <div className={styles.sectionHeading}> {/* 안전 제목 영역 */}
                    <div> {/* 제목 문구 */}
                        <p className={styles.sectionKicker}>SECURITY</p> {/* 안전 표제 */}
                        <h2 id="safety-title">파일 안전 정보</h2> {/* 안전 제목 */}
                    </div> {/* 제목 문구 종료 */}
                </div> {/* 안전 제목 영역 종료 */}
                <div className={styles.safetyGrid}> {/* 안전 정보 그리드 */}
                    <article> {/* 해시 정보 */}
                        <span>SHA-256</span> {/* 해시 표제 */}
                        <strong>{displayReleaseValue(textPlayRelease.sha256)}</strong> {/* 해시 값 */}
                    </article> {/* 해시 정보 종료 */}
                    <article> {/* 서명 정보 */}
                        <span>코드 서명</span> {/* 서명 표제 */}
                        <strong>{displayReleaseValue(textPlayRelease.signatureStatus)}</strong> {/* 서명 값 */}
                    </article> {/* 서명 정보 종료 */}
                </div> {/* 안전 정보 그리드 종료 */}
                {textPlayRelease.status === "beta" ? <p className={styles.betaWarning} role="note">베타 버전은 예기치 않은 오류와 데이터 형식 변경이 발생할 수 있습니다.</p> : null} {/* 베타 경고 */}
            </section> {/* 안전 정보 종료 */}

            <section className={styles.contentSection} aria-labelledby="install-title"> {/* 설치 안내 */}
                <div className={styles.sectionHeading}> {/* 설치 제목 영역 */}
                    <div> {/* 제목 문구 */}
                        <p className={styles.sectionKicker}>GET STARTED</p> {/* 설치 표제 */}
                        <h2 id="install-title">설치 순서</h2> {/* 설치 제목 */}
                    </div> {/* 제목 문구 종료 */}
                </div> {/* 설치 제목 영역 종료 */}
                <ol className={styles.stepList}>{installationSteps.map((step, index) => <li key={step}><span>{String(index + 1).padStart(2, "0")}</span><strong>{step}</strong></li>)}</ol> {/* 설치 단계 목록 */}
            </section> {/* 설치 안내 종료 */}

            <section className={styles.contentSection} aria-labelledby="feature-title"> {/* 기능 안내 */}
                <div className={styles.sectionHeading}> {/* 기능 제목 영역 */}
                    <div> {/* 제목 문구 */}
                        <p className={styles.sectionKicker}>PLAY SYSTEM</p> {/* 기능 표제 */}
                        <h2 id="feature-title">주요 기능</h2> {/* 기능 제목 */}
                    </div> {/* 제목 문구 종료 */}
                </div> {/* 기능 제목 영역 종료 */}
                <div className={styles.featureGrid}>{features.map((feature, index) => <article key={feature.title}><span>{String(index + 1).padStart(2, "0")}</span><h3>{feature.title}</h3><p>{feature.description}</p></article>)}</div> {/* 기능 그리드 */}
            </section> {/* 기능 안내 종료 */}

            <section className={styles.contentSection} aria-labelledby="faq-title"> {/* 자주 묻는 질문 */}
                <div className={styles.sectionHeading}> {/* 질문 제목 영역 */}
                    <div> {/* 제목 문구 */}
                        <p className={styles.sectionKicker}>FAQ</p> {/* 질문 표제 */}
                        <h2 id="faq-title">자주 묻는 질문</h2> {/* 질문 제목 */}
                    </div> {/* 제목 문구 종료 */}
                </div> {/* 질문 제목 영역 종료 */}
                <div className={styles.faqList}>{faqs.map((faq) => <details key={faq.question}><summary>{faq.question}</summary><p>{faq.answer}</p></details>)}</div> {/* 질문 목록 */}
            </section> {/* 자주 묻는 질문 종료 */}

            <footer className={styles.footer}> {/* 하단 이동 */}
                <p>MATE Text-Play</p> {/* 하단 브랜드 */}
                <nav aria-label="Text-Play 관련 메뉴"> {/* 하단 메뉴 */}
                    <Link href="/text-play">Text-Play 홈</Link> {/* Text-Play 홈 링크 */}
                    <Link href="/">Character Chat</Link> {/* 챗봇 링크 */}
                    <span aria-disabled="true">개인정보처리방침 · 준비 중</span> {/* 개인정보 준비 상태 */}
                    <span aria-disabled="true">이용약관 · 준비 중</span> {/* 약관 준비 상태 */}
                    <span aria-disabled="true">고객지원 · 준비 중</span> {/* 지원 준비 상태 */}
                </nav> {/* 하단 메뉴 종료 */}
            </footer> {/* 하단 이동 종료 */}
        </main> // 다운로드 화면 종료
    ); // 반환 종료
} // 함수 종료
