# Manecto プロジェクトバイブル
**このドキュメントは、Manectoの思想・設計・実装・将来展望を包括的に記録したものです。**
**開発者が変わっても、AIに引き継ぐときも、これ1つで全体を把握できることを目指しています。**

最終更新: 2026年2月

---

## 目次

1. [なぜ作ったか・何を解決したいか](#1-なぜ作ったか何を解決したいか)
2. [就労移行支援の業務フローとManectoの対応関係](#2-就労移行支援の業務フローとmanectoの対応関係)
3. [技術選定の理由](#3-技術選定の理由)
4. [現状できること・できないこと](#4-現状できることできないこと)
5. [B型を作る場合に何が変わるか](#5-b型を作る場合に何が変わるか)
6. [次の開発者へのガイド](#6-次の開発者へのガイド)

---

## 1. なぜ作ったか・何を解決したいか

### プロダクトの背景

就労移行支援事業所の現場では、以下のような業務課題が長年放置されてきた。

- **紙とExcelによる記録管理**：サービス記録・出席管理・支援計画がバラバラのファイルで管理され、集計・共有が困難
- **利用者の動向把握の遅れ**：問い合わせから見学・体験・利用開始までの追客が属人化し、担当者が変わると引き継ぎが機能しない
- **定着支援の形骸化**：就職後の定着支援レポートが書類仕事として処理され、実際の支援に活きていない
- **スタッフのモチベーション管理**：日常業務のやりがいが見えにくく、離職率が高い

> ← **オーナーの言葉でここに追記してください。**
> 例：「自分がこの業界に入って感じた一番の課題は〇〇だった」
> 「既存のシステム（〇〇）は△△が足りなかった」など

### Manectoが解決しようとしていること

| 課題 | Manectoのアプローチ |
|------|-------------------|
| 記録がバラバラ | Firestoreに一元化。どの端末からでもリアルタイムで参照・更新できる |
| 追客の属人化 | 追客リストにエスカレーション機能。連絡回数に応じて次回予定を自動計算 |
| 定着支援の形骸化 | 定着支援レポートをアプリ内で記録・印刷まで完結 |
| スタッフのやる気 | クエストシステム（ポイント制）で日常業務をゲーム化 |
| 情報の非対称 | HOTDOGロール：特定のユーザーに「管理者に見せかけた最小権限」を付与 |

### プロダクトのポジション

Manectoは**自社（就労支援事業所）の業務を効率化するために生まれたが、将来的には複数の事業所に提供するSaaSとして拡張できる設計になっている。**

- 現在：自社での実運用・検証フェーズ
- 将来：他事業所への展開（マルチテナント設計済み）

> ← **将来の方向性についてここに追記してください。**
> 例：「有料プランは〇〇円を想定」「競合は〇〇だが△△で差別化する」など

---

## 2. 就労移行支援の業務フローとManectoの対応関係

### 就労移行支援とは

就労移行支援は障害を持つ方が一般企業への就労を目指すための訓練・支援を行うサービス。
利用期間は原則2年（延長可）。事業所は利用者の就労定着実績によって報酬が変わる。

### 業務フロー全体とManectoの対応

```
【フェーズ1：問い合わせ〜見学・体験】
  問い合わせ受付
       ↓
  電話・メールで追客           ← 追客リスト（FollowUpListPage）
       ↓                          エスカレーション自動計算
  見学・体験の案内・実施
       ↓
  利用開始 or ロスト

【フェーズ2：利用中】
  受給者証・契約手続き
       ↓
  個別支援計画の作成           ← アセスメントシート（AssessmentWizard）
       ↓
  毎日の出退席管理             ← チェックイン（DailyCheckinPage）
                                  月間出席計画（MonthlyPlannerPage）
       ↓
  週次・月次のサービス記録     ← サービス記録（ServiceRecordListPage）
                                  出退時間のインライン編集
       ↓
  訓練・活動・面談             ← 活動ログ（ActivityLogBoard）
       ↓
  就職活動支援

【フェーズ3：就職・定着支援】
  就労定着                     ← 定着支援（RetentionReportPage）
       ↓                          定着支援レポート印刷
  定着支援（最長3年6ヶ月）
       ↓
  定着確認・完了

【バックオフィス】
  月次統計・請求               ← 平均利用者数シート（AverageUsersSheetPage）
  スタッフ管理                 ← ユーザー管理（admin/users）
  権限管理                     ← RBACコントロールパネル
```

### 利用者のステータス管理

`clients` コレクションの `status` フィールドで管理。CRMカンバンボードで視覚的に確認できる。

| ステータスID | 表示名 | 説明 |
|------------|--------|------|
| `inquiry` | 問い合わせ | 最初の接触。追客リストに表示される |
| `tour` | 見学 | 見学予定・実施済み |
| `trial` | 体験 | 体験利用中・予定 |
| `enrolled` | 利用中 | 正式契約・訓練中 |
| `job_hunting` | 就職活動中 | 求職活動フェーズ |
| `employed` | 就職済み | 一般就労達成 |
| `follow_up_m1〜m5` | 定着支援中 | 就職後の定着支援フォロー |
| `completed` | 完了 | 定着支援終了 |
| `lost` | ロスト | 利用中断・辞退 |

### 追客ロジック（重要）

問い合わせ後の電話連絡回数に応じて次回予定日を自動計算する。

| 試行回数 | 次回まで |
|---------|---------|
| 1回目 | 翌日 |
| 2回目 | 翌日 |
| 3回目 | 3日後 |
| 4回目 | 7日後 |
| 5回目 | 12日後 |
| 6回目 | 30日後 |
| 7回目以降 | 31日後 |

**問い合わせ以外のステータス**（見学後保留など）：電話・メール記録のたびに **2日後** を自動セット。

---

## 3. 技術選定の理由

### スタック概要

| 技術 | バージョン | 選定理由 |
|------|-----------|---------|
| React | 19.x | デファクトスタンダード。コンポーネント設計でUI管理しやすい |
| Vite | 7.x | 開発サーバーが高速。HMRで体験が良い |
| MUI (Material UI) | 7.x | 完成度の高いUIコンポーネント群。業務アプリに向いている |
| React Router | 7.x | SPA向けルーティング。ロールによるルート保護が実装しやすい |
| Firebase Auth | - | Googleログインが数行で実装できる。管理コスト最小 |
| Firestore | - | リアルタイム同期が標準装備。スケールアップも自動 |
| Firebase Hosting | - | デプロイが `firebase deploy` 1コマンド。CDN付き |
| pnpm + workspace | - | モノレポ管理。将来的に複数パッケージを追加しやすい |

### なぜFirebaseを選んだか

1. **認証・DB・ホスティングが1つのサービスで完結する**
   バックエンドのサーバーを自前で立てる必要がない。スモールスタートに最適。

2. **リアルタイム同期がデフォルト**
   複数スタッフが同時に使っても、Firestoreのリスナーで自動的に画面が更新される。

3. **オフライン対応**
   Firestoreはオフラインキャッシュを持つ。施設内のWi-Fiが不安定でも動作継続できる。

4. **スケールコスト**
   小規模利用なら無料枠で十分。利用者が増えると自動的にスケール（従量課金）。

### なぜモノレポ構成にしたか

現在は `packages/dashboard` のみだが、将来的に以下を追加想定：

```
packages/
├── dashboard/     ← 今ここ（スタッフ向け管理画面）
├── portal/        ← 利用者向けポータル（将来）
├── b-type/        ← B型専用パッケージ（将来）
└── shared/        ← 共通コンポーネント・定数（将来）
```

---

## 4. 現状できること・できないこと

### ✅ 実装済み・動作中

#### 利用者管理・CRM
- 利用者の登録・編集・ステータス管理
- CRMカンバンボード（ステータス別レーン表示）
- 利用者詳細ページ（基本情報・活動ログ・定着支援）

#### 追客管理
- 追客リスト（エスカレーション自動計算）
- 活動履歴モーダル（電話番号タップ発信対応）
- アラート一覧（前日リマインダー：見学・体験・追客）

#### 出席・記録管理
- 月間出席計画（カレンダーで計画作成）
- 日次チェックイン（体温・気分・睡眠・服薬）
- サービス記録（月次一覧・インライン編集）
- 出退時間の直接編集

#### 定着支援
- 定着支援レポート記録・印刷
- 定着支援計画書

#### 印刷・帳票
- サービス提供記録 印刷
- 出席記録表 印刷
- アセスメントシート 印刷
- フェイスシート 印刷

#### 管理機能
- 企業・支店・ユーザー管理
- ロールベースアクセス制御（RBAC）
- RBACコントロールパネル（マトリクス編集）
- クエストカテゴリ管理
- スタッフクエストボード（日次タスク・ポイント）

#### インフラ
- Googleアカウントログイン
- マルチテナント（企業・支店の階層管理）
- GitHub Actions 自動デプロイ（push → 自動ビルド → Firebase Hosting）

---

### ❌ 未実装・課題

#### 優先度：高
| 機能 | 理由 |
|------|------|
| Googleカレンダー連携 | 追客の次回予定・見学体験を自動書き込みしたい |
| ロスト時に `nextContactDate` をクリア | 追客リストにロスト利用者が残り続ける |
| 請求データ連携 | 月次の請求計算が手動のまま |

#### 優先度：中
| 機能 | 理由 |
|------|------|
| HOTDOGの「ADMIN PANEL」中身 | 現在スカスカ。最小権限で閲覧できる内容を設計する必要あり |
| B型用工賃管理 | serviceTypes='type_b' の支店に対するメニューは用意されているが中身なし |
| 複数自治体の申請書類対応 | 現在は広島市のみ対応（`hiroshima` テンプレート） |

#### 技術的負債
| 項目 | 詳細 |
|------|------|
| バンドルサイズが大きい | 2,465KB。コードスプリッティング（React.lazy）を検討 |
| AuthContextのFirestore動的import | バンドルサイズに影響。将来的に整理が必要 |
| serviceTypesによるメニュー制御が不完全 | 現状 branch_manager/staff は serviceTypes を無視して月次処理メニューを表示 |

---

## 5. B型を作る場合に何が変わるか

### 就労移行支援とB型の業務的な違い

| 項目 | 就労移行支援 | 就労継続支援B型 |
|------|------------|---------------|
| 目的 | 一般就労を目指す訓練 | 障害により一般就労が難しい方の就労機会提供 |
| 利用期間 | 原則2年（延長可） | 期間制限なし（継続利用） |
| 報酬体系 | 訓練等給付。就職実績で加算 | 訓練等給付 ＋ 工賃（生産活動の収益） |
| コアKPI | 就職率・定着率 | 工賃平均額・利用率 |
| 特有の業務 | 就職活動支援・定着支援 | 生産活動管理・工賃計算・工賃明細書発行 |
| 帳票 | 個別支援計画・定着支援レポート | 工賃台帳・作業記録・工賃明細 |

### 技術的に何が必要か

#### 共通で使えるもの（変更不要）
- 認証・マルチテナント設計
- 利用者管理・CRMの骨格
- 出席管理（出退席の記録自体は共通）
- アラート・追客（見学・体験フローは共通）
- スタッフ管理・RBAC

#### B型専用で追加が必要なもの

**Firestoreコレクション追加**
```
wageRecords/          ← 工賃台帳
  {recordId}
    clientId
    month             (YYYY-MM)
    workDays          (稼働日数)
    totalWage         (工賃合計)
    perDayWage        (日額工賃)

productionActivities/ ← 生産活動記録
  {activityId}
    date
    activityType      (内職、農作業 等)
    revenue           (売上)
    expenses          (経費)
    netIncome         (純利益)
```

**新規ページ**
- 工賃管理ページ（月次工賃の入力・集計）
- 生産活動記録ページ
- 工賃明細書（印刷帳票）

**変更が必要なもの**
- `serviceTypes: ['type_b']` の支店ではB型用メニューを表示（仕組みは既に準備済み）
- 月次処理フロー（移行支援用の「就職者数・定着率」ではなく「工賃実績・稼働率」を集計）
- ダッシュボードKPI（工賃平均額・稼働率・利用率を表示）

### B型を「同じアプリに追加」vs「別アプリで作る」か

**同じアプリに追加する場合**
- `serviceTypes` の制御で分岐できる設計は既にある
- 開発コスト低・管理コスト低
- ただし、コードが複雑になりやすい
- 移行・B型・さらにA型（就労継続支援A型）まで増えると限界が来る

**別アプリで作る場合**
- 完全に分離できる（B型に特化した最適なUXを設計できる）
- モノレポ構成なので `packages/b-type/` として共存できる
- 認証・RBAC・Firestoreは共通のものを参照できる

> ← **どちらにするか方針を決めたらここに記載してください。**

---

## 6. 次の開発者へのガイド

### 開発環境のセットアップ

```bash
# リポジトリをクローン
git clone https://github.com/moppoyo07/manecto.git
cd manecto

# 依存関係インストール
pnpm install

# Firebase設定ファイルを用意（別途オーナーから受け取る）
# packages/dashboard/src/firebase/index.js に接続情報が入っている
# このファイルはgitに含まれているが、本番用APIキーは公開リポジトリに入れないこと

# 開発サーバー起動
cd packages/dashboard
pnpm dev
```

### デプロイ方法

```bash
# 方法1: 自動（推奨）
git push  # main ブランチにpushするだけで自動デプロイ

# 方法2: 手動
cd packages/dashboard && pnpm build
cd ../.. && firebase deploy --only hosting
```

### ディレクトリ構成と役割

```
packages/dashboard/src/
├── constants/          ← 定数定義（ここを先に読む）
│   ├── roles.js        ← ロール・権限の全定義
│   └── clientStatus.js ← 利用者ステータスの全定義
│
├── features/           ← 機能別モジュール
│   ├── auth/           ← 認証（AuthContext）
│   ├── admin/          ← 管理機能（企業・支店・ユーザー・クエスト・RBAC）
│   ├── clients/        ← 利用者管理
│   ├── dashboard/      ← ダッシュボード・クエストボード
│   ├── layout/         ← 左メニュー・ヘッダー
│   ├── retention/      ← 定着支援
│   └── service-records/← サービス記録
│
├── hooks/              ← カスタムフック（ロジック分離）
│   ├── useCurrentUser.js    ← ログインユーザー情報
│   ├── useActivityLog.js    ← 活動ログの保存・追客日更新
│   ├── useActivityFeed.js   ← 活動フィードのリアルタイム取得
│   └── useClientUpdater.js  ← 利用者情報の更新
│
├── pages/              ← ページコンポーネント
└── routes/             ← ルート定義（権限チェック込み）
```

### 重要な設計ルール

#### 1. ユーザーIDについて
```
Firestoreの users コレクション
  ドキュメントID → ランダムID（addDocで作成）
  uid フィールド → Firebase Auth の UID（別途保存）

AuthContext は email で users を検索 → role/companyId/branchId を取得
useCurrentUser は users/{uid} を購読 → 見つからない場合は AuthContext の値をフォールバックに使用
```

#### 2. ロール設計の哲学
```
badge      → 管理者から見えるロール名（例: "HOTDOG"）
userLabel  → 本人に表示されるロール名（例: "Administrator"）

この2つは意図的に分けている。
HOTDOGロールは「管理者には実態が見える。本人には管理者に見せかける」という政治的設計。
```

#### 3. Firestoreクエリの注意
```
where() + orderBy() の組み合わせは複合インデックスが必要になる。
インデックスを作らずに済むように、クライアントサイドでソートする方針を採用している。

例：questCategories の取得
  NG: where('companyId').where('isActive').orderBy('createdAt')
  OK: where('companyId').where('isActive') → 取得後に .sort() でクライアントソート
```

#### 4. serviceTypes による機能分岐
```javascript
// 支店に設定されたサービス種別
branch.serviceTypes = ['transition']   // 就労移行支援
branch.serviceTypes = ['type_b']       // B型
branch.serviceTypes = ['transition', 'type_b']  // 両方

// Layout.jsx での制御
const hasService = (type) => branchServices.includes(type) || isPlatformOwner;

{hasService('transition') && <月次処理メニュー />}
{hasService('type_b') && <工賃管理メニュー />}  // ← B型追加時はここを実装
```

### Firestoreコレクション一覧（完全版）

| コレクション | 用途 | 主なフィールド |
|------------|------|-------------|
| `companies` | 企業情報 | name, serviceTypes |
| `branches` | 支店情報 | name, companyId, serviceTypes |
| `users` | スタッフ情報 | email, role, companyId, branchId, uid |
| `clients` | 利用者情報 | name, status, companyId, branchId, nextContactDate, contactAttempts |
| `clients/{id}/activity_logs` | 利用者活動ログ | type, content, staffName, createdAt |
| `clients/{id}/retentionReports` | 定着支援レポート | followUpMonth, visitLogs, goals |
| `attendanceRecords` | 出席記録 | clientId, date, startTime, endTime, attendanceType |
| `serviceRecords` | サービス記録 | clientId, date, supportContent, activitiesAm/Pm |
| `dailyCheckins` | チェックイン詳細 | clientId, date, temperature, mood, sleep, medication |
| `staffTasks` | クエスト記録 | userId, date, taskId, status, points |
| `questCategories` | クエスト定義 | companyId, label, points, isActive |
| `companies/{id}/activity_logs` | 会社活動フィード | type, content, staffName, createdAt |
| `userInvitations` | 招待管理 | email, role, status, expiresAt |
| `settings/rbac_permissions` | RBAC権限マトリクス | matrix, isServicePremium |

### よくあるトラブルと解決策

| 症状 | 原因 | 解決策 |
|------|------|--------|
| ロールが正しく表示されない | `users/{uid}` ドキュメントが存在しない（addDocで作成したユーザー） | `useCurrentUser.js` のフォールバック処理を確認 |
| クエストカテゴリが取得できない | Firestoreの複合インデックスエラー | `orderBy` を削除してクライアントソートに変更 |
| HOTDOGユーザーが「Crew」と表示される | AuthContextのroleがuseCurrentUserに渡っていない | `useCurrentUser.js` のフォールバックで `currentUser.role` を使用 |
| 月次処理メニューが出ない | serviceTypesに'transition'が設定されていない | 支店設定を確認、またはLayout.jsxの条件式を確認 |
| デプロイ後に画面が変わらない | ブラウザキャッシュ | Ctrl+Shift+R でハードリロード |

---

## 付録：ロール一覧（開発者向け早見表）

```
platform_owner  → Grand Admiral  → 全権限。Manecto創設者
platform_staff  → Fleet Staff    → Manecto社員。システム管理
company_admin   → Commander      → 利用企業の代表。自社全権限
branch_manager  → XO             → 支店長。支店内全権限
branch_staff    → Crew           → 一般スタッフ。日常業務
hotdog          → HOTDOG         → 政治的隔離ロール。本人にはAdministratorと表示
accountant      → Accountant     → 経理担当
tax_advisor     → Tax Advisor    → 顧問税理士
```

---

## 付録：GitHub・デプロイ情報

| 項目 | 内容 |
|------|------|
| GitHubリポジトリ | https://github.com/moppoyo07/manecto（プライベート） |
| 本番URL | https://manecto.web.app |
| Firebaseプロジェクト | officehub-c6c1b |
| 自動デプロイ | main ブランチへのpushで自動起動（GitHub Actions） |
| 手動デプロイ | `firebase deploy --only hosting --project officehub-c6c1b` |

---

*このドキュメントはManectoオーナーとClaude（AI）が共同で作成・管理しています。*
*「← ここに追記してください」と記載された箇所はオーナーの言葉で補完してください。*
