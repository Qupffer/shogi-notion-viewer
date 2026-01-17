// docs/generator.js
const $ = (sel) => document.querySelector(sel);

const elUser = $("#gh-user");
const elRepo = $("#gh-repo");
const elBranch = $("#gh-branch");
const btnLoad = $("#btn-load");

const elBreadcrumb = $("#breadcrumb");
const elFileList = $("#file-list");
const elStatus = $("#status");

const elOutput = $("#embed-url");
const btnCopy = $("#btn-copy");

let state = { user: "", repo: "", branch: "main", path: "kif" };

function setStatus(msg) { if (elStatus) elStatus.textContent = msg; }

function buildApiUrl(path) {
  const p = path ? `/${encodeURIComponent(path).replaceAll("%2F", "/")}` : "";
  return `https://api.github.com/repos/${encodeURIComponent(state.user)}/${encodeURIComponent(state.repo)}/contents${p}?ref=${encodeURIComponent(state.branch)}`;
}

async function fetchJson(url) {
  const res = await fetch(url, { headers: { Accept: "application/vnd.github+json" } });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status}: ${text || res.statusText}`);
  }
  return res.json();
}

function renderBreadcrumb() {
  const parts = state.path.split("/").filter(Boolean);
  elBreadcrumb.innerHTML = "";

  const rootBtn = document.createElement("button");
  rootBtn.textContent = "root";
  rootBtn.onclick = () => { state.path = "kif"; loadPath(); };
  elBreadcrumb.appendChild(rootBtn);

  let accum = "kif";
  for (let i = 1; i < parts.length; i++) {
    accum += "/" + parts[i];
    const sep = document.createElement("span");
    sep.textContent = " / ";
    elBreadcrumb.appendChild(sep);

    const b = document.createElement("button");
    b.textContent = parts[i];
    b.onclick = () => { state.path = accum; loadPath(); };
    elBreadcrumb.appendChild(b);
  }
}

function isKif(name) {
  const n = name.toLowerCase();
  return n.endsWith(".kif") || n.endsWith(".kifu");
}

function makePagesBaseUrl() {
  return `https://${state.user}.github.io/${state.repo}/`;
}

// ★viewerは o/r/p/b 形式
function makeViewerUrl(kifPath) {
  const base = makePagesBaseUrl();
  const viewer = `${base}viewer/index.html`;
  return `${viewer}?o=${encodeURIComponent(state.user)}&r=${encodeURIComponent(state.repo)}&p=${encodeURIComponent(kifPath)}&b=${encodeURIComponent(state.branch)}`;
}

function showEmbedUrl(url) { if (elOutput) elOutput.textContent = url; }

function renderList(items) {
  elFileList.innerHTML = "";

  const folders = items.filter(x => x.type === "dir").sort((a,b)=>a.name.localeCompare(b.name));
  const files = items.filter(x => x.type === "file").sort((a,b)=>a.name.localeCompare(b.name));

  for (const item of [...folders, ...files]) {
    if (item.name === ".keep") continue;

    const row = document.createElement("div");
    row.style.display = "flex";
    row.style.gap = "10px";
    row.style.alignItems = "center";
    row.style.padding = "8px 0";
    row.style.borderBottom = "1px solid #eee";

    const icon = document.createElement("span");
    icon.textContent = item.type === "dir" ? "📁" : "📄";
    row.appendChild(icon);

    const btn = document.createElement("button");
    btn.textContent = item.name;

    if (item.type === "dir") {
      btn.onclick = () => { state.path = item.path; loadPath(); };
    } else {
      const ok = isKif(item.name);
      btn.disabled = !ok;
      btn.title = ok ? "このKIFを選択" : "KIFのみ選択できます";
      btn.onclick = () => {
        const url = makeViewerUrl(item.path);
        showEmbedUrl(url);
        setStatus("Embed URL を生成しました。Copyでコピーできます。");
      };
    }

    row.appendChild(btn);
    elFileList.appendChild(row);
  }
}

async function loadPath() {
  setStatus("読み込み中...");
  renderBreadcrumb();

  try {
    const url = buildApiUrl(state.path);
    const json = await fetchJson(url);
    if (!Array.isArray(json)) throw new Error("フォルダではなくファイルを指している可能性があります。");
    renderList(json);
    setStatus("OK");
  } catch (e) {
    elFileList.innerHTML = "";
    setStatus(`エラー: ${e.message}`);
  }
}

btnLoad?.addEventListener("click", () => {
  state.user = (elUser?.value || "").trim();
  state.repo = (elRepo?.value || "").trim();
  state.branch = (elBranch?.value || "").trim() || "main";

  if (!state.user || !state.repo) {
    setStatus("GitHub username と Repository name は必須です。");
    return;
  }

  state.path = "kif";
  showEmbedUrl("");
  loadPath();
});

btnCopy?.addEventListener("click", async () => {
  const txt = (elOutput?.textContent || "").trim();
  if (!txt) { setStatus("まだURLがありません。KIFを選んでください。"); return; }

  try {
    await navigator.clipboard.writeText(txt);
    setStatus("コピーしました。Notionに貼り付けOK。");
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = txt;
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setStatus("コピーしました（互換モード）。Notionに貼り付けOK。");
    } catch {
      setStatus("コピー失敗。URLを手動でコピーしてください。");
    }
  }
});
