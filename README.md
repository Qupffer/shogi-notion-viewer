# shogi-notion-viewer

Notionに埋め込める「将棋KIFビューア」＋「埋め込みURLジェネレーター」です。  
KIFファイルは GitHub attaching & backing via GitHub（＝自分のrepo内）に置いて管理します。  
GeneratorでKIFを選ぶ → Embed URL をコピー → Notionに貼る、だけ。

---

## できること

- GitHub repo 内の `kif/` フォルダをブラウズ（フォルダ階層OK）
- `.kif / .kifu` を選ぶと **Notion埋め込み用URL** を生成
- URLをコピー（Copyボタン）
- Notionに埋め込むと将棋盤として表示（viewer）

---

## 使い方（最短）

### 1) Fork（自分用リポジトリを作る）
1. このリポジトリ右上の **Fork** を押す  
2. 自分のアカウント配下に `shogi-notion-viewer` を作る  
   - repo名は基本そのまま推奨（変更しても動くけどURLが変わる）

### 2) GitHub Pages をONにする（重要）
1. Forkした自分のリポジトリ → **Settings**  
2. 左メニュー **Pages**  
3. **Build and deployment** → Source を **Deploy from a branch**  
4. Branch を **main** / Folder を **/docs** にする → Save  
5. 数十秒〜数分で公開されます（初回は少し時間がかかることがあります）

公開URLはだいたいこうなります：
- `https://<あなたのusername>.github.io/shogi-notion-viewer/`

---

## 3) 盤面生成したいKIFファイルを入力（自分の棋譜保管場所）
この repo の `kif/` 配下に `.kif`を置きます。  
例（階層は自由。深くしてもOK）：
kif/
先手/
相掛かり/△94歩/○○の変化/test.kif
後手/
角換わり/test2.kif
.keep


GitHub上でフォルダ作成 → “Add file” → “Create new file” で `.keep` を置くと空フォルダも保持できます。

---

## 4) GeneratorでURL生成 → Notionに貼る

### Generator（URLを作るページ）
- `https://<あなたのusername>.github.io/shogi-notion-viewer/`  
  （ここが Generator です）

手順：
1. **GitHub Username** に自分のユーザー名を入力
2. **Load Files**
3. `kif/` の中を辿ってKIFをクリック
4. **Embed URL** が出る → **Copy**

### Viewer（棋譜を表示するページ）
Generatorが作ったURLをNotionに埋め込むと viewer が開きます。  
（例：`.../viewer/index.html?o=...&r=...&p=...&b=main`）

---

## Notionへの埋め込み方法（例）
- Notionで `/embed` → URLを貼る  
- もしくは URL を貼って “Embed” を選ぶ

---

## よくあるトラブル

### 反映されない / 昨日まで動いてたのに…
GitHub Pages の反映が遅延・キャッシュされることがあります。
- すぐ見たい：URL末尾に `?v=1` を付ける（例：`.../?v=2`）
- もしくは Ctrl+F5（スーパーリロード）

### 404 / 見つからない
- Pages設定が `main / docs` になっているか確認
- 公開URLが自分の username になっているか確認（Fork先のURLになります）

---

## 共有とプライバシー（大事）
この仕組みは **公開リポジトリ + GitHub Pages** が前提です。  
つまり、`kif/` に置いた棋譜は基本「誰でも見られる」可能性があります。

- 非公開にしたい棋譜は置かない
- 個人情報を含む棋譜やメモは避ける  
（どうしても非公開でやる場合は別方式が必要になります）

---

## ライセンス
このリポジトリは MIT License です（`LICENSE` を参照）。

---
## 開発者向けメモ（任意）
- Generator: `docs/index.html` + `docs/generator.js`
- Viewer: `docs/viewer/index.html` + `docs/viewer/viewer.js`（など）
- KIF置き場: `kif/`（固定）

