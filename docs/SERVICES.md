# 외부 서비스: 역할, 연결 상태, 비용

Mate Verse ChatBot이 쓰거나 앞으로 쓸 외부 서비스를 한곳에 모은 문서다. 서비스마다 무슨 일을 하는지, 코드가 어디까지 되어 있는지, 지금 연결되어 있는지, 돈이 얼마나 드는지를 적는다.

- **조사한 날**: 2026-10-07. 가격은 자주 바뀐다. 가입하거나 결제하기 전에 맨 아래 「출처」의 주소에서 다시 확인한다.
- **원으로 바꾼 값**은 1달러 = 1,400원으로 가정한 어림값이다.
- **비밀 값은 적지 않는다.** 열쇠와 비밀번호는 `.env.local`과 각 서비스 화면에만 넣는다. 이 문서에는 이름만 적는다.
- 연결 순서는 `docs/ACCOUNT-SETUP.md`(로그인과 서버 저장), `README.md`(실제 AI)에 있다.

## 한눈에 보기

- **지금 실제로 연결된 것**: Supabase(로그인)와 Ollama(내 컴퓨터 AI) 둘뿐이고, 둘 다 프로젝트 주인의 컴퓨터에서만 켜져 있다. 돈이 나가는 서비스는 없다.
- **코드는 끝났고 열쇠만 넣으면 되는 것**: AI 회사 세 곳(Google, OpenAI, Anthropic)과 Google 로그인.
- **공개하거나 돈을 받기 시작할 때 새로 필요한 것**: 배포, 도메인, 메일 발송, 이미지 생성, 결제, 본인인증 등. 지금은 코드가 없거나 연습용(모의)이다.

## 1. 이미 연결했거나 무료로 바로 쓸 수 있는 것

| 서비스 | 역할 | 코드 | 연결 상태 | 비용 |
| --- | --- | --- | --- | --- |
| Supabase | 로그인(이메일·비밀번호), 계정 데이터 서버 저장 | 완성. `src/lib/account/`, `supabase/account-setup.sql` | 주인의 컴퓨터에서 스위치를 켜고 로그인 화면까지 확인. 가입·로그인·서버 저장은 아직 실제로 돌려 보지 않음. 값이 없는 컴퓨터에서는 연습용 로그인으로 동작 | 무료 요금제: 프로젝트 2개, 데이터베이스 500MB, 월 이용자 5만 명, 파일 1GB. 1주일 안 쓰면 멈춤. 넘으면 Pro 월 $25부터 |
| Google 로그인 | 구글 계정으로 로그인 | 완성(Supabase를 거침) | 꺼져 있음. 켜려면 Google Cloud와 Supabase 화면에서 설정 | 요금 항목이 없음(사실상 무료) |
| Ollama | 오픈챗(19세 작품의 실제 대화)을 내 컴퓨터의 공개 모델로 | 완성. `src/lib/llm/model-catalog.ts`, `providers.ts` | 주인의 컴퓨터에서 동작 확인. 컴퓨터마다 Ollama와 모델을 다시 설치해야 함 | 0원(프로그램과 모델은 무료, 전기와 컴퓨터만) |
| GitHub | 코드 보관 | - | 사용 중 | 0원 |

## 2. AI 회사 (코드는 완성, 열쇠가 없어 연결 안 됨)

`ENABLE_REAL_PROVIDERS=true`이고 그 회사의 열쇠가 `.env.local`에 있을 때만 연결된다. 그 밖에는 연습용 AI가 답한다. 등급과 모델의 짝은 `src/features/chat/chat-tiers.ts`와 `src/lib/llm/model-catalog.ts`에 있다.

| 회사 | 모델(기본값) | 쓰는 등급 | 앱 토큰 비용 | 100만 토큰당 입력 / 출력 | 메시지 1번 어림 |
| --- | --- | --- | --- | --- | --- |
| Google | `gemini-2.5-flash` | 베이직챗 | 1 | $0.30 / $2.50 | 약 5원 |
| Google | `gemini-2.5-pro` | 스마트챗 | 2 | $1.25 / $10 | 약 22원 |
| OpenAI | `gpt-5` | 밸런스챗 | 2 | $1.25 / $10 | 약 22원 |
| Anthropic | `claude-sonnet-5-5` | 플러스챗 | 3 | $2 / $10 | 약 31원 |
| Anthropic | `claude-opus-5-5` | 프리미엄챗 | 8 | $4 / $20 | 약 62원 |
| Anthropic | `claude-fable-5-1` | 마스터챗 | 12 | $10 / $50 | 약 154원 |

- **어림 기준**: 메시지 1번에 입력 8,000토큰(캐릭터 설정과 최근 대화), 출력 600토큰. 대화가 짧으면 절반, 길면 두 배까지 달라진다. 프리미엄챗과 마스터챗은 생각 과정도 출력으로 과금되어 더 나올 수 있다.
- **예**: 하루에 대화가 1,000번 오가면 베이직챗은 월 약 16만 원, 플러스챗은 월 약 93만 원이다.
- **토큰 비용을 다시 정해야 한다.** 앱의 토큰 비용 비율(1·2·2·3·8·12)이 실제 원가 비율(약 1·4·4·6·11·28)과 맞지 않는다. 윗등급일수록 원가보다 싸게 잡혀 있다.
- **Gemini 2.5는 새 프로젝트에서 막힐 수 있다.** Google 문서에 "기존 사용자에게만 제공"이라는 문구가 있다. 연결할 때 현행 모델로 바꿔야 할 수 있다(`CHAT_MODEL_BASIC`, `CHAT_MODEL_SMART`로 바꿈).
- **무료로 시험하기**: Gemini는 무료 사용 한도가 있다. 다만 무료로 보낸 내용은 Google의 제품 개선에 쓰인다.
- 로그인과 사람별 사용량 제한이 생기기 전에는 공개 주소에서 실제 AI를 열지 않는다(`CHAT_ALLOW_PUBLIC`).

## 3. 공개하거나 돈을 받기 시작할 때 새로 필요한 것

| 서비스 | 역할 | 지금 구현 | 비용 |
| --- | --- | --- | --- |
| 배포(Vercel 등) | 누구나 들어올 수 있는 주소 | 배포하지 않음 | 무료 요금제는 개인·비상업 용도만 허용. 결제를 붙이면 Pro 월 $20(좌석당) |
| 도메인 | 주소 이름 | 없음 | .com 연 약 2만 원(가비아 첫해 19,800원, 다음 해부터 정가). Cloudflare는 .com 연 약 $10 |
| 빌린 GPU 서버(RunPod 등) | 공개 서비스에서 오픈챗 돌리기 | 주소와 열쇠만 바꾸면 연결(`LOCAL_BASE_URL`, `LOCAL_API_KEY`) | 24GB 그래픽 카드 시간당 $0.16~0.74. 24시간 켜 두면 월 약 $115~533 |
| 메일 발송(Resend 등) | 가입 확인 메일 | 없음. Supabase에 들어 있는 메일은 시간당 2통뿐 | 월 3,000통(하루 100통)까지 무료, 그 위는 월 $20 |
| 이미지 생성 API | 이미지 스튜디오의 실제 그림 | 견본 그림을 만드는 연습용뿐(`mock-image-adapter.ts`) | 장당 약 $0.003~0.13(모델과 크기에 따라) |
| 이미지 저장소(Cloudflare R2 등) | 만든 그림 보관 | 없음 | 10GB까지 무료, 그 위는 GB당 월 $0.015. 내려받기 요금 없음 |
| 결제대행사(토스페이먼츠 등) | 토큰 충전, 멤버십 | 없음(충전은 "준비 중" 표시) | 카드 3.2~3.4% + 부가세. 가입비 22만 원과 연 관리비 11만 원(포트원을 거치면 면제될 수 있음). 사업자등록과 통신판매업 신고 필요 |
| 본인인증(PASS 등) | 실제 성인 인증 | 모의 인증(생년월일 입력) | 건당 약 40~55원. 월 기본료형은 2만 5천 원부터 |
| 금지 내용 검사 | 미성년자·실존 인물 관련 내용 막기 | 낱말로 거르는 연습용 | 조사하지 않음 |
| 오류 모니터링(Sentry 등) | 사용자가 겪은 오류 모으기 | 없음 | 월 5천 건까지 무료, 팀 요금제 월 $26 |
| 카카오 로그인 | 카카오 계정으로 로그인 | 없음(선택) | 무료 |
| Windows 코드 서명 | Text-Play 설치 파일의 신뢰 표시 | 없음(다운로드 버튼이 꺼져 있음) | 인증서 연 $129~314. Microsoft 서명 서비스(월 $9.99)는 한국에서는 개인이 못 쓰고 조직만 가능 |

## 4. 단계별로 드는 돈(어림)

| 단계 | 필요한 것 | 달마다 드는 돈 |
| --- | --- | --- |
| 지금(혼자 시험) | Supabase 무료, 내 컴퓨터 AI | 0원 |
| 아는 사람에게 보여 주기(실제 AI 없이, 돈 받지 않음) | 배포 무료 요금제, 원하면 도메인 | 0원(도메인은 연 약 2만 원) |
| 실제 AI를 공개 | AI 회사 사용료 또는 빌린 GPU, 사용량 제한 | 쓰는 만큼. 2절의 예 참고 |
| 돈을 받기 시작 | 배포 Pro, 결제대행사, 본인인증, 메일 발송 | 월 $20 + 결제 금액의 약 3.4% + 인증 건수 × 약 50원 |

무료 요금제도 이용자나 저장량이 늘면 유료로 넘어간다. 유료 서비스를 연결하기 전에 월 예산 한도와 넘었을 때 막는 기준을 먼저 정한다.

## 5. 확인하지 못했거나 불확실한 것

- Google 로그인이 "무료"라고 적힌 공식 문구는 찾지 못했다. 요금 항목이 없을 뿐이다.
- Gemini 무료 사용 한도의 정확한 수치는 공식 문서에 없고 Google AI Studio에서 확인하라고만 되어 있다.
- 국내 결제 수수료와 본인인증 단가는 출처마다 다르고 일부는 2024~2025년 글이다. 계약 전에 견적을 받는다.
- 통신판매업 신고 면제 기준은 출처마다 다르다. 관할 구청에 확인한다.
- 한국 개인사업자가 Microsoft 서명 서비스의 "조직" 자격이 되는지는 문서에 없다.
- 2절의 가격 가운데 Claude는 2026-09-25 기준 가격표, 나머지는 2026-10-07에 각 회사 가격 페이지에서 읽은 값이다.

## 6. 출처

| 항목 | 주소 |
| --- | --- |
| Supabase 요금 | https://supabase.com/pricing |
| Supabase 메일 한도 | https://supabase.com/docs/guides/auth/rate-limits |
| Google 로그인 | https://developers.google.com/identity/gsi/web/guides/overview |
| 카카오 로그인 사용량 | https://developers.kakao.com/docs/ko/getting-started/quota |
| Gemini 가격 | https://ai.google.dev/gemini-api/docs/pricing |
| Gemini 모델 종료 안내 | https://ai.google.dev/gemini-api/docs/deprecations |
| OpenAI 가격 | https://developers.openai.com/api/docs/pricing |
| Claude 가격 | https://platform.claude.com/docs/en/about-claude/pricing |
| RunPod 가격 | https://www.runpod.io/pricing |
| Ollama | https://ollama.com/pricing |
| fal.ai 이미지 가격 | https://fal.ai/pricing |
| Replicate 이미지 가격 | https://replicate.com/pricing |
| Cloudflare R2 가격 | https://developers.cloudflare.com/r2/pricing/ |
| Vercel 요금 | https://vercel.com/pricing |
| Vercel 무료 요금제 사용 조건 | https://vercel.com/docs/limits/fair-use-guidelines |
| 가비아 도메인 | https://event.gabia.com/domain/famous/ |
| 토스페이먼츠 수수료 | https://www.tosspayments.com/about/fee |
| KG이니시스 수수료 | https://www.inicis.com/pg-method |
| 포트원 요금 | https://www.portone.io/pricing |
| 다날 본인확인 요금 | https://danalpay.com/service_application/rate_information |
| Resend 요금 | https://resend.com/pricing |
| Sentry 요금 | https://sentry.io/pricing/ |
| Microsoft 서명 서비스 자격 | https://learn.microsoft.com/en-us/azure/artifact-signing/quickstart |
| SSL.com 코드 서명 인증서 | https://www.ssl.com/products/software-integrity/code-signing/ov/ |

## 7. 이 문서를 고칠 때

- 서비스를 새로 연결하거나 끊으면 1~3절의 「연결 상태」와 「지금 구현」을 고친다.
- 가격을 다시 확인하면 맨 위의 「조사한 날」을 함께 고친다.
- 모델이나 토큰 비용을 바꾸면 2절의 표를 `chat-tiers.ts`, `model-catalog.ts`와 맞춘다.
- 지금 단계와 다음에 할 일은 `NEXT-SESSION.md`에 적는다. 이 문서는 서비스 목록과 비용만 다룬다.
