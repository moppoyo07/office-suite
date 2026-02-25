# 厚生訓練費申請書システム

## 概要

障害福祉サービス事業所が自治体に提出する「更生訓練費支給申請書」を生成・印刷するシステム。

## 現状（2026年1月時点）

### 実装済み

| 機能 | ファイル | 説明 |
|------|----------|------|
| 帳票コンポーネント | `src/features/welfare-training/HiroshimaWelfareTrainingClaim.jsx` | 広島市フォーマットの申請書 |
| 管理ページ | `src/pages/WelfareTrainingPage.jsx` | 年月・自治体選択とプレビュー、DB連携 |
| 交通費情報入力 | `src/features/clients/components/WelfareContractSection.jsx` | 利用者詳細ページ内 |
| DB型定義 | `src/types/client.ts` | `welfareTrainingTransport`フィールド |
| 自治体設定 | `src/constants/municipalityConfig.js` | 対応自治体の設定ファイル |

### 計算ロジック

```
訓練費（月額固定）:
  - 15日以上利用 → 3,150円
  - 14日以下利用 → 1,600円

交通費:
  - 通所日数 × 1日単価（在宅日は除く）
  - 定期券の場合は月額固定
```

### 未実装（Phase 3）

- [ ] 実績データ（AttendanceRecords）からの自動集計
- [ ] 自治体フィルタリング（billingInfo.municipalityName）
- [ ] 周辺自治体のテンプレート追加

---

## 拡張計画

### 対応予定の自治体

| 自治体 | テンプレート | 状態 |
|--------|------------|------|
| 広島市（中区/東区/南区/西区） | hiroshima | ✅ 実装済み |
| 三次市 | miyoshi | 🔜 未実装 |
| 廿日市市 | hatsukaichi | 🔜 未実装 |
| 坂町 | saka | 🔜 未実装 |

### 設計方針

```
1. テンプレート分離
   - 各自治体のフォーマットは別コンポーネント
   - 例: HiroshimaWelfareTrainingClaim.jsx
         MiyoshiWelfareTrainingClaim.jsx

2. 設定ファイルで自治体管理
   - constants/municipalityConfig.js
   - { id, name, prefectureCode, template, enabled }

3. ルーティング
   - /monthly/welfare-training
   - ページ内で自治体選択 → テンプレート切り替え

4. テナント/ロール制御
   - テナント設定に「利用可能自治体」を持たせる
   - 新規テナントは設定で有効化するだけ
```

### 他県展開時の対応

1. 県の設定を追加（prefectureConfig）
2. 対象自治体のテンプレートを作成
3. テナント設定で有効化

**開発工数目安**: 1自治体あたり2-3時間（テンプレート作成 + テスト）

---

## ファイル構成

```
src/
├── features/
│   └── welfare-training/
│       ├── HiroshimaWelfareTrainingClaim.jsx  # 広島市テンプレート
│       ├── MiyoshiWelfareTrainingClaim.jsx    # 三次市（今後）
│       └── templates/                          # 共通パーツ
├── pages/
│   └── WelfareTrainingPage.jsx                # 管理ページ
├── constants/
│   └── municipalityConfig.js                  # 自治体設定（今後）
└── types/
    └── client.ts                              # welfareTrainingTransport型
```

---

## 関連ドキュメント

- [アプリケーションフォーム一覧](./application-forms.md)
- [アーキテクチャ](./architecture.md)
