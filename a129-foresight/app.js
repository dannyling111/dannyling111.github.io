import {
  CATEGORIES,
  GROUPS,
  ENTRIES,
  SCORECARD,
  SCORECARD_SOURCE,
  STATUS_LABEL,
  MASTHEAD_QUOTE,
  CORPUS_AS_OF,
} from "./data.js";

const app = document.querySelector("#app");
const state = { cat: "all", query: "", voice: "all", level: 2, composing: false };

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

function link(href, label) {
  if (!/^https:\/\//.test(href)) return "";
  return `<a href="${esc(href)}" target="_blank" rel="noreferrer">${esc(label)}</a>`;
}

function meta(text) {
  return `<span style="color:#9c978c">${esc(text)}</span>`;
}

function leaf(lines) {
  return { content: lines.filter(Boolean).join("<br>"), children: [] };
}

function buildTree() {
  const needle = state.query.trim().toLowerCase();
  const showScores = state.voice !== "转述" && state.voice !== "手记" && (state.cat === "all" || state.cat === "scorecard");
  const groups = GROUPS.map((group) => {
    const categories = CATEGORIES.filter((item) => item.group === group.id)
      .filter((item) => state.cat === "all" || item.id === state.cat)
      .map((item) => {
        const children = [];
        for (const entry of ENTRIES) {
          if (entry.cat !== item.id) continue;
          if (state.cat !== "all" && entry.cat !== state.cat) continue;
          if (state.voice === "手记") continue;
          if (state.voice !== "all" && entry.voice !== state.voice) continue;
          if (needle && !`${entry.title} ${entry.body} ${entry.horizon}`.toLowerCase().includes(needle)) continue;
          children.push(
            leaf([
              `<strong>${esc(entry.title)}</strong>`,
              meta(`${STATUS_LABEL[entry.status]} · ${entry.horizon}`),
              link(entry.href, "打开原帖"),
            ]),
          );
        }
        if (item.id === "scorecard" && showScores) {
          for (const row of SCORECARD) {
            if (needle && !`${row.title} ${row.note}`.toLowerCase().includes(needle)) continue;
            children.push(
              leaf([
                `<strong>${esc(row.title)}</strong>`,
                meta(STATUS_LABEL[row.status]),
                link(SCORECARD_SOURCE.href, "打开原帖"),
              ]),
            );
          }
        }
        if (!children.length) return null;
        return { content: `<strong>${esc(item.index)} ${esc(item.name)}</strong>`, children };
      })
      .filter(Boolean);
    if (!categories.length) return null;
    return { content: `<strong>${esc(group.label)}</strong>`, children: categories };
  }).filter(Boolean);

  const quote = leaf([
    `<strong>预测是旁观，建造才算数</strong>`,
    meta(MASTHEAD_QUOTE.published),
    link(MASTHEAD_QUOTE.href, "打开原帖"),
  ]);
  return {
    content: `<strong>Peter Diamandis</strong><br>${meta("远见谱 · " + CORPUS_AS_OF)}<br>${link("https://x.com/PeterDiamandis", "打开他的 X")}`,
    children: groups.length ? [quote, ...groups] : [quote],
  };
}

function depthOf(node) {
  if (!node.children.length) return 1;
  return 1 + Math.max(...node.children.map(depthOf));
}

function withFold(node, depth, level) {
  const children = node.children.map((child) => withFold(child, depth + 1, level));
  return {
    content: node.content,
    children,
    payload: { fold: children.length > 0 && depth >= level ? 1 : 0 },
  };
}

let mm = null;
let stageEl = null;

function shell() {
  const openWindows = ENTRIES.filter((entry) => entry.status === "window").length;
  app.innerHTML = `
    <header class="header">
      <div class="wrap header-inner">
        <div class="brand"><strong>远见谱</strong><span>@PeterDiamandis · 截止 ${esc(CORPUS_AS_OF)}</span></div>
        <dl class="stats"><div>档案<b>${ENTRIES.length + SCORECARD.length}</b></div><div>窗口仍开<b>${openWindows}</b></div></dl>
      </div>
    </header>
    <main class="wrap" style="padding:1rem 1rem 2rem">
      <p class="lede">先看大类，点圆点或「展一层」看到具体观点。拖动平移，滚轮缩放。节点上的「打开原帖」直接去原文。</p>
      <div class="chips" style="margin-top:0.75rem">
        ${chip("all", "全部")}
        ${CATEGORIES.map((item) => chip(item.id, `${item.index} ${item.name}`)).join("")}
      </div>
      <div class="filters">
        <label class="search"><input id="q" value="${esc(state.query)}" placeholder="搜索句子、年份、人名" /></label>
        <div class="voices">
          ${["all:全部", "本人:他本人", "转述:他转述"].map((pair) => {
            const [id, label] = pair.split(":");
            return `<button type="button" class="voice${state.voice === id ? " on" : ""}" data-voice="${id}">${label}</button>`;
          }).join("")}
        </div>
      </div>
      <div class="mmstage" id="stage">
        <div class="mmtoolbar">
          <button type="button" data-fold="in">收一层</button>
          <button type="button" data-fold="out">展一层</button>
          <button type="button" data-fold="all">全部展开</button>
          <button type="button" data-full>全屏</button>
        </div>
        <div class="mmbox"><svg id="mmsvg"></svg></div>
      </div>
    </main>
  `;
  stageEl = document.querySelector("#stage");
  draw();
}

function chip(id, label) {
  const on = state.cat === id;
  return `<button type="button" class="chip${on ? " on" : ""}" data-cat="${id}">${esc(label)}</button>`;
}

async function draw() {
  const svg = document.querySelector("#mmsvg");
  const box = svg.parentElement;
  const rect = box.getBoundingClientRect();
  svg.setAttribute("width", String(Math.max(rect.width, 320)));
  svg.setAttribute("height", String(Math.max(rect.height, 520)));
  svg.style.setProperty("--markmap-text-color", "#e8e4d8");
  svg.style.setProperty("--markmap-a-color", "#d4a054");
  svg.style.setProperty("--markmap-circle-open-bg", "#101311");
  if (mm) mm.destroy();
  const tree = buildTree();
  const depth = depthOf(tree);
  if (state.level > depth) state.level = depth;
  const api = window.mm;
  mm = api.Markmap.create(svg, {
    duration: 300,
    maxWidth: 240,
    spacingVertical: 10,
    paddingX: 16,
    fitRatio: 0.92,
    embedGlobalCSS: true,
    initialExpandLevel: -1,
  });
  await mm.setData(withFold(tree, 0, state.level));
  svg.style.setProperty("--markmap-text-color", "#e8e4d8");
  svg.style.setProperty("--markmap-a-color", "#d4a054");
  if (state.level <= 2) {
    await mm.fit();
  } else {
    const height = box.getBoundingClientRect().height || 640;
    await mm.transition(mm.svg).call(mm.zoom.transform, api.zoomIdentity.translate(48, height * 0.5).scale(1)).end();
  }
  const focus = document.getElementById("q");
  if (focus && document.activeElement !== focus && state.query) focus.focus();
}

document.addEventListener("click", (event) => {
  const target = event.target instanceof Element ? event.target.closest("[data-cat],[data-voice],[data-fold],[data-full],a") : null;
  if (!target) return;
  if (target instanceof HTMLAnchorElement && target.closest("svg")) {
    const href = target.getAttribute("href") || "";
    if (href.startsWith("https://")) {
      event.preventDefault();
      event.stopPropagation();
      window.open(href, "_blank", "noopener,noreferrer");
    }
    return;
  }
  if (target.dataset.cat) {
    state.cat = target.dataset.cat;
    state.level = 2;
    shell();
    return;
  }
  if (target.dataset.voice) {
    state.voice = target.dataset.voice;
    state.level = 2;
    shell();
    return;
  }
  if (target.dataset.fold === "in") {
    state.level = Math.max(1, state.level - 1);
    draw();
    return;
  }
  if (target.dataset.fold === "out") {
    state.level += 1;
    draw();
    return;
  }
  if (target.dataset.fold === "all") {
    state.level = 6;
    draw();
    return;
  }
  if (target.hasAttribute("data-full") && stageEl) {
    if (document.fullscreenElement) document.exitFullscreen();
    else stageEl.requestFullscreen().catch(() => undefined);
  }
});

document.addEventListener("input", (event) => {
  if (event.target instanceof HTMLInputElement && event.target.id === "q") {
    state.query = event.target.value;
    if (state.query.trim()) state.cat = "all";
    state.level = state.query.trim() ? 4 : 2;
    shell();
  }
});

shell();
