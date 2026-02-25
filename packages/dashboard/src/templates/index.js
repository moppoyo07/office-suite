// src/templates/index.js
// テンプレートルーター - 自治体コードからテンプレートを動的にロード

/**
 * 利用可能なテンプレートローダー
 * 新しい自治体を追加する場合は、ここにエントリを追加
 */
const templateLoaders = {
    hiroshima: {
        welfareTraining: () => import('./hiroshima/WelfareTrainingForm'),
    },
    // 例: 将来の自治体追加
    // hatsukaichi: {
    //     welfareTraining: () => import('./hatsukaichi/WelfareTrainingForm'),
    // },
};

/**
 * テンプレートコンポーネントを動的に取得
 * @param {string} templateName - 自治体テンプレート名（例: 'hiroshima'）
 * @param {string} formType - 帳票種別（例: 'welfareTraining'）
 * @returns {Promise<React.Component|null>} テンプレートコンポーネント
 */
export const getTemplate = async (templateName, formType) => {
    const loader = templateLoaders[templateName]?.[formType];
    if (!loader) {
        console.warn(`Template not found: ${templateName}/${formType}`);
        return null;
    }

    try {
        const module = await loader();
        return module.default;
    } catch (err) {
        console.error(`Failed to load template: ${templateName}/${formType}`, err);
        return null;
    }
};

/**
 * テンプレート設定を動的に取得
 * @param {string} templateName - 自治体テンプレート名
 * @returns {Promise<object|null>} 設定オブジェクト
 */
export const getConfig = async (templateName) => {
    try {
        const module = await import(`./${templateName}/config.js`);
        return module.default;
    } catch {
        console.warn(`Config not found for: ${templateName}`);
        return null;
    }
};

/**
 * 利用可能なテンプレート一覧を取得
 * @returns {string[]} テンプレート名の配列
 */
export const getAvailableTemplates = () => {
    return Object.keys(templateLoaders);
};
