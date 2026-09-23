import {
  CATEGORIES,
  GROUPS,
  ENTRIES,
  SCORECARD,
  SCORECARD_SOURCE,
  STATUS_LABEL,
  CORPUS_AS_OF,
  MASTHEAD_QUOTE,
} from "./data.js";

const KEY = "foresight-ledger-notes-v1";
const app = document.querySelector("#app");

const state = {
  cat: "all",
  query: "",
  voice: "all",
  openId: ENTRIES[0]?.id ?? null,
  composing: false,
  pendingDelete: null,
  notes: loadNotes(),
  error: "",
};

function loadNotes() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || "[]");
    if (!Array.isArray(raw)) return [];
    return raw.filter((note) => note && CATEGORIES.some((item) => item.id === note.cat) && note.title && note.body);
  } catch {
    return [];
  }
}

function saveNotes() {
  localStorage.setItem(KEY, JSON.stringify(state.notes));
}

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (ch) => {
    switch (ch) {
      case "&":
        return "&" + "amp;";
      case "<":
        return "&" + "lt;";
      case ">":
        return "&" + "gt;";
      case '"':
        return "&" + "quot;";
      default:
        return "&" + "#39;";
    }
  });
}

function safeHref(href) {
  return /^https:\/\//.test(href) ? href : "#";
}

function categoryById(id) {
  return CATEGORIES.find((item) => item.id === id);
}

function countFor(id) {
  const notes = id === "all" ? state.notes.length : state.notes.filter((note) => note.cat === id).length;
  if (id === "scorecard") return SCORECARD.length + notes;
  if (id === "all") return ENTRIES.length + SCORECARD.length + notes;
  return ENTRIES.filter((entry) => entry.cat === id).length + notes;
}

function matchesEntry(entry, needle) {
  if (state.cat !== "all" && entry.cat !== state.cat) return false;
  if (state.voice === "手记") return false;
  if (state.voice !== "all" && entry.voice !== state.voice) return false;
  if (!needle) return true;
  return `${entry.title} ${entry.body} ${entry.quote ?? ""} ${entry.horizon}`.toLowerCase().includes(needle);
}

function matchesNote(note, needle) {
  if (state.voice === "本人" || state.voice === "转述") return false;
  if (state.cat !== "all" && note.cat !== state.cat) return false;
  if (!needle) return true;
  return `${note.title} ${note.body} ${note.horizon}`.toLowerCase().includes(needle);
}

function visibleScores(needle) {
  if (state.voice === "转述" || state.voice === "手记") return [];
  if (state.cat !== "all" && state.cat !== "scorecard") return [];
  return SCORECARD.filter((row) => !needle || `${row.title} ${row.note}`.toLowerCase().includes(needle));
}

function render() {
  const focus = document.activeElement;
  const focusId = focus?.id;
  const caret = focus && "selectionStart" in focus ? focus.selectionStart : null;
  const needle = state.query.trim().toLowerCase();
  const notes = state.notes.filter((note) => matchesNote(note, needle));
  const entries = ENTRIES.filter((entry) => matchesEntry(entry, needle));
  const scores = visibleScores(needle);
  const openWindows = ENTRIES.filter((entry) => entry.status === "window").length;
  const cat = state.cat === "all" ? null : categoryById(state.cat);

  app.innerHTML = `
    <header class="header">
      <div class="wrap header-inner">
        <div class="brand">
          <strong>远见谱</strong>
          <span>@PeterDiamandis · 截止 ${esc(CORPUS_AS_OF)}</span>
        </div>
        <dl class="stats">
          <div>档案<b>${ENTRIES.length + SCORECARD.length}</b></div>
          <div>窗口仍开<b>${openWindows}</b></div>
          <div>本机手记<b>${state.notes.length}</b></div>
        </dl>
        <button class="btn btn-brass" type="button" data-compose>${state.composing ? "收起" : "记一条"}</button>
      </div>
    </header>
    <div class="wrap layout">
      <aside class="side">
        <div class="nav">
          <p class="kicker">主账号</p>
          <h2>Peter H. Diamandis</h2>
          <p class="lede">XPRIZE 执行主席，Abundance360 与 Moonshots 主理人。X 上把预测写成可回指原文的人里，他是最成体系的一个。2026 年 9 月约 42 万关注。</p>
          <a class="src" href="https://x.com/PeterDiamandis" target="_blank" rel="noreferrer">打开他的 X</a>
          <nav aria-label="预测大类">
            ${navButton("all", "全", "全部大类")}
            ${GROUPS.map((group) => `
              <p class="group-label">${esc(group.label)}</p>
              ${CATEGORIES.filter((item) => item.group === group.id).map((item) => navButton(item.id, item.index, item.name)).join("")}
            `).join("")}
          </nav>
        </div>
        <div class="chips">
          ${chip("all", "全部大类")}
          ${CATEGORIES.map((item) => chip(item.id, `${item.index} ${item.name}`)).join("")}
        </div>
      </aside>
      <main class="main">
        ${cat ? hero(cat) : masthead()}
        ${state.composing ? composer(cat ? cat.id : "creators") : ""}
        <div class="filters">
          <label class="search">
            <span class="sr-only">搜索档案</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3-3"/></svg>
            <input id="q" value="${esc(state.query)}" placeholder="搜索句子、年份、人名" />
          </label>
          <div class="voices" role="group" aria-label="声音">
            ${["all:全部", "本人:他本人", "转述:他转述", "手记:我的手记"].map((pair) => {
              const [id, label] = pair.split(":");
              return `<button type="button" class="voice${state.voice === id ? " on" : ""}" data-voice="${id}" aria-pressed="${state.voice === id}">${label}</button>`;
            }).join("")}
          </div>
        </div>
        ${cat ? "" : `<p class="intro lede">先看大类，再读句子。左边六条分叉是他给人类未来画的格子；轨道是五年内的账单、机器和产值；成绩单专门留给他已经喊出去、可以对账的话。</p>`}
        <div class="groups">
          ${GROUPS.filter((group) => !cat || group.id === cat.group).map((group) => {
            const blocks = CATEGORIES.filter((item) => item.group === group.id)
              .filter((item) => !cat || item.id === cat.id)
              .map((item) => ({
                item,
                entries: entries.filter((entry) => entry.cat === item.id),
                notes: notes.filter((note) => note.cat === item.id),
                scores: item.id === "scorecard" ? scores : [],
              }))
              .filter((block) => {
                if (cat) return true;
                if (!needle && state.voice === "all") return true;
                return block.entries.length + block.notes.length + block.scores.length > 0;
              });
            if (!blocks.length) return "";
            return `<section class="group">
              ${cat ? "" : `<h2>${esc(group.label)}</h2><p class="hint">${esc(group.hint)}</p>`}
              <div class="stack">
                ${blocks.map((block) => blockHtml(block, !cat)).join("")}
              </div>
            </section>`;
          }).join("")}
        </div>
        <footer class="foot">条目整理自他的 X 长文、帖子、Metatrends 通信和 Moonshots 公开对谈，截止 ${esc(CORPUS_AS_OF)}。引语保留英文。转述句标明了原来的主语。手记只写在这台浏览器里。仓库：<a href="https://github.com/dannyling111/a129-foresight">dannyling111/a129-foresight</a></footer>
      </main>
    </div>
  `;

  const next = focusId ? document.getElementById(focusId) : null;
  if (next) {
    next.focus();
    if (caret != null && next.setSelectionRange) next.setSelectionRange(caret, caret);
  }
}

function navButton(id, index, name) {
  const on = state.cat === id;
  return `<button type="button" class="nav-btn${on ? " on" : ""}" data-cat="${id}" aria-pressed="${on}"><span class="idx">${esc(index)}</span><span>${esc(name)}</span><span class="faint">${countFor(id)}</span></button>`;
}

function chip(id, label) {
  const on = state.cat === id;
  return `<button type="button" class="chip${on ? " on" : ""}" data-cat="${id}" aria-pressed="${on}">${esc(label)} <span class="faint">${countFor(id)}</span></button>`;
}

function masthead() {
  return `<div>
    <p class="kicker">一份会变厚的预测档案</p>
    <h1>先把未来分成格子，再把干货填进去。</h1>
    <p class="intro">主账号是 Peter Diamandis。他不零散地感慨趋势，而是公开画分叉、写年份、留原文。下面先是大类，句子放在类里面。你随后写的总结留在本地，和档案叠在一起。</p>
    <figure class="quote">
      <blockquote>${esc(MASTHEAD_QUOTE.text)}</blockquote>
      <figcaption>${esc(MASTHEAD_QUOTE.by)} · ${esc(MASTHEAD_QUOTE.published)} <a href="${safeHref(MASTHEAD_QUOTE.href)}" target="_blank" rel="noreferrer">原帖</a></figcaption>
    </figure>
    <p class="mobile-id">Peter H. Diamandis，XPRIZE 执行主席。2026 年 9 月约 42 万关注。 <a href="https://x.com/PeterDiamandis" target="_blank" rel="noreferrer">@PeterDiamandis</a></p>
  </div>`;
}

function hero(item) {
  return `<div>
    <p class="kicker">${esc(item.kicker)} · ${esc(item.index)}</p>
    <h1>${esc(item.name)}</h1>
    <p class="preface">${esc(item.preface)}</p>
    <p class="stance">${esc(item.stance)}</p>
  </div>`;
}

function blockHtml(block, showHead) {
  const body = [];
  if (showHead) {
    body.push(`<div><button type="button" class="cat-jump" data-cat="${block.item.id}"><span class="idx">${esc(block.item.index)}</span><span class="cat-name">${esc(block.item.name)}</span></button><p class="lede">${esc(block.item.stance)}</p></div>`);
  }
  if (block.item.id === "scorecard") body.push(scorecard(block.scores));
  if (block.notes.length + block.entries.length === 0 && block.item.id !== "scorecard") {
    body.push(`<p class="empty">这一类还没有对上的句子。记一条，谱就从这里变厚。</p>`);
  } else {
    body.push(...block.notes.map(noteCard), ...block.entries.map(entryCard));
  }
  return body.join("");
}

function entryCard(entry) {
  const open = state.openId === entry.id;
  return `<article class="card">
    <button type="button" class="card-btn" data-open="${esc(entry.id)}" aria-expanded="${open}">
      <div class="tags"><span>${esc(STATUS_LABEL[entry.status])}</span><span class="faint">${esc(entry.voice)}</span><span class="faint">${esc(entry.published)}</span></div>
      <h3>${esc(entry.title)}</h3>
      <p class="${open ? "" : "clamp"}">${esc(entry.body)}</p>
      <p class="meta">时间窗 · ${esc(entry.horizon)}</p>
    </button>
    ${open ? `<div class="more">${entry.quote ? `<blockquote>${esc(entry.quote)}${entry.quoteBy ? `<footer>— ${esc(entry.quoteBy)}</footer>` : ""}</blockquote>` : ""}<a class="src" href="${safeHref(entry.href)}" target="_blank" rel="noreferrer">${esc(entry.source)}</a></div>` : ""}
  </article>`;
}

function noteCard(note) {
  const open = state.openId === note.id;
  const pending = state.pendingDelete === note.id;
  return `<article class="card card-note">
    <button type="button" class="card-btn" data-open="${esc(note.id)}" aria-expanded="${open}">
      <div class="tags"><span>手记</span><span class="faint">${esc(note.createdAt)}</span></div>
      <h3>${esc(note.title)}</h3>
      <p class="${open ? "" : "clamp"}">${esc(note.body)}</p>
      ${note.horizon ? `<p class="meta">时间窗 · ${esc(note.horizon)}</p>` : ""}
    </button>
    ${open ? `<div class="more">${pending
      ? `<button class="btn btn-brass" type="button" data-confirm-delete="${esc(note.id)}">确认删除</button> <button class="btn btn-quiet" type="button" data-cancel-delete>留下</button>`
      : `<button class="btn btn-quiet" type="button" data-delete="${esc(note.id)}">删除这条手记</button>`}</div>` : ""}
  </article>`;
}

function scorecard(rows) {
  const misses = SCORECARD.filter((row) => row.status === "miss").length;
  const partials = SCORECARD.filter((row) => row.status === "partial").length;
  const open = SCORECARD.filter((row) => row.status === "unscored").length;
  const filtered = Boolean(state.query.trim()) || state.voice !== "all";
  return `<section>
    <div class="score-head">
      <div><h2>2025 十条</h2><p class="hint">未兑现 ${misses} · 部分兑现 ${partials} · 待核验 ${open}</p></div>
      <a class="src" href="${safeHref(SCORECARD_SOURCE.href)}" target="_blank" rel="noreferrer">${esc(SCORECARD_SOURCE.published)} 原帖</a>
    </div>
    ${rows.length === 0 ? `<p class="empty">${filtered ? "成绩单里没有对上的句子。" : "这一栏被当前筛选藏起了。"}</p>` : `<ol class="stack">${rows.map((row) => {
      const n = String(SCORECARD.findIndex((item) => item.id === row.id) + 1).padStart(2, "0");
      return `<li class="score-row"><div class="score-top"><b>${n}</b><span class="kicker">${esc(STATUS_LABEL[row.status])}</span></div><p class="score-title">${esc(row.title)}</p><p>${esc(row.note)}</p></li>`;
    }).join("")}</ol>`}
  </section>`;
}

function composer(initialCat) {
  return `<form class="compose" id="composer">
    <div class="compose-head"><h2>把一条总结写进格子</h2><button class="btn btn-quiet" type="button" data-compose>收起</button></div>
    <p class="lede">只存在这台浏览器。换一台设备不会跟着走。类先选好，句子以后可以继续堆。</p>
    <label class="field">放进
      <select name="cat">${CATEGORIES.map((item) => `<option value="${item.id}"${item.id === initialCat ? " selected" : ""}>${esc(item.index)} ${esc(item.name)}</option>`).join("")}</select>
    </label>
    <label class="field">标题<input name="title" maxlength="80" required /></label>
    <label class="field">总结<textarea name="body" maxlength="2000" required></textarea></label>
    <label class="field">时间窗，可空<input name="horizon" maxlength="40" placeholder="例如 2030，或仍在窗口" /></label>
    ${state.error ? `<p class="err">${esc(state.error)}</p>` : ""}
    <button class="btn btn-brass" type="submit">写入档案</button>
  </form>`;
}

document.addEventListener("click", (event) => {
  const target = event.target instanceof Element ? event.target.closest("[data-cat],[data-voice],[data-open],[data-compose],[data-delete],[data-confirm-delete],[data-cancel-delete]") : null;
  if (!target) return;
  if (target.dataset.cat) {
    state.cat = target.dataset.cat;
    state.error = "";
    render();
    return;
  }
  if (target.dataset.voice) {
    state.voice = target.dataset.voice;
    render();
    return;
  }
  if (target.dataset.open) {
    state.openId = state.openId === target.dataset.open ? null : target.dataset.open;
    render();
    return;
  }
  if (target.hasAttribute("data-compose")) {
    state.composing = !state.composing;
    state.error = "";
    render();
    return;
  }
  if (target.dataset.delete) {
    state.pendingDelete = target.dataset.delete;
    render();
    return;
  }
  if (target.hasAttribute("data-cancel-delete")) {
    state.pendingDelete = null;
    render();
    return;
  }
  if (target.dataset.confirmDelete) {
    state.notes = state.notes.filter((note) => note.id !== target.dataset.confirmDelete);
    if (state.openId === target.dataset.confirmDelete) state.openId = null;
    state.pendingDelete = null;
    saveNotes();
    render();
  }
});

document.addEventListener("input", (event) => {
  if (event.target instanceof HTMLInputElement && event.target.id === "q") {
    state.query = event.target.value;
    if (state.query.trim()) state.cat = "all";
    render();
  }
});

document.addEventListener("submit", (event) => {
  const form = event.target;
  if (!(form instanceof HTMLFormElement) || form.id !== "composer") return;
  event.preventDefault();
  const data = new FormData(form);
  const title = String(data.get("title") || "").trim();
  const body = String(data.get("body") || "").trim();
  if (title.length < 2 || body.length < 8) {
    state.error = "标题至少两个字，总结至少写完一句。";
    render();
    return;
  }
  const note = {
    id: crypto.randomUUID(),
    cat: String(data.get("cat")),
    title: title.slice(0, 80),
    body: body.slice(0, 2000),
    horizon: String(data.get("horizon") || "").trim().slice(0, 40),
    createdAt: new Date().toISOString().slice(0, 10),
  };
  state.notes = [note, ...state.notes];
  state.cat = note.cat;
  state.voice = "all";
  state.openId = note.id;
  state.composing = false;
  state.error = "";
  saveNotes();
  render();
});

render();
