# マルチテナント分離 修正メモ

作成日: 2026-03-16
担当: 開発チーム

---

## 背景・概要

Manecto はマルチテナント（複数企業）対応のアプリ。各企業のデータは `companyId` フィールドで分離する設計。
しかし当初は Firestore クエリに `companyId` フィルターが入っておらず、全企業のデータが丸見えになっていた。
2026-03 に大規模修正を実施。以下は残作業と完了済みの記録。

---

## 企業ID（companyId）の構成

| 企業 | companyId | 状態 |
|---|---|---|
| プレジング / Presing Social Service | `sNS7ctyhQ97WZyfIV8jq` | ← ドキュメント上の記録（要確認） |
| 就労移行ITスクール（仮名） | `hiroshima001` | ← Claudeが新規作成した正規ID |

> **重要**: `companies` コレクションに各 companyId と同じドキュメントIDで会社ドキュメントを作成すること。
> 例: `companies/sNS7ctyhQ97WZyfIV8jq` に `{ name: "プレジング" }` のドキュメントが必要。

---

## ⚠️ 重複企業ID問題（2026-03-19 判明）

### 経緯
- 元々 Presing Social Service には旧ID `9BfW9nvYms2zYoAgRSUU` が存在していた
- Claude がコード修正作業中にこのIDを読み込めず、新規に `hiroshima001`（または別ID）を生成してしまった
- 結果として `companies` コレクションに同じ社名のドキュメントが2つ存在する状態になった
- プラットフォームダッシュボードの「企業別状況」で「Presing Social Service」が2行表示される

### 旧IDの残存箇所（2026-02-13 時点で確認）
- `userInvitations` コレクション内のドキュメントが `companyId: "9BfW9nvYms2zYoAgRSUU"` を参照している
  - 招待者: 圷 洋 (`youcha0214@gmail.com`)
  - `branchId: "bS9n0h8UfO9tLgmRUL1p"`

### 正しい対応（削除前に必ず確認）
1. `/admin/data-migration` → 「重複企業をチェックする」で2件を比較
2. **データが多い方**（clients・users・branches件数が多い方）が **正規ID**
3. **データが0件の方**が不要な重複 → 削除する
4. 削除後、旧IDを参照している `userInvitations` 等の残存データも更新が必要な場合あり

### ルール（今後の開発で守ること）
- **絶対に新しい companyId を勝手に作らない**
- 既存企業の companyId が不明な場合は Firestore コンソールで `companies` コレクションを確認する
- companyId は `companies/{companyId}` のドキュメントIDと一致している必要がある

---

## 修正済み一覧 ✅

| ファイル | 修正内容 |
|---|---|
| `hooks/useCurrentUser.js` | `userDocId` を使って正しいユーザードキュメントを参照するよう修正 |
| `hooks/useActivityFeed.js` | `companyId` フィルター追加 |
| `hooks/useActivityLog.js` | 活動ログ保存時に `companyId` を付与 |
| `hooks/useNotificationAlerts.js` | `companyId` フィルター追加 |
| `features/clients/ClientOnsitePage.jsx` | `companyId` フィルター追加 |
| `features/clients/ClientRemotePage.jsx` | `companyId` フィルター追加 |
| `features/clients/ClientListPage.jsx` | `companyId` フィルター追加 |
| `features/clients/ClientCompletedListPage.jsx` | `companyId` フィルター追加 |
| `features/admin/branches/BranchListPage.jsx` | `companyId` フィルター追加、userLoading 待機処理追加 |
| `features/admin/users/UserListPage.jsx` | `companyId` フィルター追加、userLoading 待機処理追加、自社の会社名取得修正 |
| `features/admin/AdminDashboard.jsx` | 支店数・ユーザー数カウントに `companyId` フィルター追加 |
| `pages/SupportWorkPage.jsx` | `companyId` フィルター追加、`or()` → `in[]` に変更 |
| `pages/MonthlyAccountingPage.jsx` | `companyId` フィルター追加 |
| `pages/MonthlyCheckInSummaryPage.jsx` | `companyId` フィルター追加 |
| `pages/WelfareTrainingPage.jsx` | `companyId` フィルター追加 |
| `pages/FollowUpListPage.jsx` | `companyId` フィルター追加 |
| `pages/CVAnalysisPage.jsx` | `companyId` フィルター追加 |
| `pages/AverageUsersPage.jsx` | `companyId` フィルター追加 |
| `pages/ClientAttendanceGanttPage.jsx` | `companyId` フィルター追加 |
| `firestore.indexes.json` | 複合インデックス追加（companyId + date 等） |

---

## 未修正・残作業 ⚠️

### 1. 支店管理内の詳細ページ（中身が表示されない）

**ファイル**: `features/admin/branches/BranchDetailPage.jsx`
**症状**: 支店一覧では自社の支店だけ表示されるようになったが、支店をクリックして詳細を開くと内容が表示されない
**原因**: 不明（companyId フィルター関連の可能性あり、または別の問題）
**優先度**: 中

---

### 2. 平均利用者数算定シート

**ファイル**: `pages/AverageUsersPage.jsx` または `pages/AverageUsersSheetPage.jsx`
**症状**: 他社のデータが混在している可能性あり
**対応**: `companyId` フィルター確認・追加
**優先度**: 中

---

### 3. 支店管理内の他コンポーネント

支店詳細ページ内でスタッフ一覧・クライアント一覧等を表示している場合、それらにも `companyId` フィルターが必要な場合がある。
**ファイル**: `features/admin/branches/BranchDetailPage.jsx` 内のデータ取得処理
**優先度**: 中

---

## フィルター実装パターン（共通テンプレート）

新しいページにフィルターを追加する際は以下のパターンを使うこと：

```jsx
import { useCurrentUser } from '../hooks/useCurrentUser';

const { isPlatform, companyId, loading: userLoading } = useCurrentUser();

useEffect(() => {
    if (userLoading) return;                    // ユーザー情報ロード待ち
    if (!isPlatform && !companyId) return;      // companyId なしは処理しない

    const fetchData = async () => {
        // platform_owner は全件、それ以外は自社のみ
        const companyFilter = !isPlatform ? [where('companyId', '==', companyId)] : [];
        const q = query(collection(db, 'xxxxx'), ...companyFilter);
        // ...
    };
    fetchData();
}, [isPlatform, companyId, userLoading]);
```

> **ポイント**: `userLoading` を deps に入れて待機すること。
> これがないと `companyId = null` の状態でクエリが走り、フィルターが効かずに全件取得してしまう。

---

## Firestore データ要件

各コレクションのドキュメントに `companyId` フィールドが必要：

| コレクション | companyId フィールド |
|---|---|
| `users` | 必須（ユーザー招待時に自動付与） |
| `branches` | 必須（支店登録時に自動付与） |
| `clients` | 必須（クライアント登録時に自動付与） |
| `attendanceRecords` | 必須 |
| `attendancePlans` | 必須 |
| `activity_logs`（サブコレクション） | 必須（useActivityLog.js で自動付与済み） |

> 古いデータに `companyId` がない場合はマイグレーションが必要。
> `/admin/data-migration` ページからマイグレーション実行可能（AdminDataMigrationPage）。

---

## platform_owner について

- `role: "platform_owner"` のユーザーは `isPlatform = true` となり、全企業のデータにアクセス可能
- `companyId` が設定されていても `isPlatform` が true なら全件フィルターなし
- `/platform` ルートは `platform_owner` と `platform_staff` のみアクセス可能（PlatformGuard）
- **注意**: `users` コレクション内でメールアドレスが重複するドキュメントがあると、ロールが誤って読み込まれる。重複ドキュメントは削除すること。
