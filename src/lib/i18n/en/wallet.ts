export const wallet: Record<string, string> = // 서버 지갑 번역
{ // 사전 시작
    "서버 데이터 받기 전": "Before taking server data", // 동기화 백업
    "서버 계정 지갑": "Server account wallet", // 지갑 제목
    "잔액 새로고침": "Refresh balance", // 다시 조회
    "토큰 반환": "Token refund", // 반환 출처
    "응답 전 실패 토큰 반환": "Refund before response", // 반환 설명
    "로그인하면 계정의 토큰 잔액을 확인할 수 있어요.": "Sign in to see your account token balance.", // 로그인 안내
    "서버 토큰을 확인하고 있어요.": "Checking your server wallet.", // 조회 대기
    "잔액과 이용 내역은 서버에서 확인한 값이에요. 시험용 토큰과 별도로 관리해요.": "Your balance and history come from the server and are separate from practice tokens.", // 권한 안내
    "로그인이 만료됐어요. 다시 로그인해 주세요.": "Your session expired. Please sign in again.", // 인증 만료
    "서버 토큰을 불러오거나 처리하지 못했어요. 잠시 뒤 다시 시도해 주세요.": "Your server wallet could not be loaded or updated. Please try again shortly.", // 연결 장애
    "서버 토큰을 확인하지 못해 요청을 중단했어요. 토큰 이용 내역에서 잔액을 새로 확인해 주세요.": "The request stopped because your server wallet could not be checked. Refresh your balance in token history.", // 차감 차단
    "이미 처리했거나 종료된 요청이에요. 토큰 이용 내역을 확인한 뒤 새 메시지로 다시 시도해 주세요.": "This request was already processed or closed. Check token history before sending a new message.", // 중복 요청
    "실제 계정의 이미지 생성은 서버 연결을 준비 중이에요. 토큰은 차감하지 않았어요.": "Image generation for real accounts is being prepared. No tokens were spent.", // 이미지 준비
    "실제 계정은 출석과 서버 대화 실적 보상을 제공해요. 좋아요·모두 완료·초대 보상은 서버 검증 연결을 준비 중이에요.": "Real accounts support check-in and verified chat rewards. Like, completion, and invite rewards are being prepared.", // 보상 범위
    "응답 시작 전 시스템 오류는 토큰을 반환해요. 응답 시작 후 중단은 사용으로 남아요. 연습 응답은 실제 계정 토큰을 차감하지 않아요.": "System failures before a response are refunded. Stopping after a response starts counts as usage. Practice replies do not spend account tokens.", // 반환 기준
}; // 사전 종료
