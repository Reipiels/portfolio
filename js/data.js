// --- [NEW] 프로젝트 아카이브 기능 ---

// 1. 프로젝트 데이터 (엑셀 데이터 변환 완료)
const projectsData = [
{"period": "24.01 ~ 24.02", "client": "KB금융공익재단", "title": "KB금융공익재단 홈페이지 재구축", "domain": "기업", "role": "BA,설계지원", "method": "SI", "env": "tomcat/jsp<br>/MariaDB", "desc": "· 기존 홈페이지 리뉴얼<br>· 단체예약기능 중심 UI/UX 개선"},
{"period": "23.12 ~ 24.02", "client": "아드지스", "title": "아드지스 시험평가시스템 구축", "domain": "교육기관", "role": "PM,설계지원", "method": "솔루션+SI", "env": "IIS/.net<br>/MariaDB", "desc": "· 맞춤형 오답노트기능 구현<br>· 내부 학원관리환경에 맞춰 UX개선"},
{"period": "23.08 ~ 23.12", "client": "한독", "title": "한독 스마트출입관리시스템 구축", "domain": "기타", "role": "BA,설계", "method": "SI", "env": "IIS/.net<br>/MariaDB", "desc": "· QR코드기반 출입기능 구현<br>· 출입게이트 API연동<br>· 내부 갱의실 수기작성방식 전산화"},
{"period": "23.04 ~ 23.07", "client": "아이비김영", "title": "아이비김영 엔지니어랩 시험평가시스템 구축", "domain": "교육기관", "role": "PM,설계지원", "method": "솔루션+SI", "env": "IIS/.net<br>/MariaDB", "desc": "· 시험솔루션 연동<br>· 응시화면 디자인 변경<br>· 데이터 연동 API 구현"},
{"period": "23.03 ~ 23.05", "client": "경기도", "title": "경기도마을공동체지원센터 MAPOOL 홈페이지", "domain": "공공", "role": "BA,설계지원", "method": "솔루션+SI", "env": "IIS/.net<br>/MariaDB", "desc": "· 인재Pool 관리기능 구현<br>· 전문가 매칭기능 구현"},
{"period": "23.03 ~ 23.04", "client": "인터넷진흥원", "title": "개인정보 영향평가 문제은행 시스템 개선", "domain": "공공", "role": "PM,설계", "method": "솔루션", "env": "IIS/.net<br>/MariaDB", "desc": "· 웹기반 시험지의 HWP 변환기능 구현"},
{"period": "22.11 ~ 23.05", "client": "몬테소리", "title": "몬테소리 홈페이지 및 쇼핑몰 재구축", "domain": "기타", "role": "BA,설계지원", "method": "솔루션+SI", "env": "tomcat/jsp<br>/MariaDB", "desc": "· UI / UX 개선<br>· 자체기술기반 쇼핑몰 구축<br>· 기업 특화기능 적용"},
{"period": "22.11 ~ 23.02", "client": "카카오", "title": "비즈니스자격증 Ntest 시험관리솔루션 납품", "domain": "기업", "role": "BA,설계", "method": "솔루션+SI", "env": "IIS/.net<br>/MariaDB", "desc": "· 응시화면 디자인 변경<br>· 데이터 연동 API 구현"},
{"period": "22.08 ~ 23.01", "client": "인천대학교", "title": "사이버영재교육원 LMS 재구축", "domain": "대학", "role": "BA,설계", "method": "솔루션+SI", "env": "tomcat/jsp<br>/MariaDB", "desc": "· 맞춤형 원서접수기능 구현<br>· 자동합격관리시스템 구현"},
{"period": "22.07 ~ 22.12", "client": "PSK", "title": "PSK LMS 재구축", "domain": "기업", "role": "BA,설계지원", "method": "솔루션+SI", "env": "IIS/.net<br>/MariaDB", "desc": "· 직무/역량별 자동매칭기능 구현<br>· 직무/역량별 학습실적 관리기능 구현<br>· 데이터 이관"},
{"period": "22.07 ~ 22.09", "client": "한국공학대학교", "title": "공학대 조기취업형 홈페이지 재구축", "domain": "대학", "role": "BA", "method": "솔루션+SI", "env": "tomcat/jsp<br>/MariaDB", "desc": "· 홈페이지 리뉴얼<br>· 장비예약기능 구현<br>· 데이터 이관"},
{"period": "22.07 ~ 22.09", "client": "서울시도시재생지원센터", "title": "모두인 홈페이지 고도화", "domain": "공공", "role": "BA,설계지원", "method": "솔루션+SI", "env": "IIS/.net<br>/MariaDB", "desc": "· 인재Pool 관리기능 구현<br>· 전문가 매칭기능 구현"},
{"period": "22.06 ~ 23.03", "client": "이노디스", "title": "신용보증재단중앙회 연수원 교육관리시스템 구축", "domain": "공공", "role": "BA,설계지원", "method": "솔루션+SI", "env": "tomcat/jsp<br>/Oracle", "desc": "· 출석인증, 숙소배정, 정산 등등<br>· 기존 ERP연동(SSO등)<br>· 데이터 이관"},
{"period": "22.04 ~ 22.06", "client": "항공우주산학융합원", "title": "LMS 솔루션 개발", "domain": "공공", "role": "BA", "method": "솔루션+SI", "env": "IIS/.net<br>/MariaDB", "desc": "· 다양한 문구/정책 변경"},
{"period": "22.03 ~ 22.06", "client": "한국교육평가개발원", "title": "LMS 솔루션 고도화", "domain": "교육기관", "role": "BA,설계지원", "method": "솔루션", "env": "IIS/.net<br>/MariaDB", "desc": "· 디자인 리뉴얼"},
{"period": "21.12 ~ 22.05", "client": "전문건설공제조합", "title": "기술교육인 LMS 구축", "domain": "교육기관", "role": "BA,설계지원", "method": "솔루션+SI", "env": "IIS/.net<br>/MariaDB", "desc": "· 내/외부망 분리구현<br>· 관계법령 준수<br>· 세금계산서 API 등 9개 외부API 연동"},
{"period": "21.11 ~ 22.02", "client": "서울시NPO지원센터", "title": "활동의 힘, 판 홈페이지 고도화", "domain": "공공", "role": "PM,설계지원", "method": "SI", "env": "tomcat/jsp<br>/MariaDB", "desc": "· 기존 사이트 디자인활용<br>· LMS + 소모임 기능<br>· 데이터 이관"},
{"period": "21.08 ~ 21.12", "client": "한독제약", "title": "LMS 솔루션 개발", "domain": "기업", "role": "PMO,설계지원", "method": "솔루션+SI", "env": "IIS/.net<br>/MS-SQL", "desc": "· GxP(미국 FDA Part11)기준 준수<br>· EDMS 솔루션 연동<br>· 기존 ERP정보 연동(SSO 등)"},
{"period": "21.05 ~ 21.08", "client": "한국산업기술대학교", "title": "일학습병행 LMS 고도화(평가솔루션 연동)", "domain": "대학", "role": "PM,설계지원", "method": "솔루션+SI", "env": "IIS/.net<br>/MS-SQL", "desc": "· 시험평가솔루션 연동(SSO 등)<br>· NCS 능력단위/수행준거 연동"},
{"period": "21.03 ~ 21.05", "client": "원광대학교", "title": "원광대학교 문제은행 시스템 구축", "domain": "대학", "role": "PM,설계", "method": "솔루션+SI", "env": "IIS/.net<br>/MariaDB", "desc": "· 교수/운영자권한 추가구현"},
{"period": "20.12 ~ 21.04", "client": "한솔미래교육원", "title": "한솔미래교육원 LMS 고도화", "domain": "교육기관", "role": "PM,설계", "method": "SI", "env": "tomcat/jsp<br>/MariaDB", "desc": "· 기존 사이트 소스활용 개발<br>· LMS 디자인 적용<br>· 데이터 이관"},
{"period": "20.12 ~ 21.05", "client": "송파구청", "title": "송파쌤 교육포털 고도화", "domain": "공공", "role": "PM,설계", "method": "솔루션+SI", "env": "Jeus/jsp<br>/Oracle", "desc": "· 기존홈페이지 연동<br>· 화상강의솔루션 연동<br>· QR코드기반 출석인증"},
{"period": "20.09 ~ 21.03", "client": "에듀윌", "title": "산업안전보건교육센터 LMS 구축", "domain": "교육기관", "role": "PM,설계", "method": "솔루션+SI", "env": "IIS/.net<br>/MariaDB", "desc": "· 관계법령 준수<br>· 결제모듈 등 5개 외부API 연동"},
{"period": "20.08 ~ 21.02", "client": "에이투엠", "title": "국가연구안전관리본부 LMS 고도화", "domain": "공공", "role": "PM,설계", "method": "SI", "env": "resin/jsp<br>/Oracle", "desc": "· 업체위탁개발(하도급)<br>· 데이터 이관"},
{"period": "20.07 ~ 20.12", "client": "영남건설기술교육원", "title": "영남건설기술교육원 LMS 납품", "domain": "교육기관", "role": "PM,설계", "method": "솔루션+SI", "env": "IIS/.net<br>/MariaDB", "desc": "· 관계법령 준수<br>· 세금계산서 API 등 9개 외부API 연동<br>· 데이터 이관"},
{"period": "20.07 ~ 20.12", "client": "서울시복지재단", "title": "공유복지플랫폼 LMS 구축", "domain": "공공", "role": "설계", "method": "SI", "env": "Jeus/jsp<br>/Oracle", "desc": "· PM/Front설계 별도업체진행<br>· QR코드기반 출석인증<br>· 데이터 이관"},
{"period": "20.06 ~ 20.09", "client": "서울시 도시재생지원센터", "title": "인적자원 온라인시스템 구축", "domain": "공공", "role": "PM", "method": "솔루션+SI", "env": "IIS/.net<br>/MariaDB", "desc": "· LMS기능 축소<br>· 이력관리기능 추가구현"},
{"period": "20.03 ~ 20.04", "client": "KC대학교", "title": "학습관리시스템(LMS) 고도화", "domain": "대학", "role": "PM,설계", "method": "솔루션", "env": "IIS/.net<br>/MariaDB", "desc": "· 데이터 이관(콘텐츠정보만)"},
{"period": "20.01 ~ 20.03", "client": "한국공인회계사회", "title": "재무빅데이터분석사 자격시험 홈페이지 구축", "domain": "기업", "role": "PM,설계", "method": "SI", "env": "IIS/.net<br>/MariaDB", "desc": "· 자격증관리기능<br>· 시험접수/관리기능 등"},
{"period": "20.01 ~ 20.05", "client": "엔피테크", "title": "Ntest 시험관리서비스 고도화(2차)", "domain": "기업", "role": "PM,설계", "method": "SI", "env": "-", "desc": "-"},
{"period": "19.11 ~ 20.01", "client": "한국산업기술대학교", "title": "조기취업형 계약학과 전용 LMS 구축", "domain": "대학", "role": "PM,설계", "method": "솔루션", "env": "IIS/.net<br>/MariaDB", "desc": "· 기존 산기대 버전 활용<br>· 홈페이지 디자인만 변경"},
{"period": "19.08 ~ 19.11", "client": "씨앤알리서치", "title": "학습관리시스템(LMS) 구축", "domain": "기업", "role": "PM,설계", "method": "솔루션+SI", "env": "IIS/.net<br>/MariaDB", "desc": "· 데이터 이관"},
{"period": "19.06 ~ 19.07", "client": "시니어앤파트너즈", "title": "홈페이지 및 헤드헌팅시스템 구축", "domain": "기업", "role": "PM,설계", "method": "솔루션", "env": "IIS/.net<br>/MariaDB", "desc": "· 기존 유앤파트너즈 버전 활용<br>· 홈페이지 디자인만 변경"},
{"period": "19.04 ~ 19.10", "client": "한국공정경쟁연합회", "title": "학습관리시스템(LMS) 구축", "domain": "기업", "role": "PM,설계", "method": "SI", "env": "IIS/.net<br>/MariaDB", "desc": "· 결제 API 등 3개 외부API 연동<br>· 데이터 이관"},
{"period": "18.11 ~ 19.04", "client": "유앤파트너즈", "title": "유앤파트너즈 홈페이지 및 헤드헌팅시스템 구축", "domain": "기타", "role": "PM,설계", "method": "SI", "env": "IIS/.net<br>/MariaDB", "desc": "· 서치펌 전용 관리시스템 구현<br>· 맞춤형 인재검색기능 구현<br>· 데이터 이관"},
{"period": "18.08 ~ 18.10", "client": "엔피테크", "title": "Ntest 시험관리서비스 고도화(1차)", "domain": "기업", "role": "PM,설계", "method": "SI", "env": "-", "desc": "-"},
{"period": "18.07 ~ 18.09", "client": "KC대학교", "title": "학습관리시스템(LMS) 구축", "domain": "대학", "role": "PM,설계", "method": "솔루션", "env": "-", "desc": "-"},
{"period": "18.03 ~ 18.04", "client": "EMC교육평가원", "title": "TESL 시험서비스 구축", "domain": "교육기관", "role": "PM,설계", "method": "SI", "env": "-", "desc": "-"},
{"period": "17.12 ~ 18.05", "client": "아이비김영", "title": "원격학점은행용 LMS 납품", "domain": "교육기관", "role": "PM,설계", "method": "솔루션+SI", "env": "IIS/.net<br>/MS-SQL", "desc": "· 관계법령 준수<br>· 개인정보보호법 준수"},
{"period": "17.09 ~ 18.01", "client": "지안에듀", "title": "알기사 반응형웹기반 학원용LMS 구축", "domain": "교육기관", "role": "설계", "method": "솔루션+SI", "env": "tomcat/jsp<br>/Oracle", "desc": "· 결제 API 등 4개 외부API 연동<br>· 도메인 분리형 웹사이트 자동생성<br>· 데이터 이관"},
{"period": "17.06 ~ 17.08", "client": "엔피테크", "title": "ASP형 시험서비스 NTEST 구축", "domain": "기업", "role": "설계", "method": "SI", "env": "-", "desc": "-"},
{"period": "17.03 ~ 17.06", "client": "동의대학교", "title": "동의대학교 DOOR시스템 구축", "domain": "대학", "role": "PM,설계", "method": "SI", "env": "IIS/.net<br>/MS-SQL", "desc": "· 콘텐츠 공유 Pool 기능 구현<br>· 별도 전용 App 구현<br>· 메신저 API 연동"},
{"period": "16.12 ~ 17.02", "client": "희림건축", "title": "희림건축 교육관리시스템 고도화", "domain": "기업", "role": "PM,설계", "method": "SI", "env": "tomcat/jsp<br>/Oracle", "desc": "· 통계기능 강화"},
{"period": "16.12 ~ 17.03", "client": "강동대학교", "title": "강동대학교 NCS기반 전산시스템 고도화", "domain": "대학", "role": "PM,설계", "method": "SI", "env": "IIS/.net<br>/MS-SQL", "desc": "· NCS 정책변경사항 반영"},
{"period": "16.11 ~ 17.01", "client": "LGCNS", "title": "LG 생활건강 온라인시험시스템 구축", "domain": "기업", "role": "PM,설계", "method": "솔루션+SI", "env": "tomcat/jsp<br>/Oracle", "desc": "· 기업 자체 역량Lv규정 반영"},
{"period": "16.06 ~ 16.10", "client": "디지털서울문화예술대학", "title": "디지털서울문화예술대학교 LMS 고도화", "domain": "대학", "role": "PM,설계", "method": "솔루션+SI", "env": "IIS/.net<br>/MS-SQL", "desc": "· 사이버대학교 전용 LMS 구현<br>· 별도 전용 App 구현<br>· 데이터 이관"},
{"period": "16.03 ~ 16.05", "client": "랭리교육", "title": "교육관리시스템(LMS)구축", "domain": "교육기관", "role": "PM,설계", "method": "솔루션", "env": "-", "desc": "-"},
{"period": "16.03 ~ 16.03", "client": "퍼스트이앤씨", "title": "교육관리시스템(LMS)구축", "domain": "교육기관", "role": "PM,설계", "method": "솔루션", "env": "-", "desc": "-"},
{"period": "16.02 ~ 16.02", "client": "강동대학교", "title": "교육관리시스템(LMS)구축", "domain": "대학", "role": "PM,설계", "method": "솔루션", "env": "-", "desc": "-"},
{"period": "16.01 ~ 16.02", "client": "트리비아", "title": "국제영어대학원대학교 시험시스템 구축", "domain": "대학", "role": "PM,설계", "method": "SI", "env": "tomcat/jsp<br>/Oracle", "desc": "· 시험등록/평가 전용기능 구현"},
{"period": "15.11 ~ 16.01", "client": "한국산업기술대학교", "title": "한국산업기술대학교 일학습병행 LMS 구축", "domain": "대학", "role": "PM,설계", "method": "SI", "env": "IIS/.net<br>/MS-SQL", "desc": "· 일학습병행제 운영규정 준수<br>· 5개 권한별 맞춤기능 구현"},
{"period": "15.10 ~ 15.11", "client": "오산대학교", "title": "교육관리시스템(LMS)구축", "domain": "대학", "role": "PM,설계", "method": "솔루션", "env": "-", "desc": "-"},
{"period": "15.09 ~ 15.11", "client": "유니와이즈", "title": "유니와이즈 반응형웹기반 학원용LMS 구축", "domain": "교육기관", "role": "설계지원", "method": "SI", "env": "tomcat/jsp<br>/Oracle", "desc": "· 업체에서 직업 설계진행<br>· 데이터 이관"},
{"period": "15.08 ~ 15.10", "client": "해커스랩", "title": "원격학점은행제 교육관리시스템(LMS)구축", "domain": "교육기관", "role": "PM,설계", "method": "솔루션+SI", "env": "IIS/.net<br>/MS-SQL", "desc": "· 관계법령 준수<br>· 홈페이지 디자인 변경"},
{"period": "15.07 ~ 15.08", "client": "한국대학가상교육연합", "title": "반응형웹 기반 학습관리시스템(LMS) 구축", "domain": "대학", "role": "PM,설계", "method": "SI", "env": "IIS/.net<br>/MS-SQL", "desc": "· 기존소스 및 DB구조 그대로 활용"},
{"period": "15.06 ~ 15.08", "client": "한국민간자격교육개발원", "title": "교육관리시스템(LMS)구축", "domain": "교육기관", "role": "PM,설계", "method": "솔루션+SI", "env": "IIS/.net<br>/MS-SQL", "desc": "· 도메인 분리형 웹사이트 자동생성"},
{"period": "15.06 ~ 15.08", "client": "부산대학교", "title": "모바일학생증", "domain": "기타", "role": "설계", "method": "SI", "env": "IIS/.net<br>/MS-SQL", "desc": "· 학생증 App 개발<br>· 학사관리시스템 연동"},
{"period": "15.04 ~ 15.12", "client": "법제처", "title": "법제처 교육관리시스템(LMS) 구축", "domain": "공공", "role": "설계", "method": "솔루션+SI", "env": "jeus/jsp<br>/Oracle", "desc": "· 업체위탁개발(하도급)<br>· 설계산출물 작성"},
{"period": "15.02 ~ 15.03", "client": "희림건축", "title": "교육관리시스템(LMS)구축", "domain": "기업", "role": "PM,설계", "method": "솔루션+SI", "env": "tomcat/jsp<br>/Oracle", "desc": "· 오프라인 교육관리기능 구현<br>· QR코드기반 출석인증"},
{"period": "15.02 ~ 15.03", "client": "신구대학교", "title": "모바일학생증 + 출결인증", "domain": "기타", "role": "PM,설계", "method": "SI", "env": "IIS/.net<br>/MS-SQL", "desc": "· 학생증 App 개발<br>· 학사관리시스템 연동<br>· QR코드기반 출석인증"},
{"period": "15.01 ~ 15.02", "client": "신구대학교", "title": "중도탈락방지시스템", "domain": "기타", "role": "PM,설계", "method": "SI", "env": "IIS/.net<br>/MS-SQL", "desc": "· 중도탈락관련 논문에 따른 맞춤 구현"},
{"period": "14.12 ~ 15.02", "client": "국립중앙의료원", "title": "교육관리시스템(LMS)구축", "domain": "공공", "role": "설계지원", "method": "솔루션+SI", "env": "tomcat/jsp<br>/Oracle", "desc": "· 데이터 이관"},
{"period": "14.11 ~ 14.12", "client": "신구대학교", "title": "모바일LMS구축", "domain": "대학", "role": "PM,설계", "method": "SI", "env": "IIS/.net<br>/MS-SQL", "desc": "· Hybrid App 기반 구현<br>· App전용 플레이어, 설문기능 구현"},
{"period": "14.06 ~ 14.08", "client": "이화여자대학교", "title": "원격평생교육원 교육관리시스템(LMS) 구축", "domain": "대학", "role": "PM,설계", "method": "솔루션+SI", "env": "IIS/.net<br>/MS-SQL", "desc": "· LMS기반 요구사항 맞춤 구현"},
{"period": "14.01 ~ 14.03", "client": "한국뉴욕주립대학교", "title": "스마트캠퍼스 고도화", "domain": "대학", "role": "PM,설계", "method": "SI", "env": "jeus/jsp<br>/Oracle", "desc": "· 학사관리시스템 구현"},
{"period": "14.01 ~ 14.02", "client": "신한대학교", "title": "평생학습중심대학 학습관리시스템(LMS) 구축", "domain": "대학", "role": "PM,설계", "method": "솔루션", "env": "-", "desc": "-"},
{"period": "14.01 ~ 14.01", "client": "상명대학교", "title": "모바일LMS구축", "domain": "대학", "role": "PM,설계", "method": "SI", "env": "-", "desc": "· Hybrid App 기반 구현"},
{"period": "13.11 ~ 14.03", "client": "동명대학교", "title": "LMS / 모바일 LMS 구축", "domain": "대학", "role": "PM,설계", "method": "솔루션+SI", "env": "IIS/.net<br>/MS-SQL", "desc": "· 데이터 이관"},
{"period": "13.11 ~ 14.02", "client": "신구대학교", "title": "학습관리시스템(LMS) 구축", "domain": "대학", "role": "설계", "method": "솔루션+SI", "env": "IIS/.net<br>/MS-SQL", "desc": "· 데이터 이관"},
{"period": "13.07 ~ 13.12", "client": "하이리빙", "title": "모바일 / 태블릿 App 구축", "domain": "기타", "role": "설계지원", "method": "SI", "env": "tomcat/jsp<br>/Oracle", "desc": "· 다단계기반 쇼핑몰 구현<br>· 등급별 회원관리기능 반영"},
{"period": "12.11 ~ 13.02", "client": "대한건축사협회", "title": "온/오프라인 학습관리시스템(LMS) 구축", "domain": "기업", "role": "설계", "method": "SI", "env": "tomcat/jsp<br>/Oracle", "desc": "· LMS로직 jsp버전 최초구현"},
{"period": "12.06 ~ 12.08", "client": "중부대학교", "title": "상담/영업관리시스템(CRM) 구축", "domain": "기타", "role": "PM,설계", "method": "SI", "env": "-", "desc": "-"}
];

// 2. 렌더링 함수
const tableBody = document.getElementById('projectListBody');
const totalCount = document.getElementById('totalCount');
const searchInput = document.getElementById('projectSearch');
const sortFilter = document.getElementById('sortFilter');
const domainChecks = document.querySelectorAll('input[name="domain"]');

function renderProjects() {
    // 필터링 로직
    const searchText = searchInput.value.toLowerCase();
    const checkedDomains = Array.from(domainChecks).filter(c => c.checked).map(c => c.value);
    const sortMode = sortFilter.value;

	let filtered = projectsData.filter(p => {
        const matchesText = p.client.toLowerCase().includes(searchText) || 
                            p.title.toLowerCase().includes(searchText) ||
                            p.role.toLowerCase().includes(searchText) ||
                            p.method.toLowerCase().includes(searchText) ||
							p.env.toLowerCase().includes(searchText) ||
                            p.desc.toLowerCase().includes(searchText); 
                            
        const matchesDomain = checkedDomains.includes(p.domain);
        return matchesText && matchesDomain;
    });
    // 정렬 로직 (단순 인덱스 역순이 최신순이라고 가정 - 데이터가 최신순 정렬되어 있다면)
    // 데이터가 이미 최신순이라면 그대로, 아니라면 날짜 파싱 필요. 
    // 여기선 데이터가 최신순(위에서 아래)이라고 가정하고 'old'일 때만 뒤집음.
    if (sortMode === 'old') {
        filtered = filtered.reverse();
    }

    // HTML 생성
    if (filtered.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="8" class="no-result">검색 결과가 없습니다.</td></tr>';
        totalCount.innerText = 0;
        return;
    }

tableBody.innerHTML = filtered.map(p => {
    let badgeClass = 'etc';
    const d = p.domain;
    
    if (d === '공공') badgeClass = 'public';
    else if (d === '기업') badgeClass = 'corp';
    else if (d === '대학') badgeClass = 'univ';
    else if (d === '교육기관') badgeClass = 'edu';
    else badgeClass = 'etc';

    return `
        <tr>
            <td class="col-period">${p.period}</td>
            <td class="col-client">${p.client}</td>
            <td class="col-title">${p.title}</td>
            <td class="col-domain"><span class="badge ${badgeClass}">${p.domain}</span></td>
            <td class="col-role">${p.role}</td>
            <td class="col-method">${p.method || '-'}</td>
            <td class="col-env">${p.env || '-'}</td>
            <td class="col-desc">${p.desc}</td>
        </tr>
    `;
}).join('');

    totalCount.innerText = filtered.length;
}

// 3. 이벤트 리스너 등록
searchInput.addEventListener('input', renderProjects);
sortFilter.addEventListener('change', renderProjects);
domainChecks.forEach(cb => cb.addEventListener('change', renderProjects));

// 초기 렌더링
renderProjects();