// src/templates/miyoshi/config.js
// 三次市テンプレート設定

export default {
    name: '三次市',
    prefectureCode: '34',

    welfareTraining: {
        addressee: '三次市長',
        formTitle: '障害者就労支援施設通所費助成金支給申請書',
        formNumber: '様式第1号（第4条関係）',
        // 3ヶ月に1回請求
        billingCycle: 'quarterly',
    },

    defaultOfficeInfo: {
        address: '広島県広島市中区中町7-41 401',
        facilityName: '就労移行ITスクール広島',
    },

    defaultApplicantInfo: {
        address: '三次市三次町1538-5',
        guardian: '工　幸太郎',
    },
};
