// src/constants/userFields.js
// ユーザー情報フィールド定義（フラット構造）
// 全フィールドのラベル、型、セクション分類を一元管理

/**
 * ユーザー情報のセクション定義
 */
export const USER_SECTIONS = {
    BASIC: 'basic',
    AFFILIATION: 'affiliation',
    PERSONAL: 'personal',
    CONTACT: 'contact',
    EMERGENCY: 'emergency',
    EMPLOYMENT: 'employment',
    SALARY: 'salary',
    BANK: 'bank',
    INSURANCE: 'insurance',
    LICENSE: 'license',
    HEALTH: 'health',
    RESIGNATION: 'resignation',
};

/**
 * セクションの表示名と色
 */
export const SECTION_CONFIG = {
    [USER_SECTIONS.BASIC]: { label: '基本情報', color: '#8b5cf6', icon: 'Person' },
    [USER_SECTIONS.AFFILIATION]: { label: '所属・権限', color: '#06b6d4', icon: 'Business' },
    [USER_SECTIONS.PERSONAL]: { label: '個人情報', color: '#ec4899', icon: 'Badge' },
    [USER_SECTIONS.CONTACT]: { label: '連絡先', color: '#10b981', icon: 'Phone' },
    [USER_SECTIONS.EMERGENCY]: { label: '緊急連絡先', color: '#ef4444', icon: 'Warning' },
    [USER_SECTIONS.EMPLOYMENT]: { label: '雇用情報', color: '#f59e0b', icon: 'Work' },
    [USER_SECTIONS.SALARY]: { label: '給与情報', color: '#22c55e', icon: 'AttachMoney' },
    [USER_SECTIONS.BANK]: { label: '銀行口座', color: '#3b82f6', icon: 'AccountBalance' },
    [USER_SECTIONS.INSURANCE]: { label: '保険情報', color: '#a855f7', icon: 'HealthAndSafety' },
    [USER_SECTIONS.LICENSE]: { label: '資格・免許', color: '#14b8a6', icon: 'School' },
    [USER_SECTIONS.HEALTH]: { label: '健康情報', color: '#f43f5e', icon: 'LocalHospital' },
    [USER_SECTIONS.RESIGNATION]: { label: '退職情報', color: '#64748b', icon: 'ExitToApp' },
};

/**
 * 性別の選択肢
 */
export const GENDER_OPTIONS = [
    { value: 'male', label: '男性' },
    { value: 'female', label: '女性' },
    { value: 'other', label: 'その他' },
];

/**
 * 血液型の選択肢
 */
export const BLOOD_TYPE_OPTIONS = [
    { value: 'A', label: 'A型' },
    { value: 'B', label: 'B型' },
    { value: 'O', label: 'O型' },
    { value: 'AB', label: 'AB型' },
    { value: 'unknown', label: '不明' },
];

/**
 * 雇用形態の選択肢
 */
export const EMPLOYMENT_TYPE_OPTIONS = [
    { value: 'full_time', label: '正社員' },
    { value: 'part_time', label: 'パート' },
    { value: 'contract', label: '契約社員' },
    { value: 'temporary', label: '派遣社員' },
    { value: 'other', label: 'その他' },
];

/**
 * 給与形態の選択肢
 */
export const SALARY_TYPE_OPTIONS = [
    { value: 'monthly', label: '月給' },
    { value: 'hourly', label: '時給' },
    { value: 'daily', label: '日給' },
];

/**
 * 口座種別の選択肢
 */
export const BANK_ACCOUNT_TYPE_OPTIONS = [
    { value: 'ordinary', label: '普通' },
    { value: 'current', label: '当座' },
    { value: 'savings', label: '貯蓄' },
];

/**
 * 運転免許種類の選択肢
 */
export const DRIVER_LICENSE_TYPE_OPTIONS = [
    { value: 'ordinary', label: '普通自動車' },
    { value: 'medium', label: '中型' },
    { value: 'large', label: '大型' },
    { value: 'motorcycle', label: '普通自動二輪' },
    { value: 'large_motorcycle', label: '大型自動二輪' },
    { value: 'moped', label: '原付' },
    { value: 'none', label: 'なし' },
];

/**
 * 続柄の選択肢
 */
export const RELATION_OPTIONS = [
    { value: 'spouse', label: '配偶者' },
    { value: 'parent', label: '親' },
    { value: 'child', label: '子' },
    { value: 'sibling', label: '兄弟姉妹' },
    { value: 'grandparent', label: '祖父母' },
    { value: 'other_relative', label: 'その他親族' },
    { value: 'friend', label: '友人・知人' },
    { value: 'other', label: 'その他' },
];

/**
 * 都道府県の選択肢
 */
export const PREFECTURE_OPTIONS = [
    '北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県',
    '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県',
    '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県',
    '静岡県', '愛知県', '三重県', '滋賀県', '京都府', '大阪府', '兵庫県',
    '奈良県', '和歌山県', '鳥取県', '島根県', '岡山県', '広島県', '山口県',
    '徳島県', '香川県', '愛媛県', '高知県', '福岡県', '佐賀県', '長崎県',
    '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県',
];

/**
 * 全ユーザーフィールドの定義
 */
export const USER_FIELDS = {
    // === 基本情報 ===
    email: {
        label: 'メールアドレス',
        section: USER_SECTIONS.BASIC,
        type: 'email',
        required: true,
        editable: false, // Firebase Authと連携のため編集不可
    },
    displayName: {
        label: '表示名',
        section: USER_SECTIONS.BASIC,
        type: 'text',
        required: true,
    },
    kanaName: {
        label: 'ふりがな',
        section: USER_SECTIONS.BASIC,
        type: 'text',
        placeholder: 'やまだ たろう',
    },

    // === 所属・権限 ===
    role: {
        label: 'ロール',
        section: USER_SECTIONS.AFFILIATION,
        type: 'select',
        required: true,
    },
    companyId: {
        label: '所属企業',
        section: USER_SECTIONS.AFFILIATION,
        type: 'select',
    },
    branchId: {
        label: '所属支店',
        section: USER_SECTIONS.AFFILIATION,
        type: 'select',
    },
    isServiceManager: {
        label: 'サービス管理責任者',
        section: USER_SECTIONS.AFFILIATION,
        type: 'boolean',
        helperText: 'ONにするとサービス記録の入力が制限されます（閲覧のみ）',
    },

    // === 個人情報 ===
    birthDate: {
        label: '生年月日',
        section: USER_SECTIONS.PERSONAL,
        type: 'date',
    },
    gender: {
        label: '性別',
        section: USER_SECTIONS.PERSONAL,
        type: 'select',
        options: GENDER_OPTIONS,
    },
    bloodType: {
        label: '血液型',
        section: USER_SECTIONS.PERSONAL,
        type: 'select',
        options: BLOOD_TYPE_OPTIONS,
    },
    myNumber: {
        label: 'マイナンバー',
        section: USER_SECTIONS.PERSONAL,
        type: 'text',
        sensitive: true,
        placeholder: '12桁の個人番号',
    },

    // === 連絡先 ===
    phone: {
        label: '電話番号',
        section: USER_SECTIONS.CONTACT,
        type: 'tel',
        placeholder: '090-1234-5678',
    },
    postalCode: {
        label: '郵便番号',
        section: USER_SECTIONS.CONTACT,
        type: 'text',
        placeholder: '123-4567',
    },
    prefecture: {
        label: '都道府県',
        section: USER_SECTIONS.CONTACT,
        type: 'select',
        options: PREFECTURE_OPTIONS.map(p => ({ value: p, label: p })),
    },
    city: {
        label: '市区町村',
        section: USER_SECTIONS.CONTACT,
        type: 'text',
        placeholder: '広島市中区',
    },
    address1: {
        label: '町名・番地',
        section: USER_SECTIONS.CONTACT,
        type: 'text',
        placeholder: '中町1-2-3',
    },
    address2: {
        label: '建物名・部屋番号',
        section: USER_SECTIONS.CONTACT,
        type: 'text',
        placeholder: 'ABCビル 101号室',
    },

    // === 緊急連絡先 ===
    emergencyContactName: {
        label: '緊急連絡先 氏名',
        section: USER_SECTIONS.EMERGENCY,
        type: 'text',
    },
    emergencyContactPhone: {
        label: '緊急連絡先 電話番号',
        section: USER_SECTIONS.EMERGENCY,
        type: 'tel',
    },
    emergencyContactRelation: {
        label: '続柄',
        section: USER_SECTIONS.EMERGENCY,
        type: 'select',
        options: RELATION_OPTIONS,
    },

    // === 雇用情報 ===
    employeeNumber: {
        label: '社員番号',
        section: USER_SECTIONS.EMPLOYMENT,
        type: 'text',
    },
    hireDate: {
        label: '入社日',
        section: USER_SECTIONS.EMPLOYMENT,
        type: 'date',
    },
    employmentType: {
        label: '雇用形態',
        section: USER_SECTIONS.EMPLOYMENT,
        type: 'select',
        options: EMPLOYMENT_TYPE_OPTIONS,
    },
    department: {
        label: '部署・配属先',
        section: USER_SECTIONS.EMPLOYMENT,
        type: 'text',
    },
    contractEndDate: {
        label: '契約終了日',
        section: USER_SECTIONS.EMPLOYMENT,
        type: 'date',
        helperText: '有期雇用の場合のみ',
    },
    probationEndDate: {
        label: '試用期間終了日',
        section: USER_SECTIONS.EMPLOYMENT,
        type: 'date',
    },

    // === 給与情報 ===
    salaryType: {
        label: '給与形態',
        section: USER_SECTIONS.SALARY,
        type: 'select',
        options: SALARY_TYPE_OPTIONS,
    },
    baseSalary: {
        label: '基本給',
        section: USER_SECTIONS.SALARY,
        type: 'number',
        helperText: '月給または時給（円）',
    },
    weeklyWorkHours: {
        label: '週の所定労働時間',
        section: USER_SECTIONS.SALARY,
        type: 'number',
        helperText: '時間',
    },

    // === 銀行口座 ===
    bankName: {
        label: '銀行名',
        section: USER_SECTIONS.BANK,
        type: 'text',
        placeholder: '○○銀行',
    },
    bankBranchName: {
        label: '支店名',
        section: USER_SECTIONS.BANK,
        type: 'text',
        placeholder: '○○支店',
    },
    bankAccountType: {
        label: '口座種別',
        section: USER_SECTIONS.BANK,
        type: 'select',
        options: BANK_ACCOUNT_TYPE_OPTIONS,
    },
    bankAccountNumber: {
        label: '口座番号',
        section: USER_SECTIONS.BANK,
        type: 'text',
        sensitive: true,
    },
    bankAccountHolder: {
        label: '口座名義',
        section: USER_SECTIONS.BANK,
        type: 'text',
        placeholder: 'ヤマダ タロウ',
    },

    // === 保険情報 ===
    healthInsuranceNumber: {
        label: '健康保険被保険者番号',
        section: USER_SECTIONS.INSURANCE,
        type: 'text',
        sensitive: true,
    },
    pensionNumber: {
        label: '基礎年金番号',
        section: USER_SECTIONS.INSURANCE,
        type: 'text',
        sensitive: true,
        placeholder: '1234-567890',
    },
    employmentInsuranceNumber: {
        label: '雇用保険被保険者番号',
        section: USER_SECTIONS.INSURANCE,
        type: 'text',
        sensitive: true,
    },

    // === 資格・免許 ===
    hasDriverLicense: {
        label: '運転免許',
        section: USER_SECTIONS.LICENSE,
        type: 'boolean',
    },
    driverLicenseType: {
        label: '免許種類',
        section: USER_SECTIONS.LICENSE,
        type: 'select',
        options: DRIVER_LICENSE_TYPE_OPTIONS,
    },
    qualifications: {
        label: '保有資格',
        section: USER_SECTIONS.LICENSE,
        type: 'text',
        multiline: true,
        helperText: '資格名をカンマ区切りで入力',
        placeholder: '介護福祉士, 社会福祉士',
    },

    // === 健康情報 ===
    allergies: {
        label: 'アレルギー情報',
        section: USER_SECTIONS.HEALTH,
        type: 'text',
        multiline: true,
    },
    medicalConditions: {
        label: '持病・服薬情報',
        section: USER_SECTIONS.HEALTH,
        type: 'text',
        multiline: true,
    },
    healthNotes: {
        label: '健康上の注意事項',
        section: USER_SECTIONS.HEALTH,
        type: 'text',
        multiline: true,
    },

    // === 退職情報 ===
    isActive: {
        label: '在籍状況',
        section: USER_SECTIONS.RESIGNATION,
        type: 'boolean',
        default: true,
    },
    resignationDate: {
        label: '退職日',
        section: USER_SECTIONS.RESIGNATION,
        type: 'date',
    },
    resignationReason: {
        label: '退職理由',
        section: USER_SECTIONS.RESIGNATION,
        type: 'text',
        multiline: true,
    },
};

/**
 * セクションごとにフィールドをグループ化
 */
export const getFieldsBySection = (section) => {
    return Object.entries(USER_FIELDS)
        .filter(([_, config]) => config.section === section)
        .map(([key, config]) => ({ key, ...config }));
};

/**
 * 全セクションの順序付きリスト
 */
export const SECTION_ORDER = [
    USER_SECTIONS.BASIC,
    USER_SECTIONS.AFFILIATION,
    USER_SECTIONS.PERSONAL,
    USER_SECTIONS.CONTACT,
    USER_SECTIONS.EMERGENCY,
    USER_SECTIONS.EMPLOYMENT,
    USER_SECTIONS.SALARY,
    USER_SECTIONS.BANK,
    USER_SECTIONS.INSURANCE,
    USER_SECTIONS.LICENSE,
    USER_SECTIONS.HEALTH,
    USER_SECTIONS.RESIGNATION,
];

/**
 * ユーザーの初期値を生成
 */
export const getInitialUserData = () => {
    const data = {};
    Object.entries(USER_FIELDS).forEach(([key, config]) => {
        if (config.default !== undefined) {
            data[key] = config.default;
        } else if (config.type === 'boolean') {
            data[key] = false;
        } else if (config.type === 'number') {
            data[key] = null;
        } else {
            data[key] = '';
        }
    });
    return data;
};
