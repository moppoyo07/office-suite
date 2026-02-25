# Manecto システム設計書

## 概要

Manectoは障害福祉サービス事業所向けの業務管理システムです。

## アーキテクチャ

```
packages/
└── dashboard/          ← メインアプリ（React + Vite）
    ├── src/
    │   ├── features/   ← 機能別コンポーネント
    │   ├── pages/      ← ページコンポーネント
    │   ├── routes/     ← ルート定義
    │   └── firebase/   ← Firebase設定
    └── ...
```

## データベース（Firestore）

### コレクション一覧

| コレクション | 用途 | キー |
|-------------|------|------|
| `companies` | 企業情報 | companyId |
| `branches` | 支店（事業所）情報 | branchId |
| `clients` | 利用者情報 | clientId |
| `staff` | スタッフ情報 | staffId |
| `attendanceRecords` | 出席記録 | recordId |
| `serviceRecords` | サービス記録 | recordId |
| `dailyCheckins` | チェックイン詳細 | checkinId |

### 申請書類関連（新規）

| コレクション | 用途 | キー |
|-------------|------|------|
| `applicationChecklists` | 申請チェック進捗 | branchId |
| `applicationForms` | 帳票入力データ | branchId/formType |
| `changeReports` | 変更届履歴 | branchId/reportId |

## ロール権限

| ロール | 説明 | 権限レベル |
|--------|------|-----------|
| `platform_owner` | プラットフォーム管理者 | 全権限 |
| `company_admin` | 企業管理者 | 企業配下全て |
| `branch_manager` | 支店管理者 | 支店配下全て |
| `branch_staff` | 支店スタッフ | 日常業務のみ |

## ルート構造

### /admin（企業管理）
- `/admin/companies` - 企業管理
- `/admin/branches` - 支店管理
- `/admin/users` - ユーザー管理
- `/admin/applications` - 申請書類管理

### /support（支店業務）
- `/support/dashboard` - ダッシュボード
- `/support/daily-checkin` - 日次出欠
- `/support/monthly-planner` - 月間計画
- `/support/service-records` - サービス記録
- `/support/change-reports` - 変更届（予定）

### /client（利用者ポータル）
- `/client/checkin` - セルフチェックイン
