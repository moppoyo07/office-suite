# 申請書類機能 設計書

## 概要

障害福祉サービス（就労移行支援）の指定申請・変更届を管理する機能。

## 機能構成

### 1. 新規申請（/admin/applications）

**対象ロール**: company_admin

```
新規申請チェックリスト
├── 23項目のチェックリスト
├── 進捗管理（○/23件完了）
└── 帳票入力フォームへのリンク
```

**帳票一覧**:
- 様式第1号（指定申請書）
- 付表8（就労移行支援）
- 参考様式1〜11
- その他添付書類

### 2. 変更届（/support/change-reports）

**対象ロール**: company_admin, branch_manager

```
変更内容選択（1〜17）
├── 1. 事業所名称の変更
├── 2. 所在地の変更
├── ...
├── 8. 管理者の変更
└── 17. その他
    ↓
必要書類を自動判定
    ↓
書類セット印刷/PDF出力
```

## ファイル構造

```
src/
├── pages/
│   ├── forms/                       ← 帳票コンポーネント
│   │   ├── ApplicationForm1Page.jsx  ← 様式第1号
│   │   ├── Appendix8Page.jsx         ← 付表8
│   │   └── RefForm1Page.jsx          ← 参考様式1
│   │
│   ├── NewApplicationChecklistPage.jsx
│   └── ChangeReportPage.jsx
│
├── features/
│   ├── applications/
│   │   ├── checklistData.js         ← チェックリスト定義
│   │   └── formMappings.js          ← 帳票マッピング
│   │
│   └── change-reports/
│       └── changeMatrix.js          ← 変更→書類判定ロジック
```

## データ構造

### applicationChecklists/{branchId}

```javascript
{
  checkedItems: { 1: true, 2: false, ... },
  status: 'in_progress' | 'completed',
  updatedAt: Timestamp,
  updatedBy: 'userId'
}
```

### applicationForms/{branchId}

```javascript
{
  form1: { /* 様式第1号の入力データ */ },
  appendix8: { /* 付表8の入力データ */ },
  ...
}
```

## 帳票レイアウト方針

**課題**: 行政様式の正確な再現が困難

**選択肢**:
1. HTMLテーブル（入れ子）で地道に組む
2. オーバーレイ方式（背景画像+入力欄）
3. Excel出力

**現状**: HTMLテーブルで基本構造を実装中。
今後、より正確なレイアウトが必要な場合は再検討。

## 今後の拡張

- [ ] 複数自治体対応（広島市以外）
- [ ] 提出履歴管理
- [ ] メール送信機能（自治体へのPDF送付）
