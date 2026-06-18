/**
 * Sminside (스민사이드) - 프론트엔드 통합 컨트롤러
 * 
 * [Engineer's Note: State Management]
 * 이 스크립트는 브라우저의 sessionStorage를 활용하여 세션 유지 관리 기능을 수행합니다.
 * 또한 싱글 페이지(SPA)와 멀티 페이지(MPA)의 하이브리드 구조를 지원하기 위해 최적화되었습니다.
 */

// 전역 상태 변수
let currentUser = JSON.parse(sessionStorage.getItem('sminside_user')) || null;
let allPosts = [];

// --- [초기화 시퀀스] ---
window.onload = () => {
    createStars();          // 시각적 레이어 생성
    initScrollEffects();    // 내비게이션 동적 반응 설정
    initParallax();         // 마우스 추적 인터랙션 활성화
    initRevealObserver();   // 스크롤 리빌 애니메이션 엔진 구동
    
    // 세션 유지 확인 및 UI 동기화
    if (currentUser) {
        updateAuthUI();
    }

    // 현재 페이지가 메인 허브인 경우 학교 목록 및 피드 로드
    if (document.getElementById('school-list')) loadSchools();
    if (document.getElementById('post-list')) {
        // 학교별 페이지인 경우 data-school 속성을 체크할 수 있도록 설계
        const schoolContext = document.body.getAttribute('data-school');
        loadPosts(schoolContext || '');
    }
};

// --- [시각 시스템: Visual Engine] ---

/**
 * 동적 별빛 생성 시스템
 * 발표용 팁: 성능 최적화를 위해 Canvas 대신 DOM 요소를 제한적으로 사용함
 */
function createStars() {
    const container = document.getElementById('stars');
    if (!container) return;
    for (let i = 0; i < 100; i++) {
        const star = document.createElement('div');
        const size = Math.random() * 1.5;
        star.style.cssText = `
            position: absolute; left: ${Math.random() * 100}%; top: ${Math.random() * 100}%;
            width: ${size}px; height: ${size}px; background: #fff;
            opacity: ${Math.random() * 0.5}; border-radius: 50%;
            animation: twinkle ${Math.random() * 5 + 2}s infinite ease-in-out;
        `;
        container.appendChild(star);
    }
}

function initScrollEffects() {
    const nav = document.getElementById('navbar');
    window.addEventListener('scroll', () => {
        // [Engineer's Choice] 40px 스크롤 시 유리 질감(Blur) 효과 극대화
        nav.classList.toggle('scrolled', window.scrollY > 40);
    });
}

function initParallax() {
    const nebulas = document.querySelectorAll('.nebula');
    document.addEventListener('mousemove', (e) => {
        const x = (e.clientX - window.innerWidth / 2) / 40;
        const y = (e.clientY - window.innerHeight / 2) / 40;
        nebulas.forEach((n, i) => {
            n.style.transform = `translate(${x * (i + 1)}px, ${y * (i + 1)}px)`;
        });
    });
}

function initRevealObserver() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                entry.target.style.filter = 'blur(0)';
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.glass-card, h1, h2').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(25px)';
        el.style.filter = 'blur(10px)';
        el.style.transition = 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)';
        observer.observe(el);
    });
}

// --- [인증 및 보안 시스템: Auth Engine] ---

function updateAuthUI() {
    const navLogin = document.getElementById('nav-login');
    const navMypage = document.getElementById('nav-mypage');
    if (navLogin) navLogin.style.display = 'none';
    if (navMypage) navMypage.style.display = 'block';

    // 마이페이지 정보 업데이트 (존재하는 경우)
    const userNameEl = document.getElementById('user-name');
    if (userNameEl) {
        userNameEl.innerText = currentUser.name;
        document.getElementById('user-bio').innerText = currentUser.bio;
        document.getElementById('user-followers').innerText = currentUser.followers;
        document.getElementById('user-following').innerText = currentUser.following;
    }
}

async function handleLogin() {
    const id = document.getElementById('login-id').value;
    const pw = document.getElementById('login-pw').value;
    
    const res = await fetch('/api/login', { 
        method:'POST', headers:{'Content-Type':'application/json'}, 
        body:JSON.stringify({username: id, password: pw}) 
    });
    
    if (res.ok) {
        const result = await res.json();
        currentUser = result.user;
        // 세션 영구 저장을 통해 페이지 이동 시 로그인 유지
        sessionStorage.setItem('sminside_user', JSON.stringify(currentUser));
        updateAuthUI();
        showSection('home');
    } else {
        alert('로그인 정보가 올바르지 않습니다.');
    }
}

function handleLogout() {
    sessionStorage.removeItem('sminside_user');
    currentUser = null;
    location.href = 'index.html'; // 로그아웃 시 메인으로 이동하여 상태 초기화
}

// --- [비즈니스 로직: Functional Logic] ---

async function loadSchools() {
    const res = await fetch('/api/schools');
    const schools = await res.json();
    const container = document.getElementById('school-list');
    if (!container) return;
    container.innerHTML = '';

    const colors = { '대덕': 'var(--accent-indigo)', '대구': 'var(--accent-violet)', '광주': 'var(--accent-emerald)', '부산': 'var(--accent-rose)' };
    const pages = { '대덕': 'daedeok.html', '대구': 'daegu.html', '광주': 'gwangju.html', '부산': 'busan.html' };

    Object.keys(schools).forEach(key => {
        const s = schools[key];
        const card = document.createElement('div');
        card.className = 'glass-card';
        card.style.cursor = 'pointer';
        card.innerHTML = `
            <div class="company-tag">${key}</div>
            <h3 style="color:${colors[key]}; margin-bottom:1rem;">${s.name}</h3>
            <p style="font-size:0.9rem; color:var(--text-mid);">공간 입장하기 &rarr;</p>
        `;
        card.onclick = () => location.href = pages[key];
        container.appendChild(card);
    });
}

async function loadPosts(school = '') {
    const url = school ? `/api/posts?school=${school}` : '/api/posts';
    const res = await fetch(url);
    allPosts = await res.json();
    const container = document.getElementById('post-list');
    if (!container) return;
    container.innerHTML = '';
    
    allPosts.forEach((p, i) => {
        const row = document.createElement('div');
        row.className = 'glass-card post-row-hover';
        row.style.marginBottom = '1.5rem';
        row.style.animation = `entrance 0.5s ease-out ${i * 0.05}s forwards`;
        row.style.opacity = '0';
        row.innerHTML = `
            <div style="display:flex; justify-content:space-between; margin-bottom:1rem;">
                <span class="company-tag">${p.school}</span>
                <span style="font-weight:800; color:var(--accent-indigo)">@${p.writer}</span>
            </div>
            <h3>${p.title}</h3>
            <p style="color:var(--text-mid); margin-top:0.5rem;">${p.content}</p>
        `;
        row.onclick = () => openPost(p.id);
        container.appendChild(row);
    });
}

async function loadCompanies() {
    const res = await fetch('/api/companies');
    const companies = await res.json();
    const container = document.querySelector('.company-grid');
    if (!container) return;
    container.innerHTML = '';

    companies.forEach(c => {
        const card = document.createElement('div');
        card.className = 'glass-card';
        card.innerHTML = `
            <div style="display:flex; justify-content:space-between; margin-bottom:1.5rem;">
                <div style="width:50px; height:50px; background:rgba(255,255,255,0.1); border-radius:12px; display:flex; align-items:center; justify-content:center; font-weight:900;">${c.logo}</div>
                <span class="company-tag">${c.industry}</span>
            </div>
            <h3>${c.name}</h3>
            <p style="font-size:0.85rem; color:var(--accent-emerald); margin:0.5rem 0;">📍 ${c.location}</p>
            <p style="font-size:0.9rem; color:var(--text-mid);">${c.desc}</p>
            <button class="btn btn-primary" style="width:100%; margin-top:1.5rem;" onclick="location.href='appeal.html?company=${c.name}'">나를 어필하기</button>
        `;
        container.appendChild(card);
    });
}

// --- [글쓰기 엔진 최적화: Writing Engine] ---

function checkLoginForWrite() { 
    if (!currentUser) {
        alert('로그인이 필요한 서비스입니다.');
        // 학교 페이지인 경우 index.html의 로그인 섹션으로 리다이렉트
        if (!document.getElementById('login')) {
            location.href = 'index.html?action=login';
        } else {
            showSection('login');
        }
    } else {
        // 메인 허브인 경우 섹션 이동, 학교 페이지인 경우 글쓰기 전용 페이지로 이동(또는 모달)
        if (document.getElementById('write')) {
            showSection('write');
        } else {
            // 학교별 페이지에서는 간소화된 글쓰기 모달이나 통합 허브로 유도
            location.href = 'index.html?action=write&school=' + document.body.getAttribute('data-school');
        }
    }
}

async function submitPost() {
    const title = document.getElementById('post-title').value;
    const content = document.getElementById('post-content').value;
    
    if (!title || !content) return alert('모든 필드를 입력해 주세요.');

    const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            title, content, 
            writer: currentUser.name, 
            school: currentUser.school 
        })
    });

    if (res.ok) {
        alert('글이 성공적으로 게시되었습니다.');
        location.href = 'index.html'; // 메인 피드로 이동하여 확인
    }
}

// --- [메시징 및 AI 도우미] ---

function toggleAIChat() {
    const modal = document.getElementById('ai-modal');
    modal.style.display = modal.style.display === 'flex' ? 'none' : 'flex';
}

async function sendAIQuestion() {
    const input = document.getElementById('ai-input');
    const msg = input.value.trim();
    if (!msg) return;

    const container = document.getElementById('ai-messages');
    container.innerHTML += `<div style="align-self:flex-end; background:var(--accent-indigo); padding:0.8rem; border-radius:12px;">${msg}</div>`;
    input.value = '';

    const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg })
    });

    if (res.ok) {
        const data = await res.json();
        container.innerHTML += `<div style="align-self:flex-start; background:rgba(255,255,255,0.1); padding:0.8rem; border-radius:12px;">${data.response}</div>`;
    }
    container.scrollTop = container.scrollHeight;
}

// 공용 상세보기 모달
function openPost(id) {
    const post = allPosts.find(p => p.id === id);
    if (!post) return;
    document.getElementById('modal-title').innerText = post.title;
    document.getElementById('modal-meta').innerText = `${post.writer} (${post.school}) | ${post.date}`;
    document.getElementById('modal-content').innerText = post.content;
    document.getElementById('post-modal').style.display = 'flex';
}

function closeModal() { document.getElementById('post-modal').style.display = 'none'; }

// SPA 섹션 관리 시스템
function showSection(id) {
    document.querySelectorAll('section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-links li').forEach(l => l.classList.remove('active'));
    
    const target = document.getElementById(id);
    if (target) target.classList.add('active');
    
    const navItem = document.getElementById(`li-${id}`);
    if (navItem) navItem.classList.add('active');
    
    if (id === 'community') loadPosts();
    if (id === 'companies') loadCompanies();
    if (id === 'messages') {
        if (!currentUser) {
            document.getElementById('message-lock').style.display = 'block';
            document.getElementById('message-ui').style.display = 'none';
        } else {
            document.getElementById('message-lock').style.display = 'none';
            document.getElementById('message-ui').style.display = 'flex';
            loadMessages();
        }
    }
}

async function loadMessages() {
    const res = await fetch('/api/messages');
    const msgs = await res.json();
    const container = document.getElementById('message-container');
    container.innerHTML = '';
    msgs.forEach(m => {
        const isMe = m.from === (currentUser ? currentUser.name : '');
        container.innerHTML += `<div style="margin-bottom:1rem; display:flex; flex-direction:column; align-items:${isMe?'flex-end':'flex-start'}">
            <div style="background:${isMe?'var(--accent-indigo)':'rgba(255,255,255,0.1)'}; padding:0.8rem 1.2rem; border-radius:18px; max-width:70%;">${m.content}</div>
        </div>`;
    });
}