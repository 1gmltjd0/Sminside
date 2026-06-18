/**
 * Sminside (스민사이드) - 백엔드 엔진
 * 
 * [Engineer's Note]
 * 이 서버는 Express.js 프레임워크를 기반으로 구축되었습니다. 
 * RESTful API 원칙을 준수하며, 마이스터고 학생들의 소통과 기업 매칭을 처리합니다.
 */

const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const PORT = 3000;

// 정적 파일 서빙 및 JSON 파서 설정
app.use(express.static('public'));
app.use(bodyParser.json());

// [학교 데이터베이스]
const schoolInfo = {
    '대덕': { name: '대덕소프트웨어마이스터고등학교', url: 'https://dsmhs.djsch.kr/' },
    '대구': { name: '대구소프트웨어마이스터고등학교', url: 'https://dgsw.djsch.kr/' },
    '광주': { name: '광주소프트웨어마이스터고등학교', url: 'http://gsm.gen.hs.kr/' },
    '부산': { name: '부산소프트웨어마이스터고등학교', url: 'https://bssw.hs.kr/' }
};

// [커뮤니티 데이터] - 글로벌 및 학교별 게시글 통합 관리
let posts = [
    { id: 1, title: '2026학년도 대덕 13기 신입생 Q&A', content: '입학 전형이나 기숙사 생활 등 궁금한 점이 있다면 편하게 질문 남겨주세요.', writer: '대덕장인', school: '대덕', date: '06.17', category: '자유', views: 152 },
    { id: 2, title: '대구 코딩 동아리 신규 부원 모집 안내', content: 'React와 NestJS를 주 스택으로 활동할 예정입니다. 함께 성장할 팀원을 기다립니다.', writer: '코드마스터', school: '대구', date: '06.16', category: '프로젝트', views: 89 },
    { id: 3, title: '취업 준비생을 위한 포트폴리오 구성 가이드', content: '기술 블로그 관리와 프로젝트 아카이빙의 중요성에 대해 정리해 보았습니다.', writer: '취업준비생', school: '광주', date: '06.15', category: '취업', views: 421 },
    { id: 4, title: '부산소마고 해커톤 후기', content: '이번 해커톤에서 많은 걸 배웠습니다. 다들 고생하셨어요!', writer: '부산개발자', school: '부산', date: '06.14', category: '기술', views: 230 }
];

// [기업 데이터베이스] - 요청에 따른 기업 매칭 섹션 복구
const companies = [
    { id: 1, name: '카카오', industry: 'IT/서비스', location: '제주/판교', logo: 'K', desc: '세상의 모든 연결을 꿈꾸는 기업' },
    { id: 2, name: '네이버', industry: 'IT/검색', location: '성남', logo: 'N', desc: '기술로 세상을 이롭게' },
    { id: 3, name: '토스', industry: '핀테크', location: '서울', logo: 'T', desc: '금융의 모든 순간' },
    { id: 4, name: '우아한형제들', industry: '배달/플랫폼', location: '서울', logo: 'B', desc: '배달의 민족을 만듭니다' }
];

// [메시지 데이터]
let messages = [
    { from: '대덕장인', to: '김예준', content: '문의하신 리액트 오류는 해결되셨나요?', time: '오후 2:30' },
    { from: '김예준', to: '대덕장인', content: '네, 구글링을 통해 해결 방법을 찾았습니다. 감사합니다!', time: '오후 2:35' }
];

// [유저 데이터]
const users = {
    'admin': { name: '김예준', school: '대덕', followers: 124, following: 89, bio: 'Better Future, Through Code.' }
};

// --- API 엔드포인트 설계 ---

// 로그인 API
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    if (username === 'admin' && password === '1234') {
        res.json({ success: true, user: { ...users['admin'], id: 'admin' } });
    } else {
        res.status(401).json({ success: false, message: '아이디 또는 비밀번호가 올바르지 않습니다.' });
    }
});

// 게시글 조회 API (필터링 기능 포함)
app.get('/api/posts', (req, res) => {
    const schoolFilter = req.query.school;
    if (schoolFilter) {
        // 특정 학교 게시글만 필터링
        return res.json(posts.filter(p => p.school === schoolFilter));
    }
    res.json(posts); // 글로벌 피드 (전체 게시글)
});

// 게시글 작성 API
app.post('/api/posts', (req, res) => {
    const { title, content, writer, school, category } = req.body;
    const newPost = { id: posts.length + 1, title, content, writer, school, category: category || '자유', date: '방금 전', views: 0 };
    posts.unshift(newPost);
    res.json({ success: true });
});

// 기업 정보 조회 API
app.get('/api/companies', (req, res) => res.json(companies));

// 메시지 관리 API
app.get('/api/messages', (req, res) => res.json(messages));
app.post('/api/messages', (req, res) => {
    const { from, to, content } = req.body;
    const newMessage = { from, to, content, time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }) };
    messages.push(newMessage);
    res.json({ success: true, message: newMessage });
});

// AI 챗봇 API
app.post('/api/ai/chat', (req, res) => {
    const { message } = req.body;
    let response = "죄송합니다. 해당 질문은 잘 이해하지 못했습니다. 학교 생활이나 코딩에 대해 질문해 주시기 바랍니다.";
    if (message.includes("안녕")) response = "반갑습니다! 저는 스민사이드의 AI 도우미 스민봇입니다. 무엇을 도와드릴까요?";
    else if (message.includes("대덕")) response = "대덕소프트웨어마이스터고등학교는 현재 13기 신입생들을 맞이할 준비를 하고 있습니다.";
    res.json({ response });
});

app.get('/api/schools', (req, res) => res.json(schoolInfo));

// 서버 구동
app.listen(PORT, () => console.log(`[SYSTEM] Sminside Server is running on http://localhost:${PORT}`));