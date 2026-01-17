// docs/generator.js
(() => {
  const $ = (id) => document.getElementById(id);

  const elUser = $("gh-user");
  const elRepo = $("gh-repo");
  const elBranch = $("gh-branch");
  const btnLoad = $("btn-load");

  const listBox = $("file-list");
  const breadcrumb = $("breadcrumb");
  const statusBox = $("status");

  // 「固定」にしたいならここを "kif" にする（例: repoの中に kif/ フォルダを作る運用）
  const FIXED_ROOT = ""; // 例: "kif"

  // 深さ制限（4段）
  const MAX_DEPTH = 4;

  function setStatus(msg) {
    if (!statusBox) return;
    statusBox.textContent = msg || "";
  }

  function joinPath(a, b) {
    if (!a) return b || "";
    if (!b) return a;
    return `${a.replace(/\/+$/, "")}/${b.replace(/^\/+/, "")}`;
  }

  function splitPath(p) {
    return (p || "").split("/").filter(Boolean);
  }

  function depthOf(path) {
    return splitPath(path).length;
  }

  function apiUrl(owner, repo, path, branch) {
    const encodedPath = path ? `/${encodeURIComponent(path).replace(/%2F/g, "/")}` : "";
    const ref = branch ? `?ref=${encodeURIComponent(branch)}` : "";
    return `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents${encodedPath}${ref}`;
  }

  async function fetchContents(owner, repo, path, branch) {
    const url = apiUrl(owner, repo, path, branch);
    const res = await fetch(url, {
      headers: {
        "Accept": "application/vnd.github+json",
      },
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`GitHub API error ${res.status}: ${text || res.statusText}`);
    }
    return res.json();
  }

  function clearList() {
    listBox.innerHTML = "";
  }

  function renderBreadcrumb(path, onNavigate) {
    if (!breadcrumb) return;

    const parts = splitPath(path);
    breadcrumb.innerHTML = "";

    const rootBtn = document.createElement("button");
    rootBtn.type = "button";
    rootBtn.textContent = FIXED_ROOT ? `/${FIXED_ROOT}` : "/(root)";
    rootBtn.onclick = () => onNavigate(FIXED_ROOT);
    breadcrumb.appendChild(rootBtn);

    let acc = FIXED_ROOT;
    for (const part of parts.slice(splitPath(FIXED_ROOT).length)) {
      const sep = document.createElement("span");
      sep.textContent = " / ";
      breadcrumb.appendChild(sep);

      acc = joinPath(acc, part);
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = part;
      btn.onclick = () => onNavigate(acc);
      breadcrumb.appendChild(btn);
    }
  }

  function renderItems(items, onOpenFolder, onSelectFile) {
    clearList();

    // folder -> file の順
    const folders = items.filter((x) => x.type === "dir").sort((a, b) => a.name.localeCompare(b.name));
    const files = items.filter((x) => x.type === "file").sort((a, b) => a.name.localeCompare(b.name));

    const makeRow = (label, kind, onClick) => {
      const row = document.createElement("div");
      row.className = "row";

      const badge = document.createElement("span");
      badge.className = "badge";
      badge.textContent = kind;

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "item";
      btn.textContent = label;
      btn.onclick = onClick;

      row.appendChild(badge);
      row.appendChild(btn);
      listBox.appendChild(row);
    };

    for (const f of folders) {
      makeRow(f.name, "DIR", () => onOpenFolder(f.path));
    }

    for (const f of files) {
      // kifだけ見せたいならここで制限
      const isKif = f.name.toLowerCase().endsWith(".kif");
      if (!isKif) continue;
      makeRow(f.name, "KIF", () => onSelectFile(f.path));
    }

    if (listBox.children.length === 0) {
      const p = document.createElement("div");
      p.textContent = "（このフォルダには .kif がありません）";
      listBox.appendChild(p);
    }
  }

  async function loadAt(path) {
    const owner = (elUser?.value || "").trim();
    const repo = (elRepo?.value || "").trim();
    const branch = (elBranch?.value || "main").trim();

    if (!owner || !repo) {
      setStatus("username / repo を入力してね");
      return;
    }

    // 固定Root運用なら、ユーザーが勝手に深いところへ行けないようにする
    const root = FIXED_ROOT;
    if (root && !splitPath(path).join("/").startsWith(splitPath(root).join("/"))) {
      path = root;
    }

    // 深さ制限（root からの差分で MAX_DEPTH）
    const rootDepth = depthOf(root);
    const curDepth = depthOf(path);
    if (curDepth - rootDepth > MAX_DEPTH) {
      setStatus(`階層が深すぎるのでここまで（最大 ${MAX_DEPTH} 階層）`);
      return;
    }

    setStatus("読み込み中...");
    renderBreadcrumb(path, loadAt);

    try {
      const data = await fetchContents(owner, repo, path, branch);

      if (!Array.isArray(data)) {
        setStatus("ここはフォルダじゃないみたい（ファイルを直接開いてる可能性）");
        return;
      }

      setStatus("");
      renderItems(
        data,
        (nextPath) => loadAt(nextPath),
        (filePath) => {
          // ここは次フェーズで「Embed URL生成」に使う。今は選択を表示するだけ。
          setStatus(`選択: ${filePath}`);
        }
      );
    } catch (e) {
      setStatus(`失敗: ${e.message}`);
    }
  }

  if (btnLoad) {
    btnLoad.addEventListener("click", () => loadAt(FIXED_ROOT));
  }
})();
