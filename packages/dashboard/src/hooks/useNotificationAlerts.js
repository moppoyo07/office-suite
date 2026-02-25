import { useState, useEffect, useMemo } from 'react';
import { collection, getDocs, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/index';
import { CLIENT_STATUS } from '../constants/clientStatus';
import { addMonths, differenceInDays, startOfDay, format } from 'date-fns';
import { useAuth } from '../features/auth/context/AuthContext'; // useAuthに変更

// アラート種別の設定
const ALERT_CONFIGS = {
    followUp1: { label: '定着1ヶ月目面談', daysBeforeShow: 14, yellowDays: 7, redDays: 2 },
    followUp2: { label: '定着2ヶ月目面談', daysBeforeShow: 14, yellowDays: 7, redDays: 2 },
    followUp3: { label: '定着3ヶ月目面談', daysBeforeShow: 14, yellowDays: 7, redDays: 2 },
    followUp4: { label: '定着4ヶ月目面談', daysBeforeShow: 14, yellowDays: 7, redDays: 2 },
    followUp5: { label: '定着5ヶ月目面談', daysBeforeShow: 14, yellowDays: 7, redDays: 2 },
    followUp6: { label: '定着6ヶ月目面談', daysBeforeShow: 14, yellowDays: 7, redDays: 2 },
    interview: { label: '見学予定', daysBeforeShow: 7, yellowDays: 3, redDays: 1 },
    trial: { label: '体験開始', daysBeforeShow: 7, yellowDays: 3, redDays: 1 },
    recipientExpiry: { label: '受給者証期限', daysBeforeShow: 30, yellowDays: 14, redDays: 7 },
    provisionalPeriod: { label: '暫定期間終了（書類提出）', daysBeforeShow: 14, yellowDays: 7, redDays: 3 },
    interviewReminder: { label: '見学前日リマインダー', daysBeforeShow: 1, yellowDays: 1, redDays: 0 },
    trialReminder: { label: '体験前日リマインダー', daysBeforeShow: 1, yellowDays: 1, redDays: 0 },
};

// 色を決定
const getAlertColor = (daysUntil, config) => {
    if (daysUntil <= config.redDays) return 'red';
    if (daysUntil <= config.yellowDays) return 'yellow';
    return 'blue';
};

export function useNotificationAlerts() {
    const { currentUser } = useAuth(); // useAuthを使用
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [incompleteTasks, setIncompleteTasks] = useState([]); // 未完了タスク

    // 1. クライアントデータを取得（こちらは頻繁に変わらないのでワンショット）
    useEffect(() => {
        const fetchClients = async () => {
            setLoading(true);
            try {
                const targetStatuses = [
                    CLIENT_STATUS.INTERVIEW,
                    CLIENT_STATUS.TRIAL,
                    CLIENT_STATUS.ACTIVE_ONSITE,
                    CLIENT_STATUS.ACTIVE_REMOTE,
                    'follow-up-m1', 'follow-up-m2', 'follow-up-m3',
                    'follow-up-m4', 'follow-up-m5', 'follow-up-m6',
                ];
                const qClients = query(
                    collection(db, 'clients'),
                    where('status', 'in', targetStatuses)
                );
                const snapshotClients = await getDocs(qClients);
                const clientsData = snapshotClients.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setClients(clientsData);
            } catch (error) {
                console.error('クライアントデータ取得エラー:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchClients();
    }, []);

    // 2. 今日のタスクデータをリアルタイム監視
    useEffect(() => {
        if (!currentUser) return;

        const todayStr = format(new Date(), 'yyyy-MM-dd');
        // 今日の自分のタスクを監視
        const qTasks = query(
            collection(db, 'staffTasks'),
            where('userId', '==', currentUser.uid),
            where('date', '==', todayStr)
        );

        // リアルタイムリスナー設定
        const unsubscribe = onSnapshot(qTasks, (snapshot) => {
            const completedTaskIds = new Set();

            snapshot.forEach(doc => {
                const data = doc.data();
                if (data.status === 'completed') {
                    completedTaskIds.add(data.taskId);
                }
            });

            // プリセットタスクから未完了を抽出
            // ※ PRESET_QUESTS と同期が必要だが、ここでもIDリストを使用
            const PRESET_IDS = ['water_refill', 'office_cleaning', 'mail_check', 'blog_post', 'follow_up_check'];

            // 未完了のタスクIDリストを作成
            const pendingTasks = PRESET_IDS.filter(id => !completedTaskIds.has(id));

            setIncompleteTasks(pendingTasks);
        }, (error) => {
            console.error('タスク監視エラー:', error);
        });

        return () => unsubscribe();
    }, [currentUser]);

    // アラートを計算
    const alerts = useMemo(() => {
        const today = startOfDay(new Date());
        const result = [];

        clients.forEach(client => {
            // ロスト済みはスキップ
            if (client.status === CLIENT_STATUS.CLOSED) return;

            const clientName = client.name || '名前なし';

            // 1. 定着支援面談アラート
            if (client.status?.startsWith('follow-up') && client.employmentDate) {
                const employmentDate = client.employmentDate.toDate ? client.employmentDate.toDate() : new Date(client.employmentDate);

                // 1〜6ヶ月目をチェック
                for (let month = 1; month <= 6; month++) {
                    const fieldName = `followUp${month}MonthDate`;
                    const config = ALERT_CONFIGS[`followUp${month}`];

                    // 予定日が設定されているか
                    let targetDate;
                    if (client[fieldName]) {
                        // 予定日が設定済み → その日付を使用
                        targetDate = client[fieldName].toDate ? client[fieldName].toDate() : new Date(client[fieldName]);
                    } else {
                        // 予定日未設定 → 就職日から自動計算
                        targetDate = addMonths(employmentDate, month);
                    }

                    const daysUntil = differenceInDays(startOfDay(targetDate), today);

                    // 表示条件: 
                    // - 0日以上（当日含む）
                    // - 表示開始日以内
                    // - 予定日設定済みの場合: 2日前から再表示
                    const isScheduled = !!client[fieldName];

                    if (daysUntil >= 0 && daysUntil <= config.daysBeforeShow) {
                        // 予定日設定済みで3日以上なら非表示
                        if (isScheduled && daysUntil > 2) continue;

                        result.push({
                            id: `${client.id}-followUp${month}`,
                            clientId: client.id,
                            clientName,
                            type: `followUp${month}`,
                            label: config.label,
                            targetDate,
                            daysUntil,
                            color: getAlertColor(daysUntil, config),
                            isScheduled,
                        });
                    }
                }
            }

            // 2. 見学予定アラート
            if (client.status === CLIENT_STATUS.INTERVIEW && client.interviewDate) {
                const config = ALERT_CONFIGS.interview;
                const targetDate = client.interviewDate.toDate ? client.interviewDate.toDate() : new Date(client.interviewDate);
                const daysUntil = differenceInDays(startOfDay(targetDate), today);

                if (daysUntil >= 0 && daysUntil <= config.daysBeforeShow) {
                    result.push({
                        id: `${client.id}-interview`,
                        clientId: client.id,
                        clientName,
                        type: 'interview',
                        label: config.label,
                        targetDate,
                        daysUntil,
                        color: getAlertColor(daysUntil, config),
                    });
                }
            }

            // 3. 体験開始アラート
            if (client.status === CLIENT_STATUS.TRIAL && client.trialStartDate) {
                const config = ALERT_CONFIGS.trial;
                const targetDate = client.trialStartDate.toDate ? client.trialStartDate.toDate() : new Date(client.trialStartDate);
                const daysUntil = differenceInDays(startOfDay(targetDate), today);

                if (daysUntil >= 0 && daysUntil <= config.daysBeforeShow) {
                    result.push({
                        id: `${client.id}-trial`,
                        clientId: client.id,
                        clientName,
                        type: 'trial',
                        label: config.label,
                        targetDate,
                        daysUntil,
                        color: getAlertColor(daysUntil, config),
                    });
                }
            }

            // 4. 受給者証有効期限アラート
            if (client.recipientExpiry) {
                const config = ALERT_CONFIGS.recipientExpiry;
                const targetDate = client.recipientExpiry.toDate ? client.recipientExpiry.toDate() : new Date(client.recipientExpiry);
                const daysUntil = differenceInDays(startOfDay(targetDate), today);

                // 期限前30日～期限後7日まで表示（期限切れも表示）
                if (daysUntil >= -7 && daysUntil <= config.daysBeforeShow) {
                    result.push({
                        id: `${client.id}-recipientExpiry`,
                        clientId: client.id,
                        clientName,
                        type: 'recipientExpiry',
                        label: daysUntil < 0 ? '受給者証期限切れ' : config.label,
                        targetDate,
                        daysUntil: Math.max(0, daysUntil),
                        color: daysUntil < 0 ? 'red' : getAlertColor(daysUntil, config),
                    });
                }
            }

            // 5. 暫定期間終了アラート
            if (client.provisionalPeriodEndDate) {
                const config = ALERT_CONFIGS.provisionalPeriod;
                const targetDate = client.provisionalPeriodEndDate.toDate ? client.provisionalPeriodEndDate.toDate() : new Date(client.provisionalPeriodEndDate);
                const daysUntil = differenceInDays(startOfDay(targetDate), today);

                // 14日前～当日まで表示
                if (daysUntil >= 0 && daysUntil <= config.daysBeforeShow) {
                    result.push({
                        id: `${client.id}-provisionalPeriod`,
                        clientId: client.id,
                        clientName,
                        type: 'provisionalPeriod',
                        label: config.label,
                        targetDate,
                        daysUntil,
                        color: getAlertColor(daysUntil, config),
                    });
                }
            }

            // 6. 見学前日リマインダー
            if (client.status === CLIENT_STATUS.INTERVIEW && client.interviewDate) {
                const config = ALERT_CONFIGS.interviewReminder;
                const targetDate = client.interviewDate.toDate ? client.interviewDate.toDate() : new Date(client.interviewDate);
                const daysUntil = differenceInDays(startOfDay(targetDate), today);

                // 前日のみ表示（daysUntil === 1）
                if (daysUntil === 1) {
                    result.push({
                        id: `${client.id}-interviewReminder`,
                        clientId: client.id,
                        clientName,
                        type: 'interviewReminder',
                        label: `${config.label} - ${format(targetDate, 'M/d')}`,
                        targetDate,
                        daysUntil,
                        color: 'yellow', // 前日リマインダーは常に黄色
                    });
                }
            }

            // 7. 体験前日リマインダー
            if (client.status === CLIENT_STATUS.TRIAL && client.trialStartDate) {
                const config = ALERT_CONFIGS.trialReminder;
                const targetDate = client.trialStartDate.toDate ? client.trialStartDate.toDate() : new Date(client.trialStartDate);
                const daysUntil = differenceInDays(startOfDay(targetDate), today);

                // 前日のみ表示（daysUntil === 1）
                if (daysUntil === 1) {
                    result.push({
                        id: `${client.id}-trialReminder`,
                        clientId: client.id,
                        clientName,
                        type: 'trialReminder',
                        label: `${config.label} - ${format(targetDate, 'M/d')}`,
                        targetDate,
                        daysUntil,
                        color: 'yellow', // 前日リマインダーは常に黄色
                    });
                }
            }
        });

        // 日付順（近い順）にソート
        result.sort((a, b) => a.daysUntil - b.daysUntil);

        // 未完了タスクアラートを先頭に追加
        if (incompleteTasks.length > 0) {
            const taskCount = incompleteTasks.length;
            result.unshift({
                id: 'daily-quest-alert',
                clientId: 'system',
                clientName: '本日のクエスト',
                type: 'quest',
                label: `残り${taskCount}件`,
                targetDate: new Date(),
                daysUntil: 0,
                color: 'purple', // 新しい色を追加する必要がある
                message: `未完了のタスクが${taskCount}件あります！`
            });
        }

        return result;
    }, [clients, incompleteTasks]);

    return { alerts, loading };
}
