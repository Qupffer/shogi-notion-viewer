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

const elOutput = document.querySelector(".output"); // 3. Embed URL の表示先
const btnCopy = document.querySelector("button");  // Copyボタン（ページ内で最初のbutton想定）

let state = {
  user: "",
  repo: "",
  branch: "",
  path: "kif", // ここが「固定したい場所」(例: kif フォルダ)
};

function setStatus(msg) {
  if (elStatus) elStatus.textContent = msg;
}

function buildApiUrl(path) {
  // GitHub Contents API
  // https://api.github.com/repos/:owner/:repo/contents/:path?ref=:branch
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
  // 例: kif/先手/相掛かり
  const parts = state.path.split("/").filter(Boolean);
  elBreadcrumb.innerHTML = "";

  // ルート（固定）に戻る
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
  return name.toLowerCase().endsWith(".kif") || name.toLowerCase().endsWith(".kifu");
}

function makePagesBaseUrl() {
  // GitHub Pages: https://{user}.github.io/{repo}/
  return `https://${state.user}.github.io/${state.repo}/`;
}

function makeViewerUrl(kifPath) {
  // あなたのviewerの入口URLに合わせる：
  // 例: docs/viewer/index.html があるなら → viewer/index.html
  // そこに ?kif=... を渡す
  const base = makePagesBaseUrl();
  const viewer = `${base}viewer/index.html`;
  return `${viewer}?kif=${encodeURIComponent(kifPath)}`;
}

function showEmbedUrl(url) {
  if (elOutput) elOutput.textContent = url;
}

function renderList(items) {
  elFileList.innerHTML = "";

  // フォルダ→ファイルの順に並べる
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
        state.path = item.path; // 次の階層へ
        loadPath();
      };
    } else {
      // ファイル
      name.disabled = !isKif(item.name);
      name.title = isKif(item.name) ? "このKIFを選択" : "KIFのみ選択できます";
      name.onclick = () => {
        const kifPath = item.path; // 例: kif/先手/相掛かり/a.kif
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

  // ここが「固定」ポイント：必ず kif/ から始める
  state.path = "kif";
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
    setStatus("コピー失敗。手動で選択してコピーしてください。");
  }
});

// ページを開いた直後の初期表示
setStatus("GitHub情報を入れて Load Files を押してください。");
