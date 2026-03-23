// src/templates/sakamachi/config.js
// 坂町テンプレート設定

export default {
    name: '坂町',
    prefectureCode: '34',

    welfareTraining: {
        addressee: '坂町長',
        formTitle: '障害者（児）施設等通所交通費助成請求書',
        // 坂町は交通費のみ（訓練費なし）
        transportOnly: true,
    },

    transportExpense: {
        maxAmount: null,
        requiresReceipt: false,
        commuterPassAllowed: true,
    },

    defaultOfficeInfo: {
        address: '広島県広島市中区中町7-41 401',
        corporation: '株式会社　PresingSocialService',
        facilityName: '就労移行ITスクール広島',
        representative: '代表取締役　福嶋　悠太',
    },
};
