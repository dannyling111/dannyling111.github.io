(() => {
  const { CATEGORIES, INSTRUCTORS, COURSES } = window.VELORA;
  const app = document.getElementById("app");
  const KEY = "velora-gh-v1";

  const icons = {
    search: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3-3"/></svg>',
    menu: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6h16M4 12h16M4 18h16"/></svg>',
    heart: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z"/></svg>',
    cart: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6"/></svg>',
    play: '<svg class="icon-sm" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>',
    check: '<svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>',
  };

  function esc(s) {
    return String(s ?? "").replace(/[&<>"']/g, (c) => "&#" + c.charCodeAt(0) + ";");
  }
  function formatPrice(v) { return v <= 0 ? "免费" : `¥${v.toLocaleString("zh-CN")}`; }
  function formatCount(n) {
    if (n >= 10000) return `${(n / 10000).toFixed(n >= 100000 ? 0 : 1)} 万`;
    return n.toLocaleString("zh-CN");
  }
  function formatDuration(sec) {
    const h = Math.floor(sec / 3600);
    const m = Math.round((sec % 3600) / 60);
    if (h <= 0) return `${m} 分钟`;
    if (m === 0) return `${h} 小时`;
    return `${h} 小时 ${m} 分钟`;
  }
  function formatClock(sec) {
    const s = Math.max(0, Math.floor(sec));
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const r = s % 60;
    const pad = (n) => String(n).padStart(2, "0");
    return h > 0 ? `${h}:${pad(m)}:${pad(r)}` : `${m}:${pad(r)}`;
  }
  function instructor(id) { return INSTRUCTORS.find((i) => i.id === id); }
  function catName(id) { return CATEGORIES.find((c) => c.id === id)?.name ?? id; }
  function flatten(c) { return c.sections.flatMap((s) => s.lectures); }
  function duration(c) { return flatten(c).reduce((s, l) => s + l.durationSec, 0); }
  function firstLecture(c) { return flatten(c)[0]; }
  function findLecture(c, id) { return flatten(c).find((l) => l.id === id); }
  function nextLecture(c, id) {
    const all = flatten(c);
    const i = all.findIndex((l) => l.id === id);
    return i >= 0 ? all[i + 1] : undefined;
  }
  function progressPercent(c, progress) {
    const all = flatten(c);
    if (!all.length) return 0;
    return Math.round((all.filter((l) => progress[l.id]?.completed).length / all.length) * 100);
  }
  function stars(v, count) {
    const full = "★".repeat(Math.round(v));
    const empty = "☆".repeat(5 - Math.round(v));
    return `<span class="stars">${full}${empty} ${v.toFixed(1)}${count != null ? ` <span class="count">(${formatCount(count)})</span>` : ""}</span>`;
  }
  function chips(c) {
    return `<div class="chips">${c.bestseller ? '<span class="chip chip-best">畅销课程</span>' : ""}${c.hot ? '<span class="chip chip-hot">热播</span>' : ""}${c.newest ? '<span class="chip chip-new">新上架</span>' : ""}</div>`;
  }

  function loadStore() {
    try {
      return { cart: [], wishlist: [], enrolled: [], progress: {}, notes: {}, ...JSON.parse(localStorage.getItem(KEY) || "{}") };
    } catch {
      return { cart: [], wishlist: [], enrolled: [], progress: {}, notes: {} };
    }
  }
  let store = loadStore();
  function save() { localStorage.setItem(KEY, JSON.stringify(store)); }
  function toast(msg) {
    document.querySelector(".toast")?.remove();
    const el = document.createElement("div");
    el.className = "toast";
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2200);
  }

  function go(path) {
    const p = path.startsWith("#") ? path : `#${path.startsWith("/") ? path : "/" + path}`;
    if (location.hash === p) render();
    else location.hash = p;
  }
  function parse() {
    const raw = (location.hash || "#/").replace(/^#/, "") || "/";
    const [path, qs] = raw.split("?");
    const parts = path.replace(/^\//, "").split("/").filter(Boolean);
    return { parts, q: new URLSearchParams(qs || "") };
  }

  function courseCard(c) {
    const inst = instructor(c.instructorId);
    return `<a class="card" href="#/course/${esc(c.slug)}">
      <div class="thumb"><img src="${esc(c.cover)}" alt="${esc(c.title)}"/><div class="play"><span>${icons.play}</span></div></div>
      <h3>${esc(c.title)}</h3>
      <p class="meta">${esc(inst?.name || "")}</p>
      ${stars(c.rating, c.ratingCount)}
      <p class="meta">${formatDuration(duration(c))} · ${flatten(c).length} 讲</p>
      <p class="price"><span class="now">${formatPrice(c.price)}</span>${c.originalPrice && c.price > 0 ? `<span class="was">${formatPrice(c.originalPrice)}</span>` : ""}</p>
      ${chips(c)}
    </a>`;
  }

  function searchBox(id, compact) {
    return `<div class="search ${compact ? "w-full" : ""}" id="${id}">
      <form data-search>
        <input name="q" placeholder="搜索短剧、导演、题材…" aria-label="搜索" autocomplete="off"/>
        <button type="submit" aria-label="搜索">${icons.search}</button>
      </form>
      <div class="search-hits hidden"></div>
    </div>`;
  }

  function header() {
    return `<header class="header">
      <div class="wrap header-row">
        <button class="icon-btn menu-btn" data-open-drawer aria-label="菜单">${icons.menu}</button>
        <a class="logo" href="#/" aria-label="Velora 映堂">
          <span class="logo-mark"><svg viewBox="0 0 12 12"><path d="M3 1.8v8.4L10.4 6 3 1.8Z"/></svg></span>
          <span class="logo-word">Velora</span>
        </a>
        <div class="dropdown" data-drop>
          <button class="explore-btn" data-drop-btn>探索</button>
          <div class="dropdown-panel">
            <div class="dropdown-label">短剧分类</div>
            ${CATEGORIES.map((c) => `<a href="#/category/${c.id}"><strong>${esc(c.name)}</strong><span class="dropdown-blurb">${esc(c.blurb)}</span></a>`).join("")}
            <div class="hr"></div>
            <a href="#/courses">浏览全部短剧</a>
          </div>
        </div>
        ${searchBox("hdr-search")}
        <nav class="nav-desk">
          <a href="#/my-learning">我的学习</a>
          <a href="#/studio">在 Velora 开课</a>
        </nav>
        <button class="icon-btn search-toggle" data-toggle-search aria-label="搜索">${icons.search}</button>
        <a class="icon-btn" href="#/wishlist" aria-label="心愿单">${icons.heart}${store.wishlist.length ? `<span class="badge-dot">${store.wishlist.length}</span>` : ""}</a>
        <a class="icon-btn" href="#/cart" aria-label="购物车">${icons.cart}${store.cart.length ? `<span class="badge-dot">${store.cart.length}</span>` : ""}</a>
        <div class="dropdown" data-drop>
          <button class="avatar-btn" data-drop-btn>你</button>
          <div class="dropdown-panel right">
            <a href="#/my-learning">我的学习</a>
            <a href="#/wishlist">心愿单</a>
            <a href="#/cart">购物车</a>
            <a href="#/studio">在 Velora 开课</a>
          </div>
        </div>
      </div>
      <div class="mobile-search" id="mobile-search">${searchBox("mob-search", true)}</div>
    </header>
    <div class="drawer" id="drawer">
      <div class="drawer-bg" data-close-drawer></div>
      <div class="drawer-panel">
        <a class="logo" href="#/"><span class="logo-mark"><svg viewBox="0 0 12 12"><path d="M3 1.8v8.4L10.4 6 3 1.8Z"/></svg></span><span class="logo-word">Velora</span></a>
        <nav class="mt-6">
          <p class="label">探索</p>
          ${CATEGORIES.map((c) => `<a href="#/category/${c.id}">${esc(c.name)}</a>`).join("")}
          <div class="hr"></div>
          <a href="#/my-learning">我的学习</a>
          <a href="#/studio">在 Velora 开课</a>
        </nav>
      </div>
    </div>`;
  }

  function footer() {
    return `<footer class="footer"><div class="wrap row">
      <p>VELORA 映堂 · 把一部短剧，当成一门课来看完</p>
      <p>演示结算无需付款 · 进度保存在本机</p>
    </div></footer>`;
  }

  function shell(body) { return header() + body + footer(); }

  function home() {
    const featured = COURSES.filter((c) => c.poster);
    const popular = [...COURSES].sort((a, b) => b.students - a.students).slice(0, 10);
    const urban = COURSES.filter((c) => c.category === "urban");
    const newest = COURSES.filter((c) => c.newest || c.hot);
    return shell(`
      <section class="hero">
        <video autoplay muted loop playsinline poster="hero.jpg">
          <source src="video/hero.mp4" type="video/mp4"/>
        </video>
        <div class="hero-shade"></div>
        <div class="wrap hero-inner">
          <p class="kicker">VELORA 映堂</p>
          <h1>把一部短剧，当成一门课来看完</h1>
          <p class="lead">正片、分镜、表演与摄影精讲。稍后可用 Drama Engine 生成的成片直接接入播放。</p>
          <form class="hero-search" data-hero-search>
            <input name="q" placeholder="今天想看什么？"/>
            <button type="submit" aria-label="搜索">${icons.search}</button>
          </form>
        </div>
      </section>
      <div class="catbar"><div class="wrap catbar-row">
        ${CATEGORIES.map((c) => `<a href="#/category/${c.id}">${esc(c.name)}</a>`).join("")}
      </div></div>
      <section class="section"><div class="wrap">
        <h2>剧场海报</h2>
        <div class="carousel">${featured.map(courseCard).join("")}</div>
      </div></section>
      <section class="section" style="background:var(--surface)"><div class="wrap">
        <h2>最多人在看</h2>
        <div class="carousel">${popular.map(courseCard).join("")}</div>
      </div></section>
      <section class="section"><div class="wrap">
        <h2>都市情感</h2>
        <div class="carousel">${urban.map(courseCard).join("")}</div>
      </div></section>
      <section class="section" style="background:var(--surface)"><div class="wrap">
        <h2>新上架 / 热播</h2>
        <div class="carousel">${newest.map(courseCard).join("")}</div>
      </div></section>`);
  }

  function filterList(list, q) {
    let out = [...list];
    const text = (q.get("q") || "").trim().toLowerCase();
    const cat = q.get("cat") || "";
    const price = q.get("price") || "";
    const sort = q.get("sort") || "pop";
    if (text) {
      out = out.filter((c) => `${c.title}${c.subtitle}${c.tags.join("")}${instructor(c.instructorId)?.name || ""}`.toLowerCase().includes(text));
    }
    if (cat) out = out.filter((c) => c.category === cat);
    if (price === "free") out = out.filter((c) => c.price <= 0);
    if (price === "paid") out = out.filter((c) => c.price > 0);
    if (sort === "pop") out.sort((a, b) => b.students - a.students);
    if (sort === "rate") out.sort((a, b) => b.rating - a.rating);
    if (sort === "new") out.sort((a, b) => b.lastUpdated.localeCompare(a.lastUpdated));
    if (sort === "price") out.sort((a, b) => a.price - b.price);
    return out;
  }

  function catalog(title, blurb, q, basePath) {
    const list = filterList(COURSES, q);
    const cat = q.get("cat") || "";
    const price = q.get("price") || "";
    const sort = q.get("sort") || "pop";
    const query = q.get("q") || "";
    function link(extra) {
      const n = new URLSearchParams(q);
      Object.entries(extra).forEach(([k, v]) => (v ? n.set(k, v) : n.delete(k)));
      const s = n.toString();
      return `#${basePath}${s ? "?" + s : ""}`;
    }
    return shell(`
      <div class="page-head"><div class="wrap">
        <h1>${esc(title)}</h1>
        <p>${esc(blurb)}${query ? ` · 搜索「${esc(query)}」` : ""} · ${list.length} 部</p>
      </div></div>
      <div class="wrap" style="padding-bottom:64px">
        <div class="filters">
          ${CATEGORIES.map((c) => `<a class="pill" style="height:36px;display:inline-flex;align-items:center;border:1px solid var(--border);border-radius:999px;padding:0 12px;font-size:13px;background:${cat===c.id?"var(--dark)":"#fff"};color:${cat===c.id?"#fff":"var(--fg)"}" href="#/category/${c.id}">${esc(c.name)}</a>`).join("")}
          <a class="pill" style="height:36px;display:inline-flex;align-items:center;border:1px solid var(--border);border-radius:999px;padding:0 12px;font-size:13px;background:${price==="free"?"var(--dark)":"#fff"};color:${price==="free"?"#fff":"inherit"}" href="${link({ price: price==="free"?"":"free" })}">免费</a>
          <select data-sort>
            <option value="pop" ${sort==="pop"?"selected":""}>最多学员</option>
            <option value="rate" ${sort==="rate"?"selected":""}>评分最高</option>
            <option value="new" ${sort==="new"?"selected":""}>最新上架</option>
            <option value="price" ${sort==="price"?"selected":""}>价格从低到高</option>
          </select>
        </div>
        <div class="list-wide">
          ${list.length ? list.map((c) => {
            const inst = instructor(c.instructorId);
            return `<a class="wide" href="#/course/${esc(c.slug)}">
              <img src="${esc(c.cover)}" alt=""/>
              <div>
                <h3>${esc(c.title)}</h3>
                <p class="sub">${esc(c.subtitle)}</p>
                <p class="meta mt-2">${esc(inst?.name || "")} · ${catName(c.category)}</p>
                ${stars(c.rating, c.ratingCount)}
                <p class="price mt-2"><span class="now">${formatPrice(c.price)}</span>${c.originalPrice && c.price>0 ? `<span class="was">${formatPrice(c.originalPrice)}</span>`:""}</p>
                ${chips(c)}
              </div>
            </a>`;
          }).join("") : `<div class="empty">没有找到符合条件的短剧。</div>`}
        </div>
      </div>`);
  }

  function coursePage(slug) {
    const c = COURSES.find((x) => x.slug === slug);
    if (!c) return shell(`<div class="wrap empty">找不到这部短剧。</div>`);
    const inst = instructor(c.instructorId);
    const enrolled = store.enrolled.includes(c.id);
    const inCart = store.cart.includes(c.id);
    const wished = store.wishlist.includes(c.id);
    const preview = firstLecture(c);
    const related = COURSES.filter((x) => x.category === c.category && x.id !== c.id).slice(0, 5);
    return shell(`
      <div class="course-hero"><div class="wrap course-hero-grid">
        <div>
          <p class="crumb">${esc(catName(c.category))} / ${esc(c.tags[0] || "")}</p>
          <h1>${esc(c.title)}</h1>
          <p class="sub">${esc(c.subtitle)}</p>
          <div class="stat-row">${chips(c)}${stars(c.rating, c.ratingCount)}<span>${formatCount(c.students)} 名学员</span></div>
          <p class="mt-3" style="font-size:14px">创作者 <a href="#/instructor/${esc(c.instructorId)}" style="font-weight:800;text-decoration:underline">${esc(inst?.name || "")}</a> · 更新于 ${esc(c.lastUpdated)}</p>
        </div>
      </div></div>
      <div class="wrap course-body">
        <div>
          <section class="box">
            <h2>你将学到</h2>
            <ul class="learn-grid plain">${c.whatYouLearn.map((i) => `<li>${icons.check}<span>${esc(i)}</span></li>`).join("")}</ul>
          </section>
          <section class="mt-6">
            <h2 class="mb-2">课程内容</h2>
            <p class="meta mb-2">${flatten(c).length} 讲 · ${formatDuration(duration(c))}</p>
            <div class="curriculum">${c.sections.map((s) => `<details open>
              <summary><span>${esc(s.title)}</span><span class="meta">${s.lectures.length} 讲</span></summary>
              ${s.lectures.map((l) => {
                const locked = !enrolled && !l.isPreview;
                const href = locked ? "#/course/" + c.slug : `#/learn/${c.id}/${l.id}`;
                return `<a class="lecture ${locked ? "locked" : ""}" href="${href}">
                  ${icons.play}<span>${esc(l.title)}</span>
                  ${l.isPreview ? '<span class="preview-tag">试看</span>' : ""}
                  <span class="dur">${formatClock(l.durationSec)}</span>
                </a>`;
              }).join("")}
            </details>`).join("")}</div>
          </section>
          <section class="mt-6">
            <h2 class="mb-2">这部短剧</h2>
            <p class="prose">${esc(c.description)}</p>
          </section>
          ${inst ? `<section class="mt-6">
            <h2 class="mb-4">创作者</h2>
            <a class="inst-hero" href="#/instructor/${inst.id}">
              <img src="${esc(inst.avatar)}" alt="${esc(inst.name)}"/>
              <div>
                <p style="font-weight:800;color:var(--link)">${esc(inst.name)}</p>
                <p class="meta">${esc(inst.title)}</p>
                <p class="prose mt-2">${esc(inst.bio)}</p>
              </div>
            </a>
          </section>` : ""}
          <section class="mt-6">
            <h2 class="mb-4">学员评价</h2>
            ${c.reviews.map((r) => `<article class="review">
              <p class="who">${esc(r.userName)}</p>
              <p class="when">${esc(r.date)} · ${"★".repeat(r.rating)}</p>
              <p>${esc(r.content)}</p>
            </article>`).join("")}
          </section>
          ${related.length ? `<section class="mt-6"><h2 class="mb-4">同类短剧</h2><div class="carousel">${related.map(courseCard).join("")}</div></section>` : ""}
        </div>
        <aside>
          <div class="buy-card">
            <img class="cover" src="${esc(c.poster || c.cover)}" alt="${esc(c.title)}"/>
            <div class="pad stack">
              <p class="price"><span class="now" style="font-size:28px">${formatPrice(c.price)}</span>${c.originalPrice && c.price>0 ? `<span class="was">${formatPrice(c.originalPrice)}</span>`:""}</p>
              ${enrolled
                ? `<a class="btn btn-primary" href="#/learn/${c.id}/${preview.id}">继续学习</a>`
                : c.price === 0
                  ? `<button class="btn btn-primary" data-enroll="${c.id}">免费报名</button>`
                  : inCart
                    ? `<a class="btn btn-primary" href="#/cart">去购物车结算</a>`
                    : `<button class="btn btn-primary" data-cart="${c.id}">加入购物车</button>`}
              ${preview ? `<a class="btn btn-ghost" href="#/learn/${c.id}/${preview.id}">试看第一集</a>` : ""}
              <button class="btn btn-ghost" data-wish="${c.id}">${wished ? "已加入心愿单" : "加入心愿单"}</button>
              <p class="meta">${c.includes.join(" · ")}</p>
            </div>
          </div>
        </aside>
      </div>`);
  }

  function instructorPage(id) {
    const inst = instructor(id);
    if (!inst) return shell(`<div class="wrap empty">找不到这位创作者。</div>`);
    const list = COURSES.filter((c) => c.instructorId === id);
    return shell(`
      <div class="page-head"><div class="wrap inst-hero">
        <img src="${esc(inst.avatar)}" alt="${esc(inst.name)}"/>
        <div>
          <h1>${esc(inst.name)}</h1>
          <p>${esc(inst.title)}</p>
          <p class="mt-2" style="color:#ddd">${esc(inst.bio)}</p>
          <p class="mt-3">${stars(inst.rating)} · ${formatCount(inst.students)} 名学员 · ${list.length} 部短剧</p>
        </div>
      </div></div>
      <div class="wrap section"><div class="carousel">${list.map(courseCard).join("")}</div></div>`);
  }

  function cartPage() {
    const items = store.cart.map((id) => COURSES.find((c) => c.id === id)).filter(Boolean);
    const total = items.reduce((s, c) => s + c.price, 0);
    return shell(`<div class="wrap cart-grid">
      <div>
        <h1 style="font-family:var(--font-display);font-size:2rem;font-weight:800">购物车</h1>
        <p class="meta">${items.length} 部短剧</p>
        ${items.length === 0 ? `<div class="empty"><p>购物车是空的。</p><a class="btn btn-primary mt-4" style="width:auto" href="#/courses">去浏览</a></div>`
          : `<ul class="plain">${items.map((c) => `<li class="cart-item">
              <a href="#/course/${c.slug}"><img src="${esc(c.cover)}" alt=""/></a>
              <div style="flex:1">
                <a href="#/course/${c.slug}" style="font-weight:700">${esc(c.title)}</a>
                <p class="meta">${esc(instructor(c.instructorId)?.name || "")}</p>
                <button class="btn-link mt-2" data-remove="${c.id}">移除</button>
              </div>
              <p style="font-weight:800">${formatPrice(c.price)}</p>
            </li>`).join("")}</ul>`}
      </div>
      <aside class="aside">
        <p class="meta">总计：</p>
        <p style="font-size:32px;font-weight:800">${formatPrice(total)}</p>
        <button class="btn btn-primary mt-4" data-checkout ${items.length?"":"disabled"}>去结算</button>
        <p class="meta mt-3">演示环境无需付款，结算即报名。</p>
      </aside>
    </div>`);
  }

  function wishlistPage() {
    const items = store.wishlist.map((id) => COURSES.find((c) => c.id === id)).filter(Boolean);
    return shell(`<div class="page-head"><div class="wrap"><h1>心愿单</h1><p>${items.length} 部想看的短剧</p></div></div>
      <div class="wrap section">${items.length ? `<div class="carousel">${items.map(courseCard).join("")}</div>` : `<div class="empty">心愿单还是空的。<a href="#/courses"> 去发现</a></div>`}</div>`);
  }

  function learningPage() {
    const items = store.enrolled.map((id) => COURSES.find((c) => c.id === id)).filter(Boolean);
    return shell(`<div class="page-head"><div class="wrap"><h1>我的学习</h1><p>已报名的短剧会显示在这里，进度保存在本机。</p></div></div>
      <div class="wrap section">
        ${items.length === 0 ? `<div class="empty">还没有报名任何短剧。<a class="btn btn-primary mt-4" style="width:auto" href="#/courses">去发现</a></div>`
          : `<div class="grid-3">${items.map((c) => {
            const lec = firstLecture(c);
            const pct = progressPercent(c, store.progress);
            return `<a class="enroll-card" href="#/learn/${c.id}/${lec.id}">
              <img src="${esc(c.cover)}" alt=""/>
              <div class="pad">
                <h2 style="font-size:16px">${esc(c.title)}</h2>
                <div class="bar"><span style="width:${pct}%"></span></div>
                <p class="meta mt-2">${pct}% 完成</p>
              </div>
            </a>`;
          }).join("")}</div>`}
      </div>`);
  }

  function studioPage() {
    return shell(`
      <section class="studio-banner">
        <img src="banners/teach.jpg" alt=""/>
        <div class="shade"></div>
        <div class="inner">
          <p class="kicker">VELORA STUDIO</p>
          <h1>在 Velora 开课</h1>
          <p class="mt-3">把你的短剧当成一门课上架。封面、分集、试看与结算都在同一套工具里。</p>
        </div>
      </section>
      <div class="wrap section" style="max-width:720px">
        <h2>开课流程</h2>
        <ol class="prose">
          <li>准备正片与幕后精讲（竖屏或横屏均可）</li>
          <li>挑选封面与海报，写清钩子与你将学到</li>
          <li>第一集设为试看，其余可在报名后解锁</li>
          <li>上架后学员可加入购物车或免费报名</li>
        </ol>
        <p class="meta mt-4">此为公开演示页。完整片库与封面工坊请在映堂工作室中使用。</p>
      </div>`);
  }

  function learnPage(courseId, lectureId) {
    const c = COURSES.find((x) => x.id === courseId);
    if (!c) return `<div class="learn-shell"><div class="wrap empty">找不到课程</div></div>`;
    const lecture = findLecture(c, lectureId) || firstLecture(c);
    const enrolled = store.enrolled.includes(c.id);
    const locked = !enrolled && !lecture.isPreview;
    const pct = progressPercent(c, store.progress);
    const note = store.notes[lecture.id] || "";
    const isDrama = lecture.source.kind === "drama-engine";
    return `<div class="learn-shell">
      <div class="learn-top">
        <a href="#/course/${c.slug}">← ${esc(c.title)}</a>
        <span class="meta" style="margin-left:auto;color:#aaa">${pct}% 完成</span>
      </div>
      <div class="learn-layout">
        <div>
          <div class="stage">
            ${locked
              ? `<div class="locked"><p>这一集需要报名后观看。</p><button class="btn btn-primary mt-4" style="width:auto" data-enroll="${c.id}">${c.price===0?"免费报名":"立即报名并观看"}</button></div>`
              : isDrama
                ? `<iframe src="${esc(lecture.source.url)}" title="${esc(lecture.title)}" style="width:100%;height:min(70vh,640px);border:0" allowfullscreen></iframe>`
                : `<video id="player" controls autoplay src="${esc(lecture.source.url)}"></video>`}
          </div>
          <div class="wrap" style="padding:20px 16px 40px">
            <h1 style="font-size:1.3rem">${esc(lecture.title)}</h1>
            ${lecture.isPreview ? `<p class="preview-tag mt-2">试看</p>` : ""}
            <div class="notes">
              <p class="meta">本集笔记</p>
              <textarea data-note="${lecture.id}" placeholder="写一点分镜或表演上的观察…">${esc(note)}</textarea>
            </div>
          </div>
        </div>
        <aside class="side-learn">
          ${c.sections.map((s) => `<details open>
            <summary style="padding:12px 16px;cursor:pointer;border-bottom:1px solid #333">${esc(s.title)}</summary>
            ${s.lectures.map((l) => {
              const lock = !enrolled && !l.isPreview;
              return `<a class="lecture ${l.id===lecture.id?"active":""} ${lock?"locked":""}" href="#/learn/${c.id}/${l.id}">
                ${icons.play}<span>${esc(l.title)}</span>
                ${l.isPreview?'<span class="preview-tag">试看</span>':""}
                <span class="dur">${formatClock(l.durationSec)}</span>
              </a>`;
            }).join("")}
          </details>`).join("")}
        </aside>
      </div>
    </div>`;
  }

  function bind() {
    document.querySelectorAll("[data-drop]").forEach((drop) => {
      const btn = drop.querySelector("[data-drop-btn]");
      if (!btn) return;
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        document.querySelectorAll("[data-drop]").forEach((d) => { if (d !== drop) d.classList.remove("open"); });
        drop.classList.toggle("open");
      });
    });
    document.addEventListener("click", () => document.querySelectorAll("[data-drop]").forEach((d) => d.classList.remove("open")), { once: true });

    document.querySelector("[data-open-drawer]")?.addEventListener("click", () => document.getElementById("drawer")?.classList.add("open"));
    document.querySelector("[data-close-drawer]")?.addEventListener("click", () => document.getElementById("drawer")?.classList.remove("open"));
    document.querySelector("[data-toggle-search]")?.addEventListener("click", () => document.getElementById("mobile-search")?.classList.toggle("open"));

    document.querySelectorAll("[data-search]").forEach((form) => {
      const root = form.parentElement;
      const hits = root.querySelector(".search-hits");
      const input = form.querySelector("input");
      input.addEventListener("input", () => {
        const t = input.value.trim().toLowerCase();
        if (!t) { hits.classList.add("hidden"); hits.innerHTML = ""; return; }
        const list = COURSES.filter((c) => `${c.title}${c.subtitle}${c.tags.join("")}`.toLowerCase().includes(t)).slice(0, 6);
        hits.innerHTML = list.map((c) => `<a href="#/course/${c.slug}"><img src="${esc(c.cover)}" alt=""/><span>${esc(c.title)}</span></a>`).join("");
        hits.classList.toggle("hidden", list.length === 0);
      });
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const t = input.value.trim();
        go(`/courses${t ? "?q=" + encodeURIComponent(t) : ""}`);
      });
    });
    document.querySelector("[data-hero-search]")?.addEventListener("submit", (e) => {
      e.preventDefault();
      const t = e.target.q.value.trim();
      go(`/courses${t ? "?q=" + encodeURIComponent(t) : ""}`);
    });
    document.querySelector("[data-sort]")?.addEventListener("change", (e) => {
      const { q, parts } = parse();
      q.set("sort", e.target.value);
      const base = parts[0] === "category" ? `/category/${parts[1]}` : "/courses";
      go(`${base}?${q.toString()}`);
    });
    document.querySelector("[data-cart]")?.addEventListener("click", (e) => {
      const id = e.currentTarget.getAttribute("data-cart");
      if (!store.cart.includes(id)) store.cart.push(id);
      save(); toast("已加入购物车"); render();
    });
    document.querySelector("[data-wish]")?.addEventListener("click", (e) => {
      const id = e.currentTarget.getAttribute("data-wish");
      const i = store.wishlist.indexOf(id);
      if (i >= 0) store.wishlist.splice(i, 1); else store.wishlist.push(id);
      save(); render();
    });
    document.querySelectorAll("[data-enroll]").forEach((btn) => btn.addEventListener("click", (e) => {
      const id = e.currentTarget.getAttribute("data-enroll");
      if (!store.enrolled.includes(id)) store.enrolled.push(id);
      store.cart = store.cart.filter((x) => x !== id);
      save(); toast("报名成功，已加入我的学习");
      const c = COURSES.find((x) => x.id === id);
      const lec = firstLecture(c);
      go(`/learn/${id}/${lec.id}`);
    }));
    document.querySelectorAll("[data-remove]").forEach((btn) => btn.addEventListener("click", (e) => {
      store.cart = store.cart.filter((id) => id !== e.currentTarget.getAttribute("data-remove"));
      save(); render();
    }));
    document.querySelector("[data-checkout]")?.addEventListener("click", () => {
      store.cart.forEach((id) => { if (!store.enrolled.includes(id)) store.enrolled.push(id); });
      store.cart = [];
      save(); toast("报名成功，已加入我的学习"); go("/my-learning");
    });
    const player = document.getElementById("player");
    if (player) {
      const { parts } = parse();
      const courseId = parts[1];
      const lectureId = parts[2];
      const c = COURSES.find((x) => x.id === courseId);
      const saved = store.progress[lectureId]?.seconds;
      if (saved) player.currentTime = saved;
      player.addEventListener("timeupdate", () => {
        store.progress[lectureId] = { ...(store.progress[lectureId] || {}), seconds: player.currentTime };
        save();
      });
      player.addEventListener("ended", () => {
        store.progress[lectureId] = { seconds: player.duration || 0, completed: true };
        save();
        const nxt = nextLecture(c, lectureId);
        if (nxt) go(`/learn/${courseId}/${nxt.id}`);
        else render();
      });
    }
    document.querySelector("[data-note]")?.addEventListener("input", (e) => {
      store.notes[e.target.getAttribute("data-note")] = e.target.value;
      save();
    });
  }

  function render() {
    const { parts, q } = parse();
    const view = parts[0] || "";
    document.title = "VELORA 映堂";
    if (!view) app.innerHTML = home();
    else if (view === "courses") {
      document.title = "全部短剧 · VELORA 映堂";
      app.innerHTML = catalog("全部短剧", "按题材、价格与评分筛选", q, "/courses");
    } else if (view === "category") {
      const cat = CATEGORIES.find((c) => c.id === parts[1]);
      q.set("cat", parts[1] || "");
      document.title = `${cat?.name || "分类"} · VELORA 映堂`;
      app.innerHTML = catalog(cat?.name || "分类", cat?.blurb || "", q, `/category/${parts[1]}`);
    } else if (view === "course") {
      const c = COURSES.find((x) => x.slug === parts[1]);
      if (c) document.title = `${c.title} · VELORA 映堂`;
      app.innerHTML = coursePage(parts[1]);
    } else if (view === "instructor") {
      const inst = instructor(parts[1]);
      if (inst) document.title = `${inst.name} · VELORA 映堂`;
      app.innerHTML = instructorPage(parts[1]);
    } else if (view === "cart") { document.title = "购物车 · VELORA 映堂"; app.innerHTML = cartPage(); }
    else if (view === "wishlist") { document.title = "心愿单 · VELORA 映堂"; app.innerHTML = wishlistPage(); }
    else if (view === "my-learning") { document.title = "我的学习 · VELORA 映堂"; app.innerHTML = learningPage(); }
    else if (view === "studio") { document.title = "在 Velora 开课 · VELORA 映堂"; app.innerHTML = studioPage(); }
    else if (view === "learn") {
      const c = COURSES.find((x) => x.id === parts[1]);
      const lec = c ? findLecture(c, parts[2]) : null;
      document.title = `${lec?.title || "播放"} · VELORA 映堂`;
      app.innerHTML = learnPage(parts[1], parts[2]);
    } else app.innerHTML = shell(`<div class="wrap empty">页面不存在。<a href="#/">回首页</a></div>`);
    window.scrollTo(0, 0);
    bind();
  }

  window.addEventListener("hashchange", render);
  if (!location.hash) location.replace("#/");
  else render();
})();
