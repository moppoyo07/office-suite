# 印刷ページ実装ガイド（Manecto帳票）

## 鉄則: `window.open()` + `document.write()` 方式

React SPA内でのCSS `@media print` や `window.print()` は**使わない**こと。
ダークモード・MUIテーマ・グローバルCSSが干渉し、白紙・色抜け・レイアウト崩れの原因になる。

### 正しいパターン

```javascript
const handlePrint = () => {
    const html = generatePrintHTML(data);
    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
        setTimeout(() => printWindow.print(), 500);
    } else {
        alert('ポップアップがブロックされました。');
    }
};
```

### HTML生成テンプレート

```javascript
const generatePrintHTML = (data) => `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>帳票名</title>
    <style>
        @page { size: A4 portrait; margin: 10mm; }
        body {
            font-family: 'Hiragino Kaku Gothic ProN', 'Meiryo', sans-serif;
            font-size: 9pt;
            color: #000;
            background: #fff;
            margin: 0;
            padding: 5mm;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
        }
        table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
        td, th {
            border: 1px solid #000;
            padding: 3px 5px;
            vertical-align: top;
        }
        th { background-color: #f0f0f0; font-weight: bold; text-align: center; }
        .sec-title {
            background-color: #000;
            color: #fff;
            padding: 3px 8px;
            font-weight: bold;
            font-size: 10pt;
        }
        .page-break { page-break-before: always; }
    </style>
</head>
<body>
    <!-- 帳票内容 -->
</body>
</html>`;
```

---

## チェックリスト

| # | 項目 | 説明 |
|---|------|------|
| 1 | **独立HTML** | 印刷内容はテンプレートリテラルで完全なHTML文書を生成。React/MUIは使わない |
| 2 | **`print-color-adjust: exact`** | bodyに `-webkit-print-color-adjust: exact !important` を必ず指定。背景色が印刷される |
| 3 | **色は直接指定** | `color: #000`, `background-color: #000` を直接指定。CSS変数やテーマ参照は不可 |
| 4 | **テーブルレイアウト** | flexbox/gridではなくtableを使う。印刷時の改ページ挙動が安定 |
| 5 | **改ページ** | `page-break-before: always` の div で明示的にページ分割 |
| 6 | **フォント** | 和文: `'Hiragino Kaku Gothic ProN', 'Meiryo', sans-serif`。Web Fontは使わない |
| 7 | **margin** | `@page { margin: 10mm }` で余白指定。body padding は 5mm |
| 8 | **ポップアップ** | `window.open()` はブラウザにブロックされる可能性あり。alertで案内 |
| 9 | **setTimeout** | `document.close()` 後 500ms 待ってから `print()` を呼ぶ。即呼びだと空白になる場合あり |
| 10 | **列幅** | `width: XX%` でth/tdに直接指定。autoだとブラウザ依存で崩れる |

---

## やってはいけないこと

| NG | 理由 |
|----|------|
| React SPA内で `window.print()` | ダークモードCSS・MUIテーマが適用され白紙になる |
| MUI `Box`, `Typography` を印刷HTML内で使用 | MUIのemotion CSSはnew windowに引き継がれない |
| `@media print` でReact画面を印刷 | グローバルCSSの競合で予測不能なレイアウト |
| CSS変数 `var(--xxx)` を印刷HTML内で使用 | 新ウィンドウにCSS変数は存在しない |
| Web Font (`@import`) | 新ウィンドウでは読み込みが間に合わない場合がある |
| `react-to-print` ライブラリ | MUI/ダークモードと干渉する。Manectoでは使用禁止 |

---

## 既存の帳票ファイル

| ファイル | 帳票名 |
|----------|--------|
| `src/pages/ClientPrintPage.jsx` | **統合印刷ページ**（一括印刷 + 個別印刷） |
| `src/pages/FaceSheetPrintPage.jsx` | フェイスシート（個別アクセス用） |
| `src/pages/AssessmentSheetPrintPage.jsx` | アセスメント様式1・2（個別アクセス用） |
| `src/pages/AssessmentSheetMentalPrintPage.jsx` | 精神・医療アセスメント（個別アクセス用） |
| `src/pages/AssessmentPrintPage.jsx` | アセスメント全6ページ（新アセスメント機能用） |
| `src/pages/RetentionSupportPrintPage.jsx` | 定着支援レポート |

---

## 新しい帳票を追加する手順

1. `src/pages/` に新しいページファイルを作成
2. `generateXxxHTML()` 関数で完全なHTML文書を生成（上記テンプレート準拠）
3. `ClientPrintPage.jsx` に生成関数を追加し、個別/一括印刷ボタンに組み込む
4. 必要に応じてルートを `src/routes/client.routes.jsx` に追加

---

## データ構造の注意

印刷ページはFirestoreから直接データを取得する。コレクションと主要フィールドを確認してから実装すること。

| コレクション | 用途 | 主キー |
|---|---|---|
| `clients` | CRM利用者情報 | ドキュメントID |
| `assessments` | フェイスシート・アセスメント（1利用者1レコード） | clientId と同じ |
| `activityLogs` | 活動記録 | ドキュメントID |

---

*最終更新: 2026-02-20*
