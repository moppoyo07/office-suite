// src/constants/companyFields.js
// 企業情報フィールド定義（フラット構造）
// 全フィールドのラベル、型、セクション分類を一元管理

/**
 * 企業情報のセクション定義
 */
export const COMPANY_SECTIONS = {
    BASIC: 'basic',
    CORPORATE: 'corporate',
    CONTACT: 'contact',
    LABOR: 'labor',
    HELLOWORK: 'hellowork',
    WELFARE: 'welfare',
    BANK: 'bank',
    ADVISOR: 'advisor',
};

/**
 * セクションの表示名と色
 */
export const COMPANY_SECTION_CONFIG = {
    [COMPANY_SECTIONS.BASIC]: { label: '基本情報', color: '#06b6d4', icon: 'Business' },
    [COMPANY_SECTIONS.CORPORATE]: { label: '法人情報', color: '#8b5cf6', icon: 'AccountBalance' },
    [COMPANY_SECTIONS.CONTACT]: { label: '連絡先', color: '#10b981', icon: 'Phone' },
    [COMPANY_SECTIONS.LABOR]: { label: '労務関連番号', color: '#f59e0b', icon: 'Badge' },
    [COMPANY_SECTIONS.HELLOWORK]: { label: 'ハローワーク', color: '#3b82f6', icon: 'Work' },
    [COMPANY_SECTIONS.WELFARE]: { label: '福祉事業', color: '#ec4899', icon: 'VolunteerActivism' },
    [COMPANY_SECTIONS.BANK]: { label: '銀行口座', color: '#22c55e', icon: 'Savings' },
    [COMPANY_SECTIONS.ADVISOR]: { label: '顧問・外部連携', color: '#64748b', icon: 'People' },
};

/**
 * 法人格の選択肢
 */
export const CORPORATE_TYPE_OPTIONS = [
    { value: 'kabushiki', label: '株式会社' },
    { value: 'godo', label: '合同会社' },
    { value: 'yugen', label: '有限会社' },
    { value: 'npo', label: 'NPO法人' },
    { value: 'shakai_fukushi', label: '社会福祉法人' },
    { value: 'ippan_shadan', label: '一般社団法人' },
    { value: 'ippan_zaidan', label: '一般財団法人' },
    { value: 'other', label: 'その他' },
];

/**
 * 福祉サービス種別の選択肢
 */
export const WELFARE_SERVICE_TYPE_OPTIONS = [
    { value: 'b_type', label: '就労継続支援B型' },
    { value: 'a_type', label: '就労継続支援A型' },
    { value: 'transition', label: '就労移行支援' },
    { value: 'life_training', label: '自立訓練（生活訓練）' },
    { value: 'group_home', label: 'グループホーム' },
    { value: 'day_service', label: '生活介護' },
    { value: 'other', label: 'その他' },
];

/**
 * 決算月の選択肢
 */
export const FISCAL_MONTH_OPTIONS = Array.from({ length: 12 }, (_, i) => ({
    value: String(i + 1),
    label: `${i + 1}月`,
}));

/**
 * 全企業フィールドの定義
 */
export const COMPANY_FIELDS = {
    // === 基本情報 ===
    name: {
        label: '会社名',
        section: COMPANY_SECTIONS.BASIC,
        type: 'text',
        required: true,
    },
    nameKana: {
        label: '会社名（カナ）',
        section: COMPANY_SECTIONS.BASIC,
        type: 'text',
        placeholder: 'カブシキガイシャ ○○',
    },
    representativeName: {
        label: '代表者名',
        section: COMPANY_SECTIONS.BASIC,
        type: 'text',
    },
    establishedDate: {
        label: '設立日',
        section: COMPANY_SECTIONS.BASIC,
        type: 'date',
    },
    employeeCount: {
        label: '従業員数',
        section: COMPANY_SECTIONS.BASIC,
        type: 'number',
    },
    fiscalMonth: {
        label: '決算月',
        section: COMPANY_SECTIONS.BASIC,
        type: 'select',
        options: FISCAL_MONTH_OPTIONS,
    },

    // === 法人情報 ===
    corporateNumber: {
        label: '法人番号（13桁）',
        section: COMPANY_SECTIONS.CORPORATE,
        type: 'text',
        placeholder: '0000000000000',
    },
    corporateType: {
        label: '法人格',
        section: COMPANY_SECTIONS.CORPORATE,
        type: 'select',
        options: CORPORATE_TYPE_OPTIONS,
    },
    capitalAmount: {
        label: '資本金（円）',
        section: COMPANY_SECTIONS.CORPORATE,
        type: 'number',
    },

    // === 連絡先 ===
    phone: {
        label: '電話番号',
        section: COMPANY_SECTIONS.CONTACT,
        type: 'tel',
        placeholder: '082-123-4567',
    },
    fax: {
        label: 'FAX番号',
        section: COMPANY_SECTIONS.CONTACT,
        type: 'tel',
        placeholder: '082-123-4568',
    },
    email: {
        label: 'メールアドレス',
        section: COMPANY_SECTIONS.CONTACT,
        type: 'email',
    },
    postalCode: {
        label: '郵便番号',
        section: COMPANY_SECTIONS.CONTACT,
        type: 'text',
        placeholder: '730-0051',
    },
    prefecture: {
        label: '都道府県',
        section: COMPANY_SECTIONS.CONTACT,
        type: 'text',
    },
    city: {
        label: '市区町村',
        section: COMPANY_SECTIONS.CONTACT,
        type: 'text',
    },
    address1: {
        label: '町名・番地',
        section: COMPANY_SECTIONS.CONTACT,
        type: 'text',
    },
    address2: {
        label: '建物名',
        section: COMPANY_SECTIONS.CONTACT,
        type: 'text',
    },

    // === 労務関連番号 ===
    employmentInsuranceNumber: {
        label: '雇用保険事業所番号',
        section: COMPANY_SECTIONS.LABOR,
        type: 'text',
        sensitive: true,
    },
    laborInsuranceNumber: {
        label: '労働保険番号',
        section: COMPANY_SECTIONS.LABOR,
        type: 'text',
        sensitive: true,
    },
    pensionOfficeNumber: {
        label: '厚生年金適用事業所番号',
        section: COMPANY_SECTIONS.LABOR,
        type: 'text',
        sensitive: true,
    },
    pensionOfficeName: {
        label: '管轄年金事務所',
        section: COMPANY_SECTIONS.LABOR,
        type: 'text',
    },
    healthInsuranceNumber: {
        label: '健康保険適用事業所番号',
        section: COMPANY_SECTIONS.LABOR,
        type: 'text',
        sensitive: true,
    },

    // === ハローワーク ===
    helloworkNumber: {
        label: 'ハローワーク事業所番号',
        section: COMPANY_SECTIONS.HELLOWORK,
        type: 'text',
    },
    helloworkName: {
        label: '管轄ハローワーク名',
        section: COMPANY_SECTIONS.HELLOWORK,
        type: 'text',
        placeholder: 'ハローワーク広島',
    },

    // === 福祉事業 ===
    facilityName: {
        label: '施設名（事業所名）',
        section: COMPANY_SECTIONS.WELFARE,
        type: 'text',
        placeholder: '例: 就労移行ITスクール広島',
        helperText: '請求書・帳票に表示される施設名',
    },
    welfareServiceNumber: {
        label: '事業所指定番号',
        section: COMPANY_SECTIONS.WELFARE,
        type: 'text',
        helperText: '都道府県発行の指定番号',
    },
    welfareServiceType: {
        label: 'サービス種別',
        section: COMPANY_SECTIONS.WELFARE,
        type: 'select',
        options: WELFARE_SERVICE_TYPE_OPTIONS,
    },
    designationDate: {
        label: '指定年月日',
        section: COMPANY_SECTIONS.WELFARE,
        type: 'date',
    },
    renewalDate: {
        label: '更新年月日',
        section: COMPANY_SECTIONS.WELFARE,
        type: 'date',
    },
    municipalityDept: {
        label: '自治体担当課',
        section: COMPANY_SECTIONS.WELFARE,
        type: 'text',
        placeholder: '○○市 障害福祉課',
    },
    municipalityContact: {
        label: '担当者連絡先',
        section: COMPANY_SECTIONS.WELFARE,
        type: 'text',
    },
    welfareTrainingType: {
        label: '更生訓練費の種別',
        section: COMPANY_SECTIONS.WELFARE,
        type: 'select',
        options: [
            { value: 'none', label: 'なし（制度対象外）' },
            { value: 'both', label: '訓練費 + 交通費' },
            { value: 'transport_only', label: '交通費のみ' },
        ],
        helperText: '自治体から支給される更生訓練費の種別を選択',
    },

    // === 銀行口座 ===
    bankName: {
        label: '銀行名',
        section: COMPANY_SECTIONS.BANK,
        type: 'text',
        placeholder: '○○銀行',
    },
    bankBranchName: {
        label: '支店名',
        section: COMPANY_SECTIONS.BANK,
        type: 'text',
        placeholder: '○○支店',
    },
    bankAccountType: {
        label: '口座種別',
        section: COMPANY_SECTIONS.BANK,
        type: 'select',
        options: [
            { value: 'ordinary', label: '普通' },
            { value: 'current', label: '当座' },
        ],
    },
    bankAccountNumber: {
        label: '口座番号',
        section: COMPANY_SECTIONS.BANK,
        type: 'text',
    },
    bankAccountHolder: {
        label: '口座名義',
        section: COMPANY_SECTIONS.BANK,
        type: 'text',
    },

    // === 顧問・外部連携 ===
    taxAdvisorName: {
        label: '顧問税理士',
        section: COMPANY_SECTIONS.ADVISOR,
        type: 'text',
    },
    taxAdvisorContact: {
        label: '税理士連絡先',
        section: COMPANY_SECTIONS.ADVISOR,
        type: 'text',
    },
    laborAdvisorName: {
        label: '顧問社労士',
        section: COMPANY_SECTIONS.ADVISOR,
        type: 'text',
    },
    laborAdvisorContact: {
        label: '社労士連絡先',
        section: COMPANY_SECTIONS.ADVISOR,
        type: 'text',
    },
};

/**
 * セクションごとにフィールドをグループ化
 */
export const getCompanyFieldsBySection = (section) => {
    return Object.entries(COMPANY_FIELDS)
        .filter(([_, config]) => config.section === section)
        .map(([key, config]) => ({ key, ...config }));
};

/**
 * 全セクションの順序付きリスト
 */
export const COMPANY_SECTION_ORDER = [
    COMPANY_SECTIONS.BASIC,
    COMPANY_SECTIONS.CORPORATE,
    COMPANY_SECTIONS.CONTACT,
    COMPANY_SECTIONS.LABOR,
    COMPANY_SECTIONS.HELLOWORK,
    COMPANY_SECTIONS.WELFARE,
    COMPANY_SECTIONS.BANK,
    COMPANY_SECTIONS.ADVISOR,
];
