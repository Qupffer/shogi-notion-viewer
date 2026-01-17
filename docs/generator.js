// docs/generator.js
// 目的: GitHubのリポジトリ内のフォルダ/ファイル一覧を取得して表示し、選んだKIFからEmbed URLを作る

const $ = (sel) => document.querySelector(sel);

const elUser = $("#gh-user");
const elRepo = $("#gh-repo");
const elBranch = $("#gh-branch");
const btnLoad = $("#btn-load");

const elBreadcrumb = $("#breadcrumb");
const elFileList = $("#file-list");
const elStatus = $("#status");

const elOutput = $("#embed-url");       // ★IDで固定
const btnCopy = $("#btn-copy");         // ★IDで固定

let state = {
  user: "",
  repo: "",
  branch: "",
  path: "kif", // 固定起点
};

function setStatus(msg) {
  if (elStatus) elStatus.textContent = msg;
}

function buildApiUrl(path) {
  const p = path ? `/${encodeURIComponent(path).replaceAll("%2F", "/")}` : "";
  return `https://api.github.com/repos/${encodeURIComponent(state.user)}/${encodeURIComponent(
    state.repo
  )}/contents${p}?ref=${encodeURIComponent(state.branch)}`;
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
  rootBtn.style.marginRight = "8px";
  rootBtn.onclick = () => {
    state.path = "kif";
    loadPath();
  };
  elBreadcrumb.appendChild(rootBtn);

  let accum = "kif";
  for (let i = 1; i < parts.length; i++) {
    accum += "/" + parts[i];

    const span = document.createElement("span");
    span.textContent = " / ";
    elBreadcrumb.appendChild(span);

    const b = document.createElement("button");
    b.textContent = parts[i];
    b.style.marginRight = "8px";
    b.onclick = () => {
      state.path = accum;
      loadPath();
    };
    elBreadcrumb.appendChild(b);
  }
}

function isKif(name) {
  const lower = name.toLowerCase();
  return lower.endsWith(".kif") || lower.endsWith(".kifu");
}

function makePagesBaseUrl() {
  return `https://${state.user}.github.io/${state.repo}/`;
}

function makeViewerUrl(kifPath) {
  // viewer 側のURLに合わせる（今の構成: /viewer/index.html）
  // viewer は o/r/p でGitHub APIから読む設計にしてるので、それに合わせる
  // p は "kif/..." のパス
  const base = makePagesBaseUrl();
  const viewer = `${base}viewer/index.html`;
  return `${viewer}?o=${encodeURIComponent(state.user)}&r=${encodeURIComponent(
    state.repo
  )}&p=${encodeURIComponent(kifPath)}&b=${encodeURIComponent(state.branch)}`;
}

function showEmbedUrl(url) {
  if (!elOutput) return;
  elOutput.textContent = url;
}

function renderList(items) {
  elFileList.innerHTML = "";

  const folders = items.filter((x) => x.type === "dir").sort((a, b) => a.name.localeCompare(b.name));
  const files = items.filter((x) => x.type === "file").sort((a, b) => a.name.localeCompare(b.name));
  const all = [...folders, ...files];

  for (const item of all) {
    const row = document.createElement("div");
    row.style.display = "flex";
    row.style.gap = "10px";
    row.style.alignItems = "center";
    row.style.padding = "8px 0";
    row.style.borderBottom = "1px solid #eee";

    const icon = document.createElement("span");
    icon.textContent = item.type === "dir" ? "📁" : "📄";
    row.appendChild(icon);

    const nameBtn = document.createElement("button");
    nameBtn.textContent = item.name;
    nameBtn.style.textAlign = "left";

    if (item.type === "dir") {
      nameBtn.onclick = () => {
        state.path = item.path;
        loadPath();
      };
    } else {
      nameBtn.disabled = !isKif(item.name);
      nameBtn.title = isKif(item.name) ? "このKIFを選択" : "KIFのみ選択できます";
      nameBtn.onclick = () => {
        const kifPath = item.path; // 例: kif/先手/相掛かり/test.kif
        const url = makeViewerUrl(kifPath);
        showEmbedUrl(url);
        setStatus("Embed URL を生成しました。Copyでコピーできます（失敗したら手動コピー）。");
      };
    }

    row.appendChild(nameBtn);
    elFileList.appendChild(row);
  }
}

async function loadPath() {
  setStatus("読み込み中...");
  renderBreadcrumb();
  try {
    const url = buildApiUrl(state.path);
    const json = await fetchJson(url);

    if (!Array.isArray(json)) {
      throw new Error("フォルダではなくファイルを指している可能性があります。");
    }

    renderList(json);
    setStatus("OK");
  } catch (e) {
    setStatus(`エラー: ${e.message}`);
    elFileList.innerHTML = "";
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
  showEmbedUrl("ここに Notion 用の URL が表示されます");
  loadPath();
});

// ★コピー：失敗したら「URLを選択状態」にして手動コピー誘導
btnCopy?.addEventListener("click", async () => {
  const txt = (elOutput?.textContent || "").trim();
  if (!txt || txt.includes("ここに")) {
    setStatus("まだURLがありません。KIFを選んでください。");
    return;
  }

  // 1) まず Clipboard API を試す（通れば一発）
  try {
    await navigator.clipboard.writeText(txt);
    setStatus("コピーしました。Notionに貼り付けOK。");
    return;
  } catch (e) {
    // 2) だめなら手動コピーできる形にする（確実）
  }

  try {
    // output欄を一時的に選択可能にする
    const ta = document.createElement("textarea");
    ta.value = txt;
    ta.setAttribute("readonly", "true");
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    ta.style.top = "0";
    document.body.appendChild(ta);
    ta.select();
    ta.setSelectionRange(0, ta.value.length);

    const ok = document.execCommand("copy"); // 古いが通る環境もある
    document.body.removeChild(ta);

    if (ok) {
      setStatus("コピーしました（互換モード）。Notionに貼り付けOK。");
    } else {
      setStatus("自動コピー不可。上のURLをドラッグしてコピーしてください。");
    }
  } catch {
    setStatus("自動コピー不可。上のURLをドラッグしてコピーしてください。");
  }
});

// 初期表示
setStatus("GitHub username を入れて Load Files を押してください。");
