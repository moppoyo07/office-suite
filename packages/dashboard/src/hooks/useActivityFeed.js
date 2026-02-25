import { useState, useEffect, useMemo } from 'react';
import { collectionGroup, query, orderBy, limit, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/index.js';

// クライアント名のキャッシュ（セッション中に同じclientIdの再取得を防ぐ）
const clientNameCache = {};

/**
 * clientIdからクライアント名を解決する
 * キャッシュ済みならキャッシュを返す
 */
async function resolveClientName(clientId) {
    if (clientNameCache[clientId]) return clientNameCache[clientId];

    try {
        const clientDoc = await getDoc(doc(db, 'clients', clientId));
        const name = clientDoc.exists() ? (clientDoc.data().name || '名前なし') : '不明';
        clientNameCache[clientId] = name;
        return name;
    } catch (err) {
        console.warn(`クライアント名解決エラー (${clientId}):`, err);
        return '不明';
    }
}

/**
 * 全クライアントの活動ログを横断取得するリアルタイムフック
 * collectionGroup('activity_logs') で全サブコレクションを一括監視
 * clientNameがない既存ログはクライアントドキュメントから名前を解決する
 */
export const useActivityFeed = (maxItems = 30) => {
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        setLoading(true);
        setError(null);

        try {
            const logsQuery = query(
                collectionGroup(db, 'activity_logs'),
                orderBy('createdAt', 'desc'),
                limit(maxItems)
            );

            const unsubscribe = onSnapshot(logsQuery, async (snapshot) => {
                const rawDocs = snapshot.docs.map(doc => {
                    const data = doc.data();
                    // サブコレクションのパスから親コレクションとIDを抽出
                    // clients/{clientId}/activity_logs/{logId} または
                    // companies/{companyId}/activity_logs/{logId}
                    const pathSegments = doc.ref.path.split('/');
                    const parentCollection = pathSegments[0];
                    const parentId = pathSegments[1];
                    const isCompanyActivity = parentCollection !== 'clients';

                    return {
                        id: doc.id,
                        clientId: isCompanyActivity ? null : parentId,
                        clientName: data.clientName || '',
                        isCompanyActivity,
                        staffName: data.staffName || '不明',
                        staffUid: data.staffUid || '',
                        type: data.type || 'other',
                        content: data.content || '',
                        createdAt: data.createdAt,
                        timestamp: data.createdAt?.toDate?.() || new Date(),
                    };
                });

                // clientNameが空かつクライアント活動のログのみ名前を解決
                const needsResolve = rawDocs.filter(a => !a.clientName && !a.isCompanyActivity);
                if (needsResolve.length > 0) {
                    // ユニークなclientIdだけ取得
                    const uniqueIds = [...new Set(needsResolve.map(a => a.clientId))];
                    // 並列でクライアント名を解決
                    await Promise.all(uniqueIds.map(id => resolveClientName(id)));

                    // 解決した名前を反映
                    rawDocs.forEach(a => {
                        if (!a.clientName && !a.isCompanyActivity && clientNameCache[a.clientId]) {
                            a.clientName = clientNameCache[a.clientId];
                        }
                    });
                }

                setActivities(rawDocs);
                setLoading(false);
            }, (err) => {
                console.error('活動フィード取得エラー:', err);
                setError(err.message);
                setLoading(false);
            });

            return () => unsubscribe();
        } catch (err) {
            console.error('活動フィードクエリ構築エラー:', err);
            setError(err.message);
            setLoading(false);
        }
    }, [maxItems]);

    // スタッフ別の今日の活動件数を集計
    const staffStats = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const todayActivities = activities.filter(a => a.timestamp >= today);
        const staffMap = {};

        todayActivities.forEach(a => {
            if (!staffMap[a.staffName]) {
                staffMap[a.staffName] = { name: a.staffName, count: 0 };
            }
            staffMap[a.staffName].count++;
        });

        return Object.values(staffMap)
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);
    }, [activities]);

    return { activities, staffStats, loading, error };
};
