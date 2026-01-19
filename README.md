# shogi-notion-viewer

Notionに埋め込める「将棋KIFビューア」＋「埋め込みURLジェネレーター」です。  
KIFファイルは GitHub attaching & backing via GitHub（＝自分のrepo内）に置いて管理します。  
GeneratorでKIFを選ぶ → Embed URL をコピー → Notionに貼る、だけ。

---

## できること

- GitHub repo 内の `kif/` フォルダをブラウズ（フォルダ階層OK）
- `.kif ` を選ぶと **Notion埋め込み用URL** を生成
- URLをコピー（Copyボタン）
- Notionに埋め込むと将棋盤として表示（viewer）  

---

## 共有とプライバシー（大事）
本システムは **公開リポジトリ + GitHub Pages** が前提です。   
Notionに埋め込みとして使用する都合上、Web上に公開されていなければなりません。  
「無料で使える」と「ストレージと使用制限回数を気にしなくていい」を優先しているため、GitHub Pagesを使用しています。  
つまり、`kif/` に置いた棋譜は基本「誰でも見られる」可能性があります。  
見られにくくする対策は、次章の「使い方（Forkしないで使う方法・推奨）」に記載しています。  

- 非公開にしたい棋譜は置かない
- 個人情報を含む棋譜やメモは避ける  

---

## 使い方（Forkしないで使う方法・推奨）

研究に使用される場合は、 **Forkせず** に、ZIPでダウンロードして使うことを推奨します。  
（Forkでも可能ですが、あなたの研究内容に辿り着きやすくなってしまいます。）  
普段使用しないアカウントで、リポジトリ名を変えて使用すると、見つけられにくくなると思われます。

### 手順

1. 右上の「Code」→「Download ZIP」
2. ZIPを解凍
3. GitHubで「New repository」を作成
4. 解凍した中身をそのままアップロード
5. GitHub Pages を `main / docs` に設定

これで自分専用の将棋ビューアが完成します。


公開URLはだいたいこうなります（URL生成ページ）：
- `https://<あなたのusername>.github.io/<あなたが設定したリポジトリ名>/`

---

## 1) 盤面生成したいKIFファイルをアップロード（自分の棋譜保管場所）
`kif/` 配下に `.kif`をアップロード。  （.kifでファイルを作って編集欄にKIF形式をペーストでも可能）

例（階層は自由。深くしてもOK）：
kif/
先手/
相掛かり/△94歩/○○の変化/test.kif

---

## 2) GeneratorでURL生成 → Notionに貼る

### Generator（URLを作るページ）
- `https://<あなたのユーザー名>.github.io/<あなたが設定したリポジトリ名>/`  
  （ここが Generator です）

手順：
1. **GitHub Username** に「あなたのユーザー名」を入力
2. **Repository name** に「あなたが設定したリポジトリ名」を入力
3. **Load Files**
4. `kif/` の中を辿ってKIFをクリック
5. **Embed URL** が出る → **Copy**

### Viewer（棋譜を表示するページ）
Generatorが作ったURLをNotionに埋め込むと viewer が開きます。  
（例：`.../viewer/index.html?o=...&r=...&p=...&b=main`）

---

## Notionへの埋め込み方法（例）
- Notionで `/embed` → URLを貼る  
- もしくは URL を貼って “Embed” を選ぶ

---

## ライセンス
このリポジトリは MIT License です（`LICENSE` を参照）。

---
## クレジット

本プロジェクトでは、worldace 氏が開発した将棋棋譜ビューア  
**shogitime** を使用しています。

GitHub:  
https://github.com/worldace/shogitime

shogitime はパブリックドメインとして公開されており、自由に利用できます。

使用素材・参考資料:

- 画像: 将棋アプリ用クリエイティブコモンズ画像  
  http://mucho.girly.jp/bona/

- 効果音: Kenney  
  http://www.kenney.nl/

- KIF形式仕様:  
  http://kakinoki.o.oo7.jp/kif_format.html


