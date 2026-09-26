import Link from "next/link"; // 내부 경로 링크
import type { Route } from "next"; // 경로 타입
import styles from "@/features/text-play/TextPlayScreen.module.css"; // 화면 스타일

export function TextPlayHomeScreen() // Text-Play 홈 화면
{ // 함수 시작
    return ( // 홈 화면 반환
        <main className={styles.page}> {/* Text-Play 홈 */}
            <section className={styles.homeHero} aria-labelledby="text-play-home-title"> {/* 홈 소개 */}
                <p className={styles.eyebrow}>MATE VERSE · WINDOWS EXPERIENCE</p> {/* 상단 표제 */}
                <h1 id="text-play-home-title">이야기를 읽는 순간에서<br />직접 움직이는 순간으로</h1> {/* 홈 제목 */}
                <p className={styles.lead}>MATE Text-Play는 선택지와 자유 입력으로 작품을 진행하고, 로컬 세이브와 장기 기억을 관리하는 Windows용 텍스트 게임 환경입니다.</p> {/* 홈 설명 */}
                <div className={styles.heroActions}> {/* 홈 동작 */}
                    <Link href={"/text-play/download" as Route} className={styles.primaryLink}>Windows 다운로드 확인</Link> {/* 다운로드 링크 */}
                    <Link href="/" className={styles.secondaryLink}>Character Chat 열기</Link> {/* 챗봇 링크 */}
                </div> {/* 홈 동작 종료 */}
            </section> {/* 홈 소개 종료 */}
            <section className={styles.homeGrid} aria-label="Text-Play 핵심 흐름"> {/* 핵심 흐름 */}
                <article className={styles.homeCard}> {/* 작품 카드 */}
                    <span>01</span> {/* 단계 번호 */}
                    <h2>작품 다운로드</h2> {/* 단계 제목 */}
                    <p>보유 작품을 로컬에 내려받고 업데이트 상태를 한곳에서 확인합니다.</p> {/* 단계 설명 */}
                </article> {/* 작품 카드 종료 */}
                <article className={styles.homeCard}> {/* 플레이 카드 */}
                    <span>02</span> {/* 단계 번호 */}
                    <h2>선택과 자유 입력</h2> {/* 단계 제목 */}
                    <p>정해진 선택지와 직접 작성한 행동을 함께 사용해 이야기를 진행합니다.</p> {/* 단계 설명 */}
                </article> {/* 플레이 카드 종료 */}
                <article className={styles.homeCard}> {/* 기억 카드 */}
                    <span>03</span> {/* 단계 번호 */}
                    <h2>세이브와 기억</h2> {/* 단계 제목 */}
                    <p>게임 상태와 장기 기억을 관리해 다음 실행에서도 흐름을 이어갑니다.</p> {/* 단계 설명 */}
                </article> {/* 기억 카드 종료 */}
            </section> {/* 핵심 흐름 종료 */}
        </main> // 홈 종료
    ); // 반환 종료
} // 함수 종료
