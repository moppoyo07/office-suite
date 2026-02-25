// src/pages/forms/ApplicationForm1Page.jsx
// 様式第1号（指定申請書）- 修正版

import React, { useState, useEffect } from 'react';
import { Box, Button, Select, MenuItem, FormControl } from '@mui/material';
import PrintIcon from '@mui/icons-material/Print';
import SaveIcon from '@mui/icons-material/Save';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/index';

// 印刷用CSS
const printStyles = `
  @media print {
    body * { visibility: hidden; }
    #printable-form, #printable-form * { visibility: visible; }
    #printable-form { 
      position: absolute; 
      left: 0; 
      top: 0; 
      width: 210mm;
      font-size: 9px;
    }
    .no-print { display: none !important; }
  }
`;

// タイトル選択肢
const TITLE_OPTIONS = [
    '指定障害福祉サービス事業所／指定障害者支援施設',
    '指定障害児通所支援事業所／指定障害児入所施設',
    '指定特定相談支援事業所／指定一般相談支援事業所／指定障害児相談支援事業所',
];

// 共通スタイル - ゴシック体、小さめフォント
const styles = {
    container: {
        width: '210mm',
        minHeight: '297mm',
        padding: '8mm',
        margin: '0 auto',
        backgroundColor: 'white',
        color: 'black',
        fontFamily: '"MS ゴシック", "Hiragino Kaku Gothic", sans-serif',
        fontSize: '9px',
        lineHeight: '1.3',
    },
    table: {
        width: '100%',
        borderCollapse: 'collapse',
        tableLayout: 'fixed',
    },
    cell: {
        border: '1px solid black',
        padding: '2px 3px',
        verticalAlign: 'middle',
        fontSize: '9px',
    },
    headerCell: {
        border: '1px solid black',
        padding: '2px 3px',
        backgroundColor: '#f5f5f5',
        verticalAlign: 'middle',
        fontSize: '9px',
        fontWeight: 'normal',
    },
    input: {
        width: '100%',
        border: 'none',
        backgroundColor: 'transparent',
        fontSize: '9px',
        padding: '0',
        fontFamily: 'inherit',
        outline: 'none',
    },
    boxInput: {
        border: '1px solid black',
        padding: '3px 5px',
        fontSize: '9px',
        fontFamily: 'inherit',
    },
};

export default function ApplicationForm1Page() {
    const [form, setForm] = useState({
        // タイトル選択
        title_type: TITLE_OPTIONS[0],
        // 日付
        year: '',
        month: '',
        day: '',
        // 申請者情報（右上）
        applicant_address1: '',
        applicant_address2: '',
        applicant_name: '',
        applicant_rep: '',
        // 法人番号
        corp_num: '',
        // 申請者詳細
        applicant_furigana: '',
        applicant_name_full: '',
        applicant_zip1: '',
        applicant_zip2: '',
        applicant_address_full: '',
        applicant_tel: '',
        applicant_ext: '',
        applicant_email: '',
        corporation_type: '',
        rep_title: '',
        rep_furigana: '',
        rep_name: '',
        rep_birth_year: '',
        rep_birth_month: '',
        rep_birth_day: '',
        rep_zip1: '',
        rep_zip2: '',
        rep_address: '',
        // 事業所情報
        office_furigana: '',
        office_name: '',
        office_zip1: '',
        office_zip2: '',
        office_ward: '',
        office_address: '',
        is_multifunc: '',
        // 事業所番号
        office_num: '',
    });

    const [saving, setSaving] = useState(false);

    const handleChange = (field) => (e) => {
        setForm(prev => ({ ...prev, [field]: e.target.value }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await setDoc(doc(db, 'applicationForms', 'form1-default'), {
                ...form,
                formType: 'form1',
                updatedAt: serverTimestamp(),
            }, { merge: true });
            alert('保存しました');
        } catch (err) {
            console.error('保存エラー:', err);
        } finally {
            setSaving(false);
        }
    };

    useEffect(() => {
        const loadData = async () => {
            try {
                const docSnap = await getDoc(doc(db, 'applicationForms', 'form1-default'));
                if (docSnap.exists()) {
                    setForm(prev => ({ ...prev, ...docSnap.data() }));
                }
            } catch (err) {
                console.error('読み込みエラー:', err);
            }
        };
        loadData();
    }, []);

    const handlePrint = () => window.print();

    return (
        <Box sx={{ p: 2, bgcolor: '#e0e0e0', minHeight: '100vh' }}>
            <style>{printStyles}</style>

            {/* ツールバー */}
            <Box className="no-print" sx={{ mb: 2, display: 'flex', gap: 2, justifyContent: 'center' }}>
                <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSave} disabled={saving}>
                    保存
                </Button>
                <Button variant="outlined" startIcon={<PrintIcon />} onClick={handlePrint}>
                    印刷
                </Button>
            </Box>

            {/* フォーム本体 */}
            <div id="printable-form" style={styles.container}>
                {/* ヘッダー */}
                <div style={{ marginBottom: '8px' }}>別紙様式第一号</div>

                {/* タイトル（ドロップダウン） */}
                <div style={{ textAlign: 'center', marginBottom: '3px' }}>
                    <FormControl size="small" className="no-print">
                        <Select
                            value={form.title_type}
                            onChange={handleChange('title_type')}
                            sx={{ fontSize: '10px', minWidth: '400px' }}
                        >
                            {TITLE_OPTIONS.map((opt, i) => (
                                <MenuItem key={i} value={opt} sx={{ fontSize: '10px' }}>{opt}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <div className="print-only" style={{ fontSize: '10px' }}>{form.title_type}</div>
                </div>

                <div style={{ textAlign: 'center', marginBottom: '12px', fontSize: '12px', fontWeight: 'bold' }}>
                    申請書
                </div>

                {/* 日付・宛名・申請者（右上） */}
                <table style={{ ...styles.table, marginBottom: '8px' }}>
                    <tbody>
                        <tr>
                            <td style={{ width: '30%', border: 'none', verticalAlign: 'top' }}>
                                広島市長　殿
                            </td>
                            <td style={{ width: '40%', border: 'none' }}></td>
                            <td style={{ width: '30%', border: 'none', textAlign: 'right' }}>
                                令和
                                <input type="text" value={form.year} onChange={handleChange('year')} style={{ ...styles.boxInput, width: '25px', margin: '0 2px' }} />
                                年
                                <input type="text" value={form.month} onChange={handleChange('month')} style={{ ...styles.boxInput, width: '20px', margin: '0 2px' }} />
                                月
                                <input type="text" value={form.day} onChange={handleChange('day')} style={{ ...styles.boxInput, width: '20px', margin: '0 2px' }} />
                                日
                            </td>
                        </tr>
                    </tbody>
                </table>

                {/* 申請者欄（右寄せ、下線なし） */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '10px' }}>
                    <table style={{ width: '60%', borderCollapse: 'collapse' }}>
                        <tbody>
                            <tr>
                                <td style={{ width: '60px', padding: '2px', border: 'none', verticalAlign: 'top' }}>所在地</td>
                                <td style={{ padding: '2px', border: 'none' }}>
                                    <input type="text" value={form.applicant_address1} onChange={handleChange('applicant_address1')} style={{ ...styles.input, marginBottom: '2px' }} /><br />
                                    <input type="text" value={form.applicant_address2} onChange={handleChange('applicant_address2')} style={styles.input} />
                                </td>
                            </tr>
                            <tr>
                                <td style={{ padding: '2px', border: 'none' }}>申請者</td>
                                <td style={{ padding: '2px', border: 'none' }}>
                                    <span style={{ fontSize: '8px' }}>名　称</span>
                                    <input type="text" value={form.applicant_name} onChange={handleChange('applicant_name')} style={styles.input} />
                                </td>
                            </tr>
                            <tr>
                                <td style={{ padding: '2px', border: 'none' }}></td>
                                <td style={{ padding: '2px', border: 'none' }}>
                                    <span style={{ fontSize: '8px' }}>代表者</span>
                                    <input type="text" value={form.applicant_rep} onChange={handleChange('applicant_rep')} style={styles.input} />
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* 説明文 */}
                <div style={{ marginBottom: '8px', fontSize: '9px' }}>
                    表題の事業所・施設に係る指定／指定の更新／指定の変更を受けたいので、下記のとおり、関係書類を添えて申請します。
                </div>

                {/* 法人番号 - 通常の長方形入力欄 */}
                <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center' }}>
                    <span style={{ marginRight: '10px' }}>法人番号（13桁）</span>
                    <input
                        type="text"
                        value={form.corp_num}
                        onChange={handleChange('corp_num')}
                        maxLength="13"
                        style={{ ...styles.boxInput, width: '150px', letterSpacing: '2px' }}
                    />
                </div>

                {/* メインテーブル - 申請者情報 */}
                <table style={styles.table}>
                    <tbody>
                        <tr>
                            <td rowSpan="7" style={{ ...styles.headerCell, width: '20px', writingMode: 'vertical-rl', textAlign: 'center' }}>
                                申請者（設置者）
                            </td>
                            <td style={{ ...styles.headerCell, width: '90px' }}>フリガナ</td>
                            <td colSpan="5" style={styles.cell}>
                                <input type="text" value={form.applicant_furigana} onChange={handleChange('applicant_furigana')} style={styles.input} />
                            </td>
                        </tr>
                        <tr>
                            <td style={styles.headerCell}>名称</td>
                            <td colSpan="5" style={styles.cell}>
                                <input type="text" value={form.applicant_name_full} onChange={handleChange('applicant_name_full')} style={styles.input} />
                            </td>
                        </tr>
                        <tr>
                            <td style={styles.headerCell}>主たる事務所の所在地</td>
                            <td colSpan="5" style={styles.cell}>
                                （郵便番号
                                <input type="text" value={form.applicant_zip1} onChange={handleChange('applicant_zip1')} style={{ ...styles.boxInput, width: '35px' }} />
                                -
                                <input type="text" value={form.applicant_zip2} onChange={handleChange('applicant_zip2')} style={{ ...styles.boxInput, width: '45px' }} />
                                ）<br />
                                <input type="text" value={form.applicant_address_full} onChange={handleChange('applicant_address_full')} style={styles.input} />
                            </td>
                        </tr>
                        <tr>
                            <td style={styles.headerCell}>連絡先</td>
                            <td style={{ ...styles.cell, width: '50px' }}>電話番号</td>
                            <td style={styles.cell}>
                                <input type="text" value={form.applicant_tel} onChange={handleChange('applicant_tel')} style={styles.input} />
                            </td>
                            <td style={{ ...styles.cell, width: '40px' }}>（内線）</td>
                            <td colSpan="2" style={styles.cell}>
                                <input type="text" value={form.applicant_ext} onChange={handleChange('applicant_ext')} style={styles.input} />
                            </td>
                        </tr>
                        <tr>
                            <td style={styles.headerCell}></td>
                            <td style={styles.cell}>E-mail</td>
                            <td colSpan="4" style={styles.cell}>
                                <input type="text" value={form.applicant_email} onChange={handleChange('applicant_email')} style={styles.input} />
                            </td>
                        </tr>
                        <tr>
                            <td style={styles.headerCell}>法人等の種類</td>
                            <td colSpan="2" style={styles.cell}>
                                <input type="text" value={form.corporation_type} onChange={handleChange('corporation_type')} style={styles.input} />
                            </td>
                            <td colSpan="3" style={{ ...styles.cell, fontSize: '8px', color: '#666' }}>※備考2を参照</td>
                        </tr>
                        <tr>
                            <td style={styles.headerCell}>
                                代表者の職名・<br />氏名・生年月日
                            </td>
                            <td style={{ ...styles.cell, width: '40px' }}>職名</td>
                            <td style={styles.cell}>
                                <input type="text" value={form.rep_title} onChange={handleChange('rep_title')} style={styles.input} />
                            </td>
                            <td style={styles.cell}>
                                <span style={{ fontSize: '7px' }}>フリガナ</span><br />
                                <input type="text" value={form.rep_furigana} onChange={handleChange('rep_furigana')} style={{ ...styles.input, fontSize: '8px' }} />
                                <span style={{ fontSize: '7px' }}>氏名</span><br />
                                <input type="text" value={form.rep_name} onChange={handleChange('rep_name')} style={styles.input} />
                            </td>
                            <td style={{ ...styles.cell, width: '40px', fontSize: '8px' }}>
                                生年<br />月日
                            </td>
                            <td style={styles.cell}>
                                <input type="text" value={form.rep_birth_year} onChange={handleChange('rep_birth_year')} style={{ ...styles.boxInput, width: '25px' }} />年<br />
                                <input type="text" value={form.rep_birth_month} onChange={handleChange('rep_birth_month')} style={{ ...styles.boxInput, width: '20px' }} />月
                                <input type="text" value={form.rep_birth_day} onChange={handleChange('rep_birth_day')} style={{ ...styles.boxInput, width: '20px' }} />日
                            </td>
                        </tr>
                    </tbody>
                </table>

                {/* 代表者住所 */}
                <table style={{ ...styles.table, marginTop: '-1px' }}>
                    <tbody>
                        <tr>
                            <td style={{ ...styles.headerCell, width: '20px' }}></td>
                            <td style={{ ...styles.headerCell, width: '90px' }}>代表者の住所</td>
                            <td style={styles.cell}>
                                （郵便番号
                                <input type="text" value={form.rep_zip1} onChange={handleChange('rep_zip1')} style={{ ...styles.boxInput, width: '35px' }} />
                                -
                                <input type="text" value={form.rep_zip2} onChange={handleChange('rep_zip2')} style={{ ...styles.boxInput, width: '45px' }} />
                                ）<br />
                                <input type="text" value={form.rep_address} onChange={handleChange('rep_address')} style={styles.input} />
                            </td>
                        </tr>
                    </tbody>
                </table>

                {/* 事業所情報テーブル */}
                <table style={{ ...styles.table, marginTop: '-1px' }}>
                    <tbody>
                        <tr>
                            <td rowSpan="4" style={{ ...styles.headerCell, width: '20px', writingMode: 'vertical-rl', textAlign: 'center', fontSize: '7px' }}>
                                指定を受けようとする事業所・施設
                            </td>
                            <td style={{ ...styles.headerCell, width: '90px' }}>フリガナ</td>
                            <td colSpan="5" style={styles.cell}>
                                <input type="text" value={form.office_furigana} onChange={handleChange('office_furigana')} style={styles.input} />
                            </td>
                        </tr>
                        <tr>
                            <td style={styles.headerCell}>名称</td>
                            <td colSpan="5" style={styles.cell}>
                                <input type="text" value={form.office_name} onChange={handleChange('office_name')} style={styles.input} />
                            </td>
                        </tr>
                        <tr>
                            <td style={styles.headerCell}>事業所（施設）の所在地</td>
                            <td colSpan="5" style={styles.cell}>
                                （郵便番号
                                <input type="text" value={form.office_zip1} onChange={handleChange('office_zip1')} style={{ ...styles.boxInput, width: '35px' }} />
                                -
                                <input type="text" value={form.office_zip2} onChange={handleChange('office_zip2')} style={{ ...styles.boxInput, width: '45px' }} />
                                ）<br />
                                広島県　広島市
                                <input type="text" value={form.office_ward} onChange={handleChange('office_ward')} style={{ ...styles.boxInput, width: '40px' }} />
                                区
                                <input type="text" value={form.office_address} onChange={handleChange('office_address')} style={{ ...styles.input, display: 'inline', width: '250px' }} />
                            </td>
                        </tr>
                        <tr>
                            <td colSpan="6" style={styles.cell}>
                                多機能型事業所に係る指定の申請の場合は○ （
                                <input type="text" value={form.is_multifunc} onChange={handleChange('is_multifunc')} style={{ ...styles.boxInput, width: '25px', textAlign: 'center' }} />
                                ）
                            </td>
                        </tr>
                    </tbody>
                </table>

                {/* 事業の種類マトリクス */}
                <table style={{ ...styles.table, marginTop: '-1px', fontSize: '8px' }}>
                    <thead>
                        <tr>
                            <th colSpan="2" rowSpan="2" style={{ ...styles.headerCell, width: '180px' }}>
                                同一所在地において<br />行う事業等の種類
                            </th>
                            <th rowSpan="2" style={{ ...styles.headerCell, width: '50px', fontSize: '7px' }}>
                                共生型サービス<br />の指定を申請<br />するものに○
                            </th>
                            <th rowSpan="2" style={{ ...styles.headerCell, width: '60px', fontSize: '7px' }}>
                                今回の指定<br />(更新・変更)<br />申請をする対象<br />事業等に○
                            </th>
                            <th rowSpan="2" style={{ ...styles.headerCell, width: '50px', fontSize: '7px' }}>
                                既に指定を<br />受けている<br />事業に○
                            </th>
                            <th rowSpan="2" style={{ ...styles.headerCell, width: '80px', fontSize: '7px' }}>
                                事業の開始<br />予定年月日
                            </th>
                            <th rowSpan="2" style={{ ...styles.headerCell, fontSize: '7px' }}>付表</th>
                        </tr>
                    </thead>
                    <tbody>
                        {[
                            {
                                cat: '指定障害福祉サービス事業所', items: [
                                    { name: '居宅介護', appendix: '付表１' },
                                    { name: '重度訪問介護', appendix: '付表１' },
                                    { name: '同行援護', appendix: '付表１' },
                                    { name: '行動援護', appendix: '付表１' },
                                    { name: '療養介護', appendix: '付表２' },
                                    { name: '生活介護', appendix: '付表３' },
                                    { name: '短期入所', appendix: '付表４' },
                                    { name: '重度障害者等包括支援', appendix: '付表５' },
                                    { name: '自立訓練(機能訓練)', appendix: '付表６' },
                                    { name: '自立訓練(生活訓練)', appendix: '付表６' },
                                    { name: '就労選択支援', appendix: '付表７' },
                                    { name: '就労移行支援', appendix: '付表８', highlight: true },
                                    { name: '就労継続支援Ａ型', appendix: '付表９' },
                                    { name: '就労継続支援Ｂ型', appendix: '付表１０' },
                                    { name: '就労定着支援', appendix: '付表１０' },
                                    { name: '自立生活援助', appendix: '付表１１' },
                                    { name: '共同生活援助', appendix: '付表１２' },
                                ]
                            },
                            {
                                cat: '指定障害者支援施設', items: [
                                    { name: '施設入所支援', appendix: '付表１３' },
                                ]
                            },
                            {
                                cat: '指定一般相談支援事業所', items: [
                                    { name: '地域移行支援', appendix: '付表１４' },
                                    { name: '地域定着支援', appendix: '付表１４' },
                                ]
                            },
                            {
                                cat: '指定特定相談支援事業所', items: [
                                    { name: '', appendix: '付表１５' },
                                ]
                            },
                        ].map((category, catIdx) => (
                            category.items.map((service, idx) => (
                                <tr key={`${catIdx}-${idx}`} style={service.highlight ? { backgroundColor: '#ffffcc' } : {}}>
                                    {idx === 0 && (
                                        <td rowSpan={category.items.length} style={{ ...styles.headerCell, writingMode: 'vertical-rl', textAlign: 'center', fontSize: '7px' }}>
                                            {category.cat}
                                        </td>
                                    )}
                                    <td style={styles.cell}>{service.name}</td>
                                    <td style={{ ...styles.cell, textAlign: 'center' }}>（　）</td>
                                    <td style={{ ...styles.cell, textAlign: 'center' }}>（　）</td>
                                    <td style={{ ...styles.cell, textAlign: 'center' }}>（　）</td>
                                    <td style={styles.cell}>　年　月　日</td>
                                    <td style={styles.cell}>{service.appendix}</td>
                                </tr>
                            ))
                        ))}
                    </tbody>
                </table>

                {/* 事業所番号 - 通常の長方形入力欄 */}
                <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center' }}>
                    <span style={{ marginRight: '10px' }}>【既に指定を受けている場合】事業所番号</span>
                    <input
                        type="text"
                        value={form.office_num}
                        onChange={handleChange('office_num')}
                        maxLength="10"
                        style={{ ...styles.boxInput, width: '120px', letterSpacing: '2px' }}
                    />
                </div>

                {/* 備考 */}
                <div style={{ marginTop: '12px', fontSize: '8px' }}>
                    （備考）<br />
                    1　本申請書の表題は、指定の更新の申請の際には「指定更新申請書」に、指定の変更の申請の際には「指定変更申請書」に変更して使用してください。<br />
                    2　「法人等の種類」欄には、「社会福祉法人」、「医療法人」、「営利法人」、「非営利法人(ＮＰＯ)」等のいずれかを記入してください。<br />
                    3　「同一所在地において行う事業等の種類」欄には、今回申請をする事業及び既に指定を受けている事業のそれぞれに「○」を記載してください。
                </div>
            </div>
        </Box>
    );
}
