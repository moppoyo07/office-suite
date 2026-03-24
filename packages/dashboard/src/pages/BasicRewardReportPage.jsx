// src/pages/BasicRewardReportPage.jsx
// 就労移行支援に係る基本報酬の算定区分に関する届出書（別紙38）

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
    Box, Container, Typography, Paper, Button, Stack,
    FormControl, InputLabel, Select, MenuItem, CircularProgress, Chip,
} from '@mui/material';
import { Print, ArrowBack } from '@mui/icons-material';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { addMonths, getYear, getMonth } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { useTenant } from '../context/TenantContext';

const getFiscalYear = (date) => {
    if (!date) return null;
    const m = getMonth(date);
    return m < 3 ? getYear(date) - 1 : getYear(date);
};

const FISCAL_MONTHS = [4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2, 3];

const getCategory = (rate, isOver2Years) => {
    if (!isOver2Years) return { num: 8, label: 'なし（経過措置対象）' };
    if (rate >= 50) return { num: 1, label: '就職後6月以上定着率が5割以上' };
    if (rate >= 40) return { num: 2, label: '就職後6月以上定着率が4割以上5割未満' };
    if (rate >= 30) return { num: 3, label: '就職後6月以上定着率が3割以上4割未満' };
    if (rate >= 20) return { num: 4, label: '就職後6月以上定着率が2割以上3割未満' };
    if (rate >= 10) return { num: 5, label: '就職後6月以上定着率が1割以上2割未満' };
    if (rate > 0)   return { num: 6, label: '就職後6月以上定着率が0割超1割未満' };
    return { num: 7, label: '就職後6月以上定着率が0' };
};

const CATEGORY_LABELS = [
    '就職後6月以上定着率が5割以上',
    '就職後6月以上定着率が4割以上5割未満',
    '就職後6月以上定着率が3割以上4割未満',
    '就職後6月以上定着率が2割以上3割未満',
    '就職後6月以上定着率が1割以上2割未満',
    '就職後6月以上定着率が0割超1割未満',
    '就職後6月以上定着率が0',
    'なし（経過措置対象）',
];

const PRINT_CSS = `
body {
    font-family: "MS Mincho", "Hiragino Mincho ProN", serif;
    background-color: #fff;
    padding: 20px;
    color: #000;
    font-size: 13px;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
}
table { border-collapse: collapse; }
td, th { font-size: 0.85em; }
h1 { font-size: 1.3em; text-decoration: underline; margin: 0; }
h2 { font-size: 1.0em; font-weight: normal; margin-top: 2px; }
span[style*="radial-gradient"] { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
@page { size: A4 portrait; margin: 12mm; }
`;

export default function BasicRewardReportPage() {
    const navigate = useNavigate();
    const { activeCompanyId: companyId, currentTenant } = useTenant();
    const branch = currentTenant?.branch;
    const capacity = branch?.capacity ?? null;
    const startDate = branch?.designationDate
        ? (branch.designationDate.toDate ? branch.designationDate.toDate() : new Date(branch.designationDate))
        : null;
    const printRef = useRef(null);

    const currentFiscalYear = getFiscalYear(new Date());
    const yearOptions = Array.from({ length: 9 }, (_, i) => currentFiscalYear + 3 - i);

    const [targetYear, setTargetYear] = useState(currentFiscalYear + 1);
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isOver2Years, setIsOver2Years] = useState(true);

    useEffect(() => {
        const fetch = async () => {
            setLoading(true);
            try {
                const companyFilter = companyId ? [where('companyId', '==', companyId)] : [];
                const q = query(collection(db, 'clients'), ...companyFilter, where('status', '==', 'completed'));
                const snap = await getDocs(q);
                setClients(snap.docs.map(d => ({ id: d.id, ...d.data() })));
            } catch (err) {
                console.error('データ取得エラー:', err);
            } finally {
                setLoading(false);
            }
        };
        fetch();
    }, [companyId]);

    const prevYear = targetYear - 1;
    const prevPrevYear = targetYear - 2;

    const monthlyData = useMemo(() => {
        const result = { prev: {}, prevPrev: {} };
        FISCAL_MONTHS.forEach(m => { result.prev[m] = 0; result.prevPrev[m] = 0; });
        clients.forEach(client => {
            if (!client.employmentDate) return;
            const empDate = client.employmentDate.toDate ? client.employmentDate.toDate() : new Date(client.employmentDate);
            const settledDate = addMonths(empDate, 6);
            const fy = getFiscalYear(settledDate);
            const month = getMonth(settledDate) + 1;
            if (fy === prevYear) result.prev[month] = (result.prev[month] || 0) + 1;
            else if (fy === prevPrevYear) result.prevPrev[month] = (result.prevPrev[month] || 0) + 1;
        });
        return result;
    }, [clients, prevYear, prevPrevYear]);

    const prevTotal = FISCAL_MONTHS.reduce((s, m) => s + (monthlyData.prev[m] || 0), 0);
    const prevPrevTotal = FISCAL_MONTHS.reduce((s, m) => s + (monthlyData.prevPrev[m] || 0), 0);
    const numerator = prevTotal + prevPrevTotal;
    const denominator = (capacity || 0) * 2;
    const rate = denominator > 0 ? Math.round((numerator / denominator) * 100) : 0;

    // startDate または targetYear が変わったら自動で初期値を設定（手動変更後は上書きしない）
    useEffect(() => {
        const auto = startDate ? (targetYear - getFiscalYear(startDate)) >= 2 : true;
        setIsOver2Years(auto);
    }, [startDate, targetYear]);

    const category = getCategory(rate, isOver2Years);
    const facilityName = currentTenant?.company?.name || '';

    const handlePrint = () => {
        const content = printRef.current;
        if (!content) return;
        const win = window.open('', '_blank');
        win.document.write(`<!DOCTYPE html><html lang="ja"><head>
<meta charset="UTF-8">
<title>別紙38_${targetYear}年度</title>
<style>${PRINT_CSS}</style>
</head><body><div class="a4-page">${content.innerHTML}</div></body></html>`);
        win.document.close();
        setTimeout(() => { win.print(); win.close(); }, 400);
    };

    if (loading) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}><CircularProgress /></Box>;
    }

    return (
        <Container maxWidth="lg" sx={{ py: 3 }}>
            {/* コントロールバー */}
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                <Stack direction="row" alignItems="center" spacing={2}>
                    <Button startIcon={<ArrowBack />} onClick={() => navigate('/annual')} sx={{ color: 'text.secondary' }}>
                        年次処理センター
                    </Button>
                    <Typography variant="h5" fontWeight="bold">基本報酬算定区分 届出書（別紙38）</Typography>
                </Stack>
                <Stack direction="row" spacing={2} alignItems="center">
                    <FormControl size="small" sx={{ minWidth: 140 }}>
                        <InputLabel>届出対象年度</InputLabel>
                        <Select value={targetYear} label="届出対象年度" onChange={e => setTargetYear(Number(e.target.value))}>
                            {yearOptions.map(y => <MenuItem key={y} value={y}>{y}年度</MenuItem>)}
                        </Select>
                    </FormControl>
                    <Button variant="contained" startIcon={<Print />} onClick={handlePrint} sx={{ px: 3 }}>
                        印刷（別紙38）
                    </Button>
                </Stack>
            </Stack>

            {/* 計算サマリー */}
            <Paper sx={{ p: 2, mb: 3, bgcolor: 'rgba(30,41,59,0.5)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 2 }}>
                <Stack direction="row" spacing={4} flexWrap="wrap" alignItems="center">
                    <Box>
                        <Typography variant="caption" color="text.secondary">前年度（{prevYear}年度）定着者</Typography>
                        <Typography variant="h6" fontWeight="bold">{prevTotal}人</Typography>
                    </Box>
                    <Box>
                        <Typography variant="caption" color="text.secondary">前々年度（{prevPrevYear}年度）定着者</Typography>
                        <Typography variant="h6" fontWeight="bold">{prevPrevTotal}人</Typography>
                    </Box>
                    <Box>
                        <Typography variant="caption" color="text.secondary">定員×2年度</Typography>
                        <Typography variant="h6" fontWeight="bold">{denominator}人</Typography>
                    </Box>
                    <Box>
                        <Typography variant="caption" color="text.secondary">就労定着率</Typography>
                        <Typography variant="h5" fontWeight="bold" color="primary.main">{rate}%</Typography>
                    </Box>
                    <Chip
                        label={`区分${category.num}　${category.label}`}
                        color={category.num <= 3 ? 'success' : category.num <= 5 ? 'warning' : 'error'}
                        sx={{ fontWeight: 'bold', fontSize: '0.85rem', height: 36 }}
                    />
                </Stack>
            </Paper>

            {/* 印刷プレビュー */}
            <Paper sx={{ p: 2, bgcolor: '#e0e0e0' }}>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                    印刷プレビュー
                </Typography>

                {/* ===== 印刷対象エリア ===== */}
                <Box
                    ref={printRef}
                    style={{
                        width: '800px', margin: '0 auto', backgroundColor: '#fff', padding: '20px',
                        boxShadow: '0 0 10px rgba(0,0,0,0.1)',
                        fontFamily: '"MS Mincho","Hiragino Mincho ProN",serif',
                        color: '#000',
                        fontSize: '13px',
                    }}
                >
                    {/* タイトル */}
                    <div style={{ textAlign: 'center', position: 'relative', marginBottom: '10px' }}>
                        <span style={{ position: 'absolute', left: 0, top: 0, fontSize: '0.9em' }}>別紙38</span>
                        <h1 style={{ fontSize: '1.3em', marginBottom: '4px', textDecoration: 'underline', margin: 0 }}>
                            就労移行支援に係る基本報酬の算定区分に関する届出書
                        </h1>
                        <h2 style={{ fontSize: '1.0em', marginTop: '2px', fontWeight: 'normal' }}>
                            （就労移行支援・就労定着率区分算定シート）
                        </h2>
                    </div>

                    {/*
                        外枠: 95%幅の単一テーブル、3カラム構成
                          col A = 10%  col B = 20%  col C = 70%
                        Row1-2: [A+B colspan=2 = 30%] [C = 70%]
                        Row3-4: [A = 10%] [B+C colspan=2 = 90%]
                        colはHTMLのwidth属性（CSSなし）で指定
                    */}
                    <table
                        width="95%"
                        border="1"
                        cellPadding="4"
                        cellSpacing="0"
                        style={{ borderCollapse: 'collapse', margin: '0 auto', tableLayout: 'fixed' }}
                    >
                        <col width="10%" />
                        <col width="20%" />
                        <col width="70%" />
                        <tbody>
                            {/* Row 1: 施設名 */}
                            <tr>
                                <td colSpan={2} align="center" style={{ padding: '10px 6px' }}><b>施設・事業所名</b></td>
                                <td align="left" style={{ padding: '10px' }}>{facilityName}</td>
                            </tr>
                            {/* Row 2: 指定時期 */}
                            <tr>
                                <td colSpan={2} align="center"><b>指定を受けた時期</b></td>
                                <td>
                                    <table width="100%" border="0" cellPadding="2" cellSpacing="0">
                                        <tbody>
                                            <tr>
                                                <td width="50%" align="center" style={{ fontSize: '0.85em', cursor: 'pointer' }} onClick={() => setIsOver2Years(true)}>
                                                    <span style={{ display: 'inline-block', width: '11px', height: '11px', border: '1px solid #000', borderRadius: '50%', marginRight: '4px', verticalAlign: 'middle', ...(isOver2Years ? { backgroundImage: 'radial-gradient(circle, #000 40%, transparent 40%)' } : {}) }}></span>
                                                    就労移行支援の指定を受けてから<br />２年以上経過した事業所
                                                </td>
                                                <td width="50%" align="center" style={{ fontSize: '0.85em', cursor: 'pointer' }} onClick={() => setIsOver2Years(false)}>
                                                    <span style={{ display: 'inline-block', width: '11px', height: '11px', border: '1px solid #000', borderRadius: '50%', marginRight: '4px', verticalAlign: 'middle', ...(!isOver2Years ? { backgroundImage: 'radial-gradient(circle, #000 40%, transparent 40%)' } : {}) }}></span>
                                                    就労移行支援の指定を受けてから<br />２年間を経過していない事業所
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </td>
                            </tr>
                            {/* Row 3: 月別データ */}
                            <tr>
                                <td
                                    align="center"
                                    style={{ writingMode: 'vertical-rl', textOrientation: 'upright', letterSpacing: '2px', fontSize: '0.75em', lineHeight: '1.2', verticalAlign: 'middle', padding: '20px 0' }}
                                >
                                    前年度及び前々年度の就職後6月以上定着者の状況
                                </td>
                                <td colSpan={2} style={{ padding: '12px' }}>
                                    {/* 5パーツをflexで横並び */}
                                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0', width: '100%', justifyContent: 'space-between' }}>

                                        {/* 1. 月割りテーブル（5列: 月|前年数値|人|前々年数値|人） */}
                                        <table border="1" cellPadding="4" cellSpacing="0" style={{ borderCollapse: 'collapse' }}>
                                            <thead>
                                                <tr>
                                                    <td rowSpan={3} align="center" width="40px"><b>月</b></td>
                                                    <td colSpan={4} align="center"><b>就職後６月以上定着者数</b></td>
                                                </tr>
                                                <tr>
                                                    <td colSpan={2} align="center"><b>前年度</b><br />（{prevYear}年度）</td>
                                                    <td colSpan={2} align="center"><b>前々年度</b><br />（{prevPrevYear}年度）</td>
                                                </tr>
                                                <tr>
                                                    <td align="center" width="65px">人数</td>
                                                    <td align="center" width="30px"></td>
                                                    <td align="center" width="65px">人数</td>
                                                    <td align="center" width="30px"></td>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {FISCAL_MONTHS.map(month => (
                                                    <tr key={month}>
                                                        <td align="center">{month}月</td>
                                                        <td align="center">{monthlyData.prev[month] || ''}</td>
                                                        <td align="center">人</td>
                                                        <td align="center">{monthlyData.prevPrev[month] || ''}</td>
                                                        <td align="center">人</td>
                                                    </tr>
                                                ))}
                                                {/* 合計行：前年度+前々年度の合計を1セルで表示 */}
                                                <tr>
                                                    <td align="center"><b>合計</b></td>
                                                    <td colSpan={3} align="center" style={{ fontSize: '1.1em' }}><b>{numerator}</b></td>
                                                    <td align="center">人</td>
                                                </tr>
                                            </tbody>
                                        </table>

                                        {/* 2. ÷ */}
                                        <div style={{ padding: '0 10px 6px', display: 'flex', alignItems: 'flex-end' }}>
                                            <span style={{ fontSize: '22px', fontWeight: '100' }}>÷</span>
                                        </div>

                                        {/* 3. 利用定員数テーブル（4列: 前年数値|人|前々年数値|人） */}
                                        <table border="1" cellPadding="4" cellSpacing="0" style={{ borderCollapse: 'collapse' }}>
                                            <thead>
                                                <tr>
                                                    <td colSpan={4} align="center"><b>利用定員数</b></td>
                                                </tr>
                                                <tr>
                                                    <td colSpan={2} align="center" width="90px">前年度　（{prevYear}年度）</td>
                                                    <td colSpan={2} align="center" width="90px">前々年度（{prevPrevYear}年度）</td>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <tr>
                                                    <td align="center" width="65px"><b>{capacity ?? '-'}</b></td>
                                                    <td align="center" width="30px">人</td>
                                                    <td align="center" width="65px"><b>{capacity ?? '-'}</b></td>
                                                    <td align="center" width="30px">人</td>
                                                </tr>
                                                <tr>
                                                    <td colSpan={2} align="center"><b>合計</b></td>
                                                    <td align="center"><b>{denominator}</b></td>
                                                    <td align="center">人</td>
                                                </tr>
                                            </tbody>
                                        </table>

                                        {/* 4. ＝ */}
                                        <div style={{ padding: '0 10px 6px', display: 'flex', alignItems: 'flex-end' }}>
                                            <span style={{ fontSize: '22px', fontWeight: '100' }}>＝</span>
                                        </div>

                                        {/* 5. 就労定着率テーブル（2列: 数値|%） */}
                                        <table border="1" cellPadding="4" cellSpacing="0" style={{ borderCollapse: 'collapse' }}>
                                            <thead>
                                                <tr>
                                                    <td colSpan={2} align="center"><b>就労定着率</b></td>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <tr>
                                                    <td align="center" width="85px" style={{ fontSize: '1.4em', fontWeight: 'bold' }}>{rate}</td>
                                                    <td align="center" width="30px"><b>%</b></td>
                                                </tr>
                                            </tbody>
                                        </table>

                                    </div>
                                </td>
                            </tr>
                            {/* Row 4: 就労定着率区分 */}
                            <tr>
                                <td
                                    align="center"
                                    style={{ writingMode: 'vertical-rl', textOrientation: 'upright', letterSpacing: '2px', fontSize: '0.75em', lineHeight: '1.2', verticalAlign: 'middle' }}
                                >
                                    就労定着率区分
                                </td>
                                <td colSpan={2} align="left" style={{ padding: '8px 14px' }}>
                                    <div style={{ border: '2px solid #000', padding: '3px 14px', display: 'inline-block', minWidth: '280px', marginBottom: '6px', fontWeight: 'bold', fontSize: '1.0em' }}>
                                        {category.num}　{category.label}
                                    </div>
                                    <span style={{ marginLeft: '8px', fontSize: '0.9em' }}>の区分に該当</span>
                                    <ul style={{ listStyle: 'none', paddingLeft: '30px', textAlign: 'left', fontSize: '0.85em', lineHeight: '1.8', margin: '4px 0 0' }}>
                                        {CATEGORY_LABELS.map((label, i) => (
                                            <li key={i} style={{ fontWeight: (i + 1) === category.num ? 'bold' : 'normal', textDecoration: (i + 1) === category.num ? 'underline' : 'none' }}>
                                                （区分）{i + 1}　{label}
                                            </li>
                                        ))}
                                    </ul>
                                </td>
                            </tr>
                        </tbody>
                    </table>

                    {/* 注釈 */}
                    <div style={{ fontSize: '0.72em', textAlign: 'left', marginTop: '12px', lineHeight: '1.5', width: '95%', marginLeft: 'auto', marginRight: 'auto' }}>
                        <div>注１　就職後６月以上定着者とは、就労移行支援等を受けた後、就労し、就労を継続している期間が６月に達した者（就労定着者という。）をいい、前年度及び前々年度の実績を記載すること（就労とは企業等に就労した者で就労継続支援Ａ型事業所への移行は除くこと。）。</div>
                        <div>注２　令和３年10月１日に就職した者は、令和４年３月31日に６月に達した者となることから、令和３年度の実績に含まれることとなる。</div>
                        <div>注３　就労定着率区分「なし（経過措置対象）」は、指定を受けてから２年間を経過していない事業所が選択する。</div>
                        <div>注４　就労定着者の状況は、別添「就労定着者の状況（就労移行支援に係る基本報酬の算定区分に関する届出書）」を提出すること。</div>
                        <div style={{ color: 'red', textDecoration: 'underline' }}>注５　次のいずれか２か年度間の実績で評価すること。</div>
                        <div>　　①令和２年度及び令和３年度（通常）</div>
                        <div>　　②平成30年度及び令和元年度（特例）</div>
                    </div>
                </Box>
                {/* ===== 印刷対象ここまで ===== */}
            </Paper>
        </Container>
    );
}
