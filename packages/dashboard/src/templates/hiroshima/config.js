// src/templates/hiroshima/config.js
// 広島市テンプレート設定

export default {
    // 基本情報
    name: '広島市',
    prefectureCode: '34',

    // 更生訓練費の設定
    welfareTraining: {
        // 訓練費単価
        rate15DaysPlus: 3150,      // 15日以上の場合
        rateLessThan15Days: 1600,  // 14日以下の場合

        // 宛先
        addressee: '広島市長',
    },

    // 交通費の設定
    transportExpense: {
        maxAmount: null,           // 上限なし（nullで無制限）
        requiresReceipt: false,    // 領収書不要

        // 定期券の取扱い
        commuterPassAllowed: true,
    },

    // 事業所デフォルト情報（テンプレートからの初期値）
    defaultOfficeInfo: {
        address: '広島市中区中町7-41',
        corporation: '(株)PresingSocialService',
        facilityName: '就労移行ITスクール広島',
        representative: '福嶋 悠太',
    },
};
