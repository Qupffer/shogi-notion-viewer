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

const elOutput = document.querySelector("#embed-url");
const btnCopy = document.querySelector("#btn-copy");

let state = {
  user: "",
  repo: "",
  branch: "main",
  path: "kif",
};

function setStatus(msg) {
  if (elStatus) elStatus.textContent = msg;
}

function buildApiUrl(path) {
  const p = path ? `/${encodeURIComponent(path).replaceAll("%2F", "/")}` : "";
  return `https://api.github.com/repos/${state.user}/${state.repo}/contents${p}?ref=${encodeURIComponent(
    state.branch
  )}`;
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
    b.onclick = () => {
      state.path = accum;
      loadPath();
    };
    elBreadcrumb.appendChild(b);
  }
}

function isKif(name) {
  return name.toLowerCase().endsWith(".kif") || name.toLowerCase().endsWith(".kifu");
}

function makePagesBaseUrl() {
  return `https://${state.user}.github.io/${state.repo}/`;
}

function makeViewerUrl(kifPath) {
  const base = makePagesBaseUrl();
  const viewer = `${base}viewer/index.html`;
  return `${viewer}?o=${encodeURIComponent(state.user)}&r=${encodeURIComponent(state.repo)}&p=${encodeURIComponent(
    kifPath
  )}&b=${encodeURIComponent(state.branch)}`;
}

function showEmbedUrl(url) {
  if (elOutput) elOutput.textContent = url;
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

    const name = document.createElement("button");
    name.textContent = item.name;
    name.style.textAlign = "left";

    if (item.type === "dir") {
      name.onclick = () => {
        state.path = item.path;
        loadPath();
      };
    } else {
      name.disabled = !isKif(item.name);
      name.title = isKif(item.name) ? "このKIFを選択" : "KIFのみ選択できます";
      name.onclick = () => {
        const kifPath = item.path;
        const url = makeViewerUrl(kifPath);
        showEmbedUrl(url);
        setStatus("Embed URL を生成しました。Copyでコピーできます。");
      };
    }

    row.appendChild(name);
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
  showEmbedUrl("");
  loadPath();
});

btnCopy?.addEventListener("click", async () => {
  const txt = (elOutput?.textContent || "").trim();
  if (!txt) {
    setStatus("まだURLがありません。KIFを選んでください。");
    return;
  }

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

setStatus("GitHub情報を入れて Load Files を押してください。");

});

// 初期表示
setStatus("GitHub username を入れて Load Files を押してください。");
