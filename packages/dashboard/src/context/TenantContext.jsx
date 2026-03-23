// src/context/TenantContext.jsx
// マルチテナント対応のグローバルコンテキスト

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { collection, getDocs, doc, getDoc, query, where } from 'firebase/firestore';
import { db } from '../firebase/index';
import { useCurrentUser } from '../hooks/useCurrentUser';

const TenantContext = createContext(null);

/**
 * テナント（企業・支店）のグローバル状態を管理するプロバイダー
 */
export function TenantProvider({ children }) {
    const { profile, isPlatform, isExternal, role, loading: userLoading } = useCurrentUser();

    // 選択中の企業・支店（プラットフォームユーザーは切り替え可能）
    const [selectedCompanyId, setSelectedCompanyId] = useState(null);
    const [selectedBranchId, setSelectedBranchId] = useState(null);

    // エミュレーターモード（プラットフォームオーナーが特定企業として操作する）
    const [emulatingCompanyId, setEmulatingCompanyId] = useState(null);

    // 利用可能な企業・支店リスト
    const [companies, setCompanies] = useState([]);
    const [branches, setBranches] = useState([]);
    const [loading, setLoading] = useState(true);

    // 利用可能な企業を取得
    useEffect(() => {
        if (userLoading || !profile) return;

        const fetchCompanies = async () => {
            setLoading(true);
            try {
                let companiesData = [];

                if (isPlatform) {
                    // プラットフォームユーザーは全企業取得
                    const snapshot = await getDocs(collection(db, 'companies'));
                    companiesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                } else if (isExternal && profile.assignedCompanies?.length > 0) {
                    // 外部ユーザーは割り当てられた企業のみ
                    const promises = profile.assignedCompanies.map(companyId =>
                        getDoc(doc(db, 'companies', companyId))
                    );
                    const docs = await Promise.all(promises);
                    companiesData = docs
                        .filter(d => d.exists())
                        .map(d => ({ id: d.id, ...d.data() }));
                } else if (profile.companyId) {
                    // 企業内ユーザーは自社のみ
                    const companyDoc = await getDoc(doc(db, 'companies', profile.companyId));
                    if (companyDoc.exists()) {
                        companiesData = [{ id: companyDoc.id, ...companyDoc.data() }];
                    }
                }

                setCompanies(companiesData);

                // デフォルト選択
                if (companiesData.length > 0 && !selectedCompanyId) {
                    setSelectedCompanyId(profile.companyId || companiesData[0].id);
                }
            } catch (error) {
                console.error('企業データ取得エラー:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchCompanies();
    }, [profile, isPlatform, isExternal, userLoading]);

    // 選択中の企業に紐づく支店を取得
    useEffect(() => {
        if (!selectedCompanyId) {
            setBranches([]);
            return;
        }

        const fetchBranches = async () => {
            try {
                const q = query(
                    collection(db, 'branches'),
                    where('companyId', '==', selectedCompanyId)
                );
                const snapshot = await getDocs(q);
                const branchesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setBranches(branchesData);

                // デフォルト選択
                if (branchesData.length > 0 && !selectedBranchId) {
                    // 自分の支店があればそれを選択、なければ最初の支店
                    const myBranch = branchesData.find(b => b.id === profile?.branchId);
                    setSelectedBranchId(myBranch?.id || branchesData[0].id);
                }
            } catch (error) {
                console.error('支店データ取得エラー:', error);
            }
        };

        fetchBranches();
    }, [selectedCompanyId, profile?.branchId]);

    // 企業切り替え
    const switchCompany = useCallback((companyId) => {
        if (companies.find(c => c.id === companyId)) {
            setSelectedCompanyId(companyId);
            setSelectedBranchId(null); // 支店はリセット
        }
    }, [companies]);

    // 支店切り替え
    const switchBranch = useCallback((branchId) => {
        if (branches.find(b => b.id === branchId)) {
            setSelectedBranchId(branchId);
        }
    }, [branches]);

    // エミュレーターモード開始（プラットフォームオーナーが特定企業として操作）
    const enterEmulatorMode = useCallback((companyId) => {
        if (isPlatform) {
            setEmulatingCompanyId(companyId);
        }
    }, [isPlatform]);

    // エミュレーターモード終了
    const exitEmulatorMode = useCallback(() => {
        setEmulatingCompanyId(null);
    }, []);

    // 現在選択中のテナント情報
    const currentTenant = useMemo(() => ({
        companyId: selectedCompanyId,
        branchId: selectedBranchId,
        company: companies.find(c => c.id === selectedCompanyId) || null,
        branch: branches.find(b => b.id === selectedBranchId) || null,
    }), [selectedCompanyId, selectedBranchId, companies, branches]);

    // エミュレーター中の企業情報
    const emulatingCompany = useMemo(() => (
        emulatingCompanyId ? (companies.find(c => c.id === emulatingCompanyId) || null) : null
    ), [emulatingCompanyId, companies]);

    // 実際にデータ取得に使うcompanyId
    // - エミュレート中: 対象企業のID
    // - 一般ユーザー: 自分の企業ID
    // - プラットフォームオーナー（非エミュレート）: null → フィルタなし（全データ見える）
    const activeCompanyId = emulatingCompanyId || (isPlatform ? null : profile?.companyId) || null;

    // 企業・支店の切り替えが可能かどうか
    const canSwitchCompany = isPlatform || (isExternal && (profile?.assignedCompanies?.length || 0) > 1);
    const canSwitchBranch = isPlatform || role === 'company_admin' || isExternal;

    const value = {
        // 現在のテナント
        currentTenant,
        companyId: selectedCompanyId,
        branchId: selectedBranchId,

        // データ取得に使う実効companyId（全ページこれを使う）
        activeCompanyId,

        // エミュレーターモード
        isEmulating: !!emulatingCompanyId,
        emulatingCompanyId,
        emulatingCompany,
        enterEmulatorMode,
        exitEmulatorMode,

        // 利用可能なリスト
        companies,
        branches,

        // 切り替え関数
        switchCompany,
        switchBranch,

        // 切り替え可能かどうか
        canSwitchCompany,
        canSwitchBranch,

        // ローディング状態
        loading: loading || userLoading,
    };

    return (
        <TenantContext.Provider value={value}>
            {children}
        </TenantContext.Provider>
    );
}

/**
 * テナントコンテキストを使用するためのフック
 */
export function useTenant() {
    const context = useContext(TenantContext);
    if (!context) {
        throw new Error('useTenant must be used within a TenantProvider');
    }
    return context;
}

export default TenantContext;
