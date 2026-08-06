// src/constants/municipalityConfig.js
// 更生訓練費申請書の対象自治体設定

/**
 * 自治体設定
 * - id: 一意識別子
 * - name: 表示名
 * - prefectureCode: 都道府県コード（広島県=34）
 * - billingName: DBのbillingInfo.municipalityNameと照合する値
 * - template: 使用するテンプレート名（null=未対応）
 * - enabled: 有効/無効
 */
export const MUNICIPALITIES = [
    // 広島市（同一テンプレート）
    { id: 'hiroshima-naka', name: '中区', prefectureCode: '34', billingName: '中区', template: 'hiroshima', enabled: true },
    { id: 'hiroshima-higashi', name: '東区', prefectureCode: '34', billingName: '東区', template: 'hiroshima', enabled: true },
    { id: 'hiroshima-minami', name: '南区', prefectureCode: '34', billingName: '南区', template: 'hiroshima', enabled: true },
    { id: 'hiroshima-nishi', name: '西区', prefectureCode: '34', billingName: '西区', template: 'hiroshima', enabled: true },
    { id: 'hiroshima-asaminami', name: '安佐南区', prefectureCode: '34', billingName: '安佐南区', template: 'hiroshima', enabled: true },
    { id: 'hiroshima-asakita', name: '安佐北区', prefectureCode: '34', billingName: '安佐北区', template: 'hiroshima', enabled: true },
    { id: 'hiroshima-aki', name: '安芸区', prefectureCode: '34', billingName: '安芸区', template: 'hiroshima', enabled: true },
    { id: 'hiroshima-saeki', name: '佐伯区', prefectureCode: '34', billingName: '佐伯区', template: 'hiroshima', enabled: true },

    // 周辺自治体（テンプレート未作成）
    { id: 'miyoshi', name: '三次市', prefectureCode: '34', billingName: '三次市', template: null, enabled: false },
    { id: 'hatsukaichi', name: '廿日市市', prefectureCode: '34', billingName: '廿日市市', template: null, enabled: false },
    { id: 'saka', name: '坂町', prefectureCode: '34', billingName: '坂町', template: null, enabled: false },
];

/**
 * 有効な自治体のみ取得
 */
export const getEnabledMunicipalities = () => {
    return MUNICIPALITIES.filter(m => m.enabled);
};

/**
 * billingNameから自治体設定を取得
 */
export const getMunicipalityByBillingName = (billingName) => {
    return MUNICIPALITIES.find(m => m.billingName === billingName);
};

/**
 * テンプレートがある自治体のみ取得
 */
export const getMunicipalitiesWithTemplate = () => {
    return MUNICIPALITIES.filter(m => m.enabled && m.template);
};
