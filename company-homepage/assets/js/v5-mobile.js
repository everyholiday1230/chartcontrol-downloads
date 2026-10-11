/* =========================================================
   BEOMONNURI — MOBILE NAV (hamburger + fullscreen menu)
   ========================================================= */

(() => {
  const initMobileNav = () => {
    const nav = document.querySelector('nav.top');
    if (!nav) return;
    // Avoid double-init
    if (nav.dataset.mobileInit) return;
    nav.dataset.mobileInit = '1';

    // Detect current active link from existing nav (so we can mirror it in mobile menu)
    const existingActive = nav.querySelector('.nav-links a.active');
    const activeHref = existingActive ? existingActive.getAttribute('href') : null;
    // 메뉴 링크는 루트 절대경로(/x.html)를 쓰고, 기존 nav는 상대경로(x.html)를 쓰므로
    // 선행 슬래시를 제거해 비교한다. (404.html처럼 임의 경로에서 렌더될 때도
    // 메뉴 링크가 깨지지 않도록 절대경로를 사용한다.)
    const normHref = (h) => (h || '').replace(/^\//, '');
    const isActive = (href) => normHref(activeHref) === normHref(href) ? ' class="active"' : '';

    // Build hamburger button
    const hamburger = document.createElement('button');
    hamburger.className = 'nav-hamburger';
    hamburger.setAttribute('aria-label', 'Toggle navigation menu');
    hamburger.setAttribute('aria-expanded', 'false');
    hamburger.innerHTML = `<span class="bars">
      <span></span><span></span><span></span>
    </span>`;
    // Insert into nav row (after .nav-links so it sits at the right)
    const navRow = nav.querySelector('.row');
    navRow.appendChild(hamburger);

    // Build fullscreen mobile menu — mirrors the desktop nav 1:1
    // (Home / Products + its 3 sub-links / Why / Contact) so mobile users
    // reach the exact same destinations as desktop users.
    const menu = document.createElement('aside');
    menu.className = 'mobile-menu';
    menu.setAttribute('aria-hidden', 'true');
    menu.innerHTML = `
      <div class="mobile-menu-inner">
        <div class="mobile-menu-label">BEOMONNURI · MENU</div>
        <nav aria-label="Mobile primary">
          <a href="/"${isActive('/')}>
            <span>HOME</span><span class="num">01</span>
          </a>
          <a href="/products"${isActive('/products')}>
            <span>PRODUCTS</span><span class="num">02</span>
          </a>
          <a href="/products-private" class="sub"${isActive('/products-private')}>
            <span>· 범온 프라이빗 AI</span><span class="num">02-1</span>
          </a>
          <a href="/products-agent" class="sub"${isActive('/products-agent')}>
            <span>· 범온 에이전트 AI</span><span class="num">02-2</span>
          </a>
          <!-- TEMP-HIDDEN(SUPERCHART / 2026-08-04): 재노출 시 아래 블록 주석 해제 + 외주·MVP 번호를 02-4로 되돌릴 것
          <a href="/products-superchart" class="sub"${isActive('/products-superchart')}>
            <span>· 범온 슈퍼차트 AI</span><span class="num">02-3</span>
          </a>
          -->
          <a href="/services-outsourcing" class="sub"${isActive('/services-outsourcing')}>
            <span>· 외주·MVP 제작</span><span class="num">02-3</span>
          </a>
          <a href="/why"${isActive('/why')}>
            <span>WHY</span><span class="num">03</span>
          </a>
          <a href="/contact"${isActive('/contact')}>
            <span>CONTACT</span><span class="num">04</span>
          </a>
        </nav>
        <div class="cta-row">
          <a href="/contact">
            <span>도입 진단 신청</span>
            <span>→</span>
          </a>
        </div>
        <div class="meta-row">
          <span class="live">SYSTEM LIVE · KR-PRIVATE · STATUS</span>
          <span>© 2026 BEOMONNURI INNOVATION · v2.6</span>
        </div>
      </div>
    `;
    document.body.appendChild(menu);

    // Toggle logic
    const open = () => {
      document.body.classList.add('nav-open');
      hamburger.setAttribute('aria-expanded', 'true');
      menu.setAttribute('aria-hidden', 'false');
    };
    const close = () => {
      document.body.classList.remove('nav-open');
      hamburger.setAttribute('aria-expanded', 'false');
      menu.setAttribute('aria-hidden', 'true');
    };
    const toggle = () => {
      document.body.classList.contains('nav-open') ? close() : open();
    };

    hamburger.addEventListener('click', toggle);

    // Close on nav link click (single-page apps would need slight delay before navigation)
    menu.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        // Let the navigation happen — close just before
        close();
      });
    });

    // Close on Escape
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && document.body.classList.contains('nav-open')) close();
    });

    // Close when resizing back to desktop
    let resizeTimer;
    addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (innerWidth > 900 && document.body.classList.contains('nav-open')) close();
      }, 150);
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMobileNav);
  } else {
    initMobileNav();
  }
})();


/* =========================================================
   BEOMONNURI — MOBILE BOTTOM TAB BAR (2026-09-21 리디자인)
   홈 / 제품 / Why / 문의 — 모바일에서 4개 목적지를
   한 탭에 닿게 한다. 데스크톱(>900px)에서는 CSS 로 숨긴다.
   ========================================================= */
(() => {
  const build = () => {
    if (document.querySelector('.bn-tabbar')) return;
    const path = location.pathname.replace(/\.html$/, '') || '/';
    const norm = (h) => (h || '').replace(/\.html$/, '').replace(/\/$/, '') || '/';
    const tabs = [
      { href: '/', label: '홈', match: (u) => u === '/', icon: '<span class="bn-tb bn-tb-home"></span>' },
      { href: '/products', label: '제품', match: (u) => u.startsWith('/products'), icon: '<span class="bn-tb bn-tb-grid"></span>' },
      { href: '/why', label: 'Why', match: (u) => u === '/why', icon: '<span class="bn-tb bn-tb-dot"></span>' },
      { href: '/contact', label: '문의', match: (u) => u === '/contact', icon: '<span class="bn-tb bn-tb-cta"></span>', cta: true },
    ];
    const bar = document.createElement('nav');
    bar.className = 'bn-tabbar';
    bar.setAttribute('aria-label', '모바일 하단 내비게이션');
    bar.innerHTML = tabs.map(t => {
      const on = t.match(norm(path));
      return `<a href="${t.href}" class="${on ? 'on' : ''}${t.cta ? ' cta' : ''}"${on ? ' aria-current="page"' : ''}>${t.icon}<span>${t.label}</span></a>`;
    }).join('');
    document.body.appendChild(bar);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', build);
  } else {
    build();
  }
})();
