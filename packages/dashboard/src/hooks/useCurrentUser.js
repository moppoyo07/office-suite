// src/hooks/useCurrentUser.js
// マルチテナント対応のユーザー情報フック

import { useState, useEffect, useCallback, useMemo } from 'react';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/index';
import { useAuth } from '../features/auth/context/AuthContext';
import { ROLE_PERMISSIONS, isPlatformRole, isExternalRole, hasPermission } from '../constants/roles';

/**
 * 現在ログイン中のユーザー情報とテナント情報を管理するフック
 * 
 * @returns {Object} ユーザー情報とヘルパー関数
 */
export function useCurrentUser() {
    const { currentUser } = useAuth();
    const [userProfile, setUserProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Firestoreからユーザープロファイルをリアルタイム取得
    useEffect(() => {
        if (!currentUser?.uid) {
            setUserProfile(null);
            setLoading(false);
            return;
        }

        setLoading(true);
        const userDocRef = doc(db, 'users', currentUser.uid);

        const unsubscribe = onSnapshot(
            userDocRef,
            (docSnap) => {
                if (docSnap.exists()) {
                    setUserProfile({
                        id: docSnap.id,
                        ...docSnap.data(),
                    });
                } else {
                    // ユーザードキュメントがない場合（addDocで作成されたユーザーなど）
                    // AuthContextがメール検索で取得済みの情報をフォールバックとして使う
                    setUserProfile({
                        id: currentUser.uid,
                        email: currentUser.email,
                        displayName: currentUser.displayName,
                        role: currentUser.role || null,
                        companyId: currentUser.companyId || null,
                        branchId: currentUser.branchId || null,
                    });
                }
                setLoading(false);
            },
            (err) => {
                console.error('ユーザープロファイル取得エラー:', err);
                setError(err);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [currentUser?.uid]);

    // 現在のテナント情報
    const tenant = useMemo(() => {
        if (!userProfile) return null;
        return {
            companyId: userProfile.companyId,
            branchId: userProfile.branchId,
            assignedCompanies: userProfile.assignedCompanies || [],
        };
    }, [userProfile]);

    // ロール関連ヘルパー
    const role = userProfile?.role || null;

    const isPlatform = useMemo(() => {
        return isPlatformRole(role);
    }, [role]);

    const isExternal = useMemo(() => isExternalRole(role), [role]);

    // 権限チェック関数
    const can = useCallback((permission) => {
        if (!role) return false;
        return hasPermission(role, permission);
    }, [role]);

    // 指定された企業のデータにアクセスできるか
    const canAccessCompany = useCallback((companyId) => {
        if (!userProfile) return false;

        // プラットフォームレベルは全企業アクセス可能
        if (isPlatform) return true;

        // 外部ロール（税理士・経理）は assignedCompanies をチェック
        if (isExternal) {
            return userProfile.assignedCompanies?.includes(companyId);
        }

        // 企業内ロールは自社のみ
        return userProfile.companyId === companyId;
    }, [userProfile, isPlatform, isExternal]);

    // 指定された支店のデータにアクセスできるか
    const canAccessBranch = useCallback((branchId, branchCompanyId) => {
        if (!userProfile) return false;

        // まず企業アクセス権チェック
        if (!canAccessCompany(branchCompanyId)) return false;

        // プラットフォーム・企業アドミン・外部ロールは企業内の全支店アクセス可能
        if (isPlatform || userProfile.role === 'company_admin' || isExternal) {
            return true;
        }

        // 支店レベルは自支店のみ
        return userProfile.branchId === branchId;
    }, [userProfile, isPlatform, isExternal, canAccessCompany]);

    return {
        // 基本情報
        user: currentUser,           // Firebase Auth ユーザー
        profile: userProfile,        // Firestore ユーザープロファイル
        loading,
        error,

        // テナント情報
        tenant,
        companyId: tenant?.companyId,
        branchId: tenant?.branchId,

        // ロール情報
        role,
        isPlatform,
        isExternal,

        // 権限チェック
        can,
        canAccessCompany,
        canAccessBranch,
    };
}

export default useCurrentUser;
