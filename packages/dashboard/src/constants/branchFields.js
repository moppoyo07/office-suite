// src/constants/branchFields.js
// 支店（事業所）情報フィールド定義（フラット構造）
// 全フィールドのラベル、型、セクション分類を一元管理

/**
 * 支店情報のセクション定義
 */
export const BRANCH_SECTIONS = {
    BASIC: 'basic',
    CONTACT: 'contact',
    WELFARE: 'welfare',
    BANK: 'bank',
    CAPACITY: 'capacity',
    ATTENDANCE: 'attendance', // 出欠設定
};

/**
 * セクションの表示名と色
 */
export const BRANCH_SECTION_CONFIG = {
    [BRANCH_SECTIONS.BASIC]: { label: '基本情報', color: '#10b981', icon: 'Store' },
    [BRANCH_SECTIONS.CONTACT]: { label: '連絡先', color: '#06b6d4', icon: 'Phone' },
    [BRANCH_SECTIONS.WELFARE]: { label: '福祉事業情報', color: '#ec4899', icon: 'VolunteerActivism' },
    [BRANCH_SECTIONS.BANK]: { label: '銀行口座', color: '#22c55e', icon: 'Savings' },
    [BRANCH_SECTIONS.CAPACITY]: { label: '定員・設備', color: '#f59e0b', icon: 'Groups' },
    [BRANCH_SECTIONS.ATTENDANCE]: { label: '出欠設定', color: '#8b5cf6', icon: 'Settings' },
};

/**
 * 全支店フィールドの定義
 */
export const BRANCH_FIELDS = {
    // === 基本情報 ===
    name: {
        label: '支店名（事業所名）',
        section: BRANCH_SECTIONS.BASIC,
        type: 'text',
        required: true,
    },
    nameKana: {
        label: '支店名（カナ）',
        section: BRANCH_SECTIONS.BASIC,
        type: 'text',
    },
    branchCode: {
        label: '事業所コード',
        section: BRANCH_SECTIONS.BASIC,
        type: 'text',
        placeholder: '社内管理用コード',
    },
    openDate: {
        label: '開設日',
        section: BRANCH_SECTIONS.BASIC,
        type: 'date',
    },
    managerName: {
        label: '管理者名',
        section: BRANCH_SECTIONS.BASIC,
        type: 'text',
    },

    // === 連絡先 ===
    phone: {
        label: '電話番号',
        section: BRANCH_SECTIONS.CONTACT,
        type: 'tel',
    },
    fax: {
        label: 'FAX番号',
        section: BRANCH_SECTIONS.CONTACT,
        type: 'tel',
    },
    email: {
        label: 'メールアドレス',
        section: BRANCH_SECTIONS.CONTACT,
        type: 'email',
    },
    postalCode: {
        label: '郵便番号',
        section: BRANCH_SECTIONS.CONTACT,
        type: 'text',
        placeholder: '730-0051',
    },
    prefecture: {
        label: '都道府県',
        section: BRANCH_SECTIONS.CONTACT,
        type: 'text',
    },
    city: {
        label: '市区町村',
        section: BRANCH_SECTIONS.CONTACT,
        type: 'text',
    },
    address1: {
        label: '町名・番地',
        section: BRANCH_SECTIONS.CONTACT,
        type: 'text',
    },
    address2: {
        label: '建物名',
        section: BRANCH_SECTIONS.CONTACT,
        type: 'text',
    },

    // === 福祉事業情報 ===
    serviceTypes: {
        label: '有効なサービス種別 (複数選択)',
        section: BRANCH_SECTIONS.WELFARE,
        type: 'multi-select',
        options: [
            { value: 'b_type', label: '就労継続支援B型' },
            { value: 'a_type', label: '就労継続支援A型' },
            { value: 'transition', label: '就労移行支援' },
            { value: 'life_training', label: '自立訓練（生活訓練）' },
            { value: 'group_home', label: 'グループホーム' },
            { value: 'day_service', label: '生活介護' },
            { value: 'other', label: 'その他' },
        ],
        helperText: 'この支店で提供するサービスを選択してください。',
    },
    welfareServiceNumber: {
        label: '事業所指定番号',
        section: BRANCH_SECTIONS.WELFARE,
        type: 'text',
        helperText: '都道府県発行（10桁）',
    },
    welfareServiceType: {
        label: 'サービス種別',
        section: BRANCH_SECTIONS.WELFARE,
        type: 'select',
        options: [
            { value: 'b_type', label: '就労継続支援B型' },
            { value: 'a_type', label: '就労継続支援A型' },
            { value: 'transition', label: '就労移行支援' },
            { value: 'life_training', label: '自立訓練（生活訓練）' },
            { value: 'group_home', label: 'グループホーム' },
            { value: 'day_service', label: '生活介護' },
            { value: 'other', label: 'その他' },
        ],
    },
    designationDate: {
        label: '指定年月日',
        section: BRANCH_SECTIONS.WELFARE,
        type: 'date',
    },
    renewalDate: {
        label: '更新年月日',
        section: BRANCH_SECTIONS.WELFARE,
        type: 'date',
    },
    municipalityName: {
        label: '保険者（自治体）',
        section: BRANCH_SECTIONS.WELFARE,
        type: 'text',
        placeholder: '○○市',
    },
    assessmentSubmitDaysBefore: {
        label: 'アセスメント提出期限（暫定期間終了の何日前）',
        section: BRANCH_SECTIONS.WELFARE,
        type: 'number',
        placeholder: '14',
        helperText: '暫定期間終了日の何日前に提出するか（デフォルト: 14日前）',
    },

    // === 銀行口座 ===
    bankName: {
        label: '銀行名',
        section: BRANCH_SECTIONS.BANK,
        type: 'text',
        placeholder: '○○銀行',
    },
    bankBranchName: {
        label: '支店名',
        section: BRANCH_SECTIONS.BANK,
        type: 'text',
        placeholder: '○○支店',
    },
    bankAccountType: {
        label: '口座種別',
        section: BRANCH_SECTIONS.BANK,
        type: 'select',
        options: [
            { value: 'ordinary', label: '普通' },
            { value: 'current', label: '当座' },
        ],
    },
    bankAccountNumber: {
        label: '口座番号',
        section: BRANCH_SECTIONS.BANK,
        type: 'text',
    },
    bankAccountHolder: {
        label: '口座名義',
        section: BRANCH_SECTIONS.BANK,
        type: 'text',
    },

    // === 定員・設備 ===
    capacity: {
        label: '定員',
        section: BRANCH_SECTIONS.CAPACITY,
        type: 'number',
        helperText: '利用者の定員数',
    },
    currentUserCount: {
        label: '現在利用者数',
        section: BRANCH_SECTIONS.CAPACITY,
        type: 'number',
    },
    floorSpace: {
        label: '床面積（㎡）',
        section: BRANCH_SECTIONS.CAPACITY,
        type: 'number',
    },
    hasParking: {
        label: '駐車場',
        section: BRANCH_SECTIONS.CAPACITY,
        type: 'select',
        options: [
            { value: 'yes', label: 'あり' },
            { value: 'no', label: 'なし' },
        ],
    },
    parkingSpaces: {
        label: '駐車台数',
        section: BRANCH_SECTIONS.CAPACITY,
        type: 'number',
    },
    hasAccessibility: {
        label: 'バリアフリー対応',
        section: BRANCH_SECTIONS.CAPACITY,
        type: 'select',
        options: [
            { value: 'full', label: '完全対応' },
            { value: 'partial', label: '一部対応' },
            { value: 'none', label: '未対応' },
        ],
    },
    notes: {
        label: '備考',
        section: BRANCH_SECTIONS.CAPACITY,
        type: 'text',
        multiline: true,
    },

    // === 出欠設定 ===
    attendanceMealSupport: {
        label: '食事加算',
        section: BRANCH_SECTIONS.ATTENDANCE,
        type: 'toggle',
        defaultValue: true,
        shortLabel: '食事',
    },
    attendanceTransportGoing: {
        label: '送迎（行き）',
        section: BRANCH_SECTIONS.ATTENDANCE,
        type: 'toggle',
        defaultValue: true,
        shortLabel: '送迎↑',
    },
    attendanceTransportReturning: {
        label: '送迎（帰り）',
        section: BRANCH_SECTIONS.ATTENDANCE,
        type: 'toggle',
        defaultValue: true,
        shortLabel: '送迎↓',
    },
    attendanceTrialUse: {
        label: '体験利用',
        section: BRANCH_SECTIONS.ATTENDANCE,
        type: 'toggle',
        defaultValue: false,
        shortLabel: '体験',
    },
    attendanceHomeVisit: {
        label: '訪問支援',
        section: BRANCH_SECTIONS.ATTENDANCE,
        type: 'toggle',
        defaultValue: false,
        shortLabel: '訪問',
    },
    attendanceTransitionPrep: {
        label: '移行準備',
        section: BRANCH_SECTIONS.ATTENDANCE,
        type: 'toggle',
        defaultValue: false,
        shortLabel: '移行',
    },
    attendanceSocialLife: {
        label: '社会生活',
        section: BRANCH_SECTIONS.ATTENDANCE,
        type: 'toggle',
        defaultValue: false,
        shortLabel: '社会',
    },
    attendanceCommuteTraining: {
        label: '通勤訓練',
        section: BRANCH_SECTIONS.ATTENDANCE,
        type: 'toggle',
        defaultValue: false,
        shortLabel: '通勤',
    },
    attendanceHomeLife: {
        label: '在宅時生活',
        section: BRANCH_SECTIONS.ATTENDANCE,
        type: 'toggle',
        defaultValue: false,
        shortLabel: '在宅生活',
    },
    attendancePsychConsult: {
        label: '精神相談',
        section: BRANCH_SECTIONS.ATTENDANCE,
        type: 'toggle',
        defaultValue: false,
        shortLabel: '精神',
    },
    attendanceMedicalCoop: {
        label: '医療連携',
        section: BRANCH_SECTIONS.ATTENDANCE,
        type: 'toggle',
        defaultValue: false,
        shortLabel: '医連',
    },
    attendanceMedicalHospital: {
        label: '医療連携入院',
        section: BRANCH_SECTIONS.ATTENDANCE,
        type: 'toggle',
        defaultValue: false,
        shortLabel: '医入院',
    },
    attendanceIntensiveSupport: {
        label: '集中支援',
        section: BRANCH_SECTIONS.ATTENDANCE,
        type: 'toggle',
        defaultValue: false,
        shortLabel: '集中',
    },
    attendanceBridgeSupport: {
        label: '繋ぎ支援',
        section: BRANCH_SECTIONS.ATTENDANCE,
        type: 'toggle',
        defaultValue: false,
        shortLabel: '繋ぎ',
    },
    attendanceRegionalCoop: {
        label: '地域協働',
        section: BRANCH_SECTIONS.ATTENDANCE,
        type: 'toggle',
        defaultValue: false,
        shortLabel: '地域',
    },
};

/**
 * セクションごとにフィールドをグループ化
 */
export const getBranchFieldsBySection = (section) => {
    return Object.entries(BRANCH_FIELDS)
        .filter(([_, config]) => config.section === section)
        .map(([key, config]) => ({ key, ...config }));
};

/**
 * 全セクションの順序付きリスト
 */
export const BRANCH_SECTION_ORDER = [
    BRANCH_SECTIONS.BASIC,
    BRANCH_SECTIONS.CONTACT,
    BRANCH_SECTIONS.WELFARE,
    BRANCH_SECTIONS.BANK,
    BRANCH_SECTIONS.CAPACITY,
    BRANCH_SECTIONS.ATTENDANCE,
];

/**
 * 加算フィールドのキー一覧（出欠画面で使用）
 */
export const ATTENDANCE_CHARGE_FIELDS = [
    'attendanceMealSupport',
    'attendanceTransportGoing',
    'attendanceTransportReturning',
    'attendanceTrialUse',
    'attendanceHomeVisit',
    'attendanceTransitionPrep',
    'attendanceSocialLife',
    'attendanceCommuteTraining',
    'attendanceHomeLife',
    'attendancePsychConsult',
    'attendanceMedicalCoop',
    'attendanceMedicalHospital',
    'attendanceIntensiveSupport',
    'attendanceBridgeSupport',
    'attendanceRegionalCoop',
];
