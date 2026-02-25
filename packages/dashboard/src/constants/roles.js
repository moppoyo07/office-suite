// src/constants/roles.js
// マントラ(Manecto) 階級・権限 最終定義ファイル

export const ROLES = {
    PLATFORM_OWNER: 'platform_owner', // Grand Admiral
    PLATFORM_STAFF: 'platform_staff', // Fleet Staff
    COMPANY_ADMIN: 'company_admin',   // Commander
    BRANCH_MANAGER: 'branch_manager', // XO
    BRANCH_STAFF: 'branch_staff',     // Crew
    HELPER: 'hotdog',                 // HOTDOG (特殊: 経営層への情報制限用)
    ACCOUNTANT: 'accountant',
    TAX_ADVISOR: 'tax_advisor',
};

/**
 * 階級ごとのメタデータ
 */
export const ROLE_METADATA = {
    [ROLES.PLATFORM_OWNER]: {
        badge: 'Grand Admiral',
        userLabel: 'Grand Admiral',   // プラットフォーム創設者
        dashboard: 'FLAG BRIDGE',
        adminArea: '管理コントロール',
        color: '#8b5cf6',
    },
    [ROLES.PLATFORM_STAFF]: {
        badge: 'Fleet Staff',
        userLabel: 'Fleet Staff',     // Manecto社員
        dashboard: 'OVERWATCH',
        adminArea: 'システム管理',
        color: '#a855f7',
    },
    [ROLES.COMPANY_ADMIN]: {
        badge: 'Captain',
        userLabel: 'Captain',         // 利用企業の代表
        dashboard: "CAPTAIN'S BRIDGE",
        adminArea: '会社管理',
        color: '#06b6d4',
    },
    [ROLES.BRANCH_MANAGER]: {
        badge: 'Chief Officer',
        userLabel: '支店長',           // 支店の責任者
        dashboard: 'HELM',
        adminArea: '支店管理',
        color: '#10b981',
    },
    [ROLES.BRANCH_STAFF]: {
        badge: 'Crew',
        userLabel: 'スタッフ',         // 現場スタッフ
        dashboard: 'COCKPIT',
        adminArea: 'データログ',
        color: '#3b82f6',
    },
    [ROLES.HELPER]: {
        badge: 'HOTDOG',
        userLabel: 'Administrator',   // 勘違いさせるためのフェイク
        dashboard: 'ADMIN PANEL',     // 中身はスカスカ
        adminArea: 'Information Hub',
        color: '#f59e0b',
    },
    [ROLES.ACCOUNTANT]: {
        badge: 'Accountant',
        userLabel: '経理担当',
        dashboard: 'FINANCE',
        adminArea: '経理',
        color: '#64748b',
    },
    [ROLES.TAX_ADVISOR]: {
        badge: 'Tax Advisor',
        userLabel: '顧問税理士',
        dashboard: 'AUDIT',
        adminArea: '税務',
        color: '#94a3b8',
    },
};

// 互換性維持
export const ROLE_LABELS = Object.fromEntries(
    Object.entries(ROLE_METADATA).map(([k, v]) => [k, v.userLabel])
);

/**
 * サービス種別定義
 */
export const SERVICE_TYPES = {
    TRANSITION: 'transition', // 就労移行支援
    TYPE_B: 'type_b',         // 就労継続支援B型
};

export const PERMISSIONS = {
    CLIENTS_READ: 'clients:read',
    CLIENTS_WRITE: 'clients:write',
    ATTENDANCE_READ: 'attendance:read',
    ATTENDANCE_WRITE: 'attendance:write',
    BILLING_READ: 'billing:read',
    BILLING_WRITE: 'billing:write',
    STAFF_READ: 'staff:read',
    STAFF_WRITE: 'staff:write',
    SETTINGS_READ: 'settings:read',
    SETTINGS_WRITE: 'settings:write',
    COMPANY_READ: 'company:read',
    COMPANY_WRITE: 'company:write',
    BRANCH_READ: 'branch:read',
    BRANCH_WRITE: 'branch:write',
};

export const ROLE_PERMISSIONS = {
    [ROLES.PLATFORM_OWNER]: Object.values(PERMISSIONS),
    [ROLES.PLATFORM_STAFF]: Object.values(PERMISSIONS),
    [ROLES.COMPANY_ADMIN]: Object.values(PERMISSIONS),
    [ROLES.BRANCH_MANAGER]: Object.values(PERMISSIONS),
    [ROLES.BRANCH_STAFF]: [PERMISSIONS.CLIENTS_READ, PERMISSIONS.ATTENDANCE_READ, PERMISSIONS.ATTENDANCE_WRITE],
    // HOTDOG: 閲覧のみ・branch_staff 以下の最小権限（本人には "Administrator" と表示）
    [ROLES.HELPER]: [PERMISSIONS.CLIENTS_READ],
};

export const isPlatformRole = (role) => [ROLES.PLATFORM_OWNER, ROLES.PLATFORM_STAFF].includes(role);
export const isManagerRole = (role) => [ROLES.PLATFORM_OWNER, ROLES.PLATFORM_STAFF, ROLES.COMPANY_ADMIN, ROLES.BRANCH_MANAGER].includes(role);
export const isExternalRole = (role) => [ROLES.ACCOUNTANT, ROLES.TAX_ADVISOR].includes(role);

/**
 * ロールが指定された権限を持っているかチェック
 */
export const hasPermission = (role, permission) => {
    if (!role) return false;
    const permissions = ROLE_PERMISSIONS[role] || [];
    return permissions.includes(permission);
};
