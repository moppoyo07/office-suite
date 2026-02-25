# Manecto Role & Fleet Command System (RBAC)

Manecto（マントラ）における階級システムと権限管理の定義ドキュメントです。
本システムは「宇宙艦隊」をモチーフにした階級構造を持ち、内部的な権限とUI上の表示名（フェイク階級を含む）を切り分けることで、政治的な情報制御を可能にしています。

## ⚓ 階級構造・エリア定義

| 階級 (UI Badge) | ロールID | 本人への表示名 | ダッシュボード名 | 管理エリア名 | 役割・コンセプト |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Grand Admiral** | `platform_owner` | Fleet Admiral | **BRIDGE** | System Core | **創造主（あなた）**。全企業の掌握・プラン制御。 |
| **Fleet Staff** | `platform_staff` | Staff Officer | **OVERWATCH** | Strategic Hub | コンサル部隊。複数企業の監視・サポート。 |
| **Commander** | `company_admin` | CEO / Commander| **COMMAND POST** | Management Console | 企業オーナー（社長）。自社リソースの全権掌握。 |
| **XO** | `branch_manager` | Executive Officer| **CIC** | Operations Desk | 支店管理者（副長）。現場指揮・月次事務処理。 |
| **Crew** | `branch_staff` | Active Crew | **COCKPIT** | Data Log | 一般スタッフ。日々の支援記録・タスク。 |
| **HOTDOG** | `hotdog` | **Administrator** | **ADMIN PANEL** | Information Hub | **政治的隔離ロール**。実態は最小権限だが、本人は管理者と誤認させる。 |

---

## 🛠️ サービス種別による機能制御

Manectoは支店（事業所）ごとに提供するサービスを定義し、それに基づいてUIを動的にフィルタリングします。

### 対応サービス
- **就労移行支援 (transition)**: 訓練計画、就職支援、移行用月次処理
- **就労継続支援B型 (type_b)**: 工賃計算、生産活動管理、B型用月次処理

### 制御ロジック
- 支店登録時に `serviceTypes` を選択します。
- ログインユーザーの所属支店に `transition` が設定されていない場合、就労移行支援に関連するメニューは表示されません（B型も同様）。
- `Grand Admiral` は全てのサービス機能にアクセス可能です。

---

## 🛡️ 権限チェック (RBAC)

システム内部では以下のパーミッションキーを用いてアクセス制御を行います。

- `clients:read / write`: 顧客情報
- `attendance:read / write`: 出欠管理
- `billing:read / write`: 請求・月次
- `staff:read / write`: スタッフ管理
- `settings:read / write`: 設定変更

### 権限マトリクス (デフォルト)
- **Grand Admiral / Commander**: 全権限 (Full Access)
- **XO / Crew**: 現場・事務に必要な権限
- **HOTDOG**: 閲覧制限あり（経営数値などの「足を取られる」情報は遮断）

---

## 📝 開発者向けメモ
設定定数は `packages/dashboard/src/constants/roles.js` に集約されています。
UIラベルの変更やエリア名の調整は、このファイルの `ROLE_METADATA` を編集することでシステム全体に即時反映されます。
