// Excel解析スクリプト - 指定申請書シートを詳細解析
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const filePath = path.join(__dirname, '様式第1号.xlsx');

try {
    const workbook = XLSX.readFile(filePath);

    // 「指定申請書」シートを解析
    const sheetName = '指定申請書';
    const sheet = workbook.Sheets[sheetName];

    if (!sheet) {
        console.log(`シート「${sheetName}」が見つかりません`);
        process.exit(1);
    }

    console.log(`=== シート「${sheetName}」の詳細情報 ===\n`);

    const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1');
    console.log(`範囲: ${sheet['!ref']}`);
    console.log(`行数: ${range.e.r - range.s.r + 1}`);
    console.log(`列数: ${range.e.c - range.s.c + 1}`);

    // 列幅情報
    console.log('\n=== 列幅（ポイント） ===');
    if (sheet['!cols']) {
        sheet['!cols'].forEach((col, idx) => {
            if (col && col.wch) {
                const colLetter = XLSX.utils.encode_col(idx);
                console.log(`${colLetter}: ${col.wch}`);
            }
        });
    }

    // 行高さ情報
    console.log('\n=== 行高さ（ポイント） ===');
    if (sheet['!rows']) {
        sheet['!rows'].forEach((row, idx) => {
            if (row && row.hpt) {
                console.log(`行${idx + 1}: ${row.hpt}pt`);
            }
        });
    }

    // 結合セル情報
    console.log('\n=== 結合セル ===');
    if (sheet['!merges']) {
        sheet['!merges'].forEach((merge) => {
            const start = XLSX.utils.encode_cell({ r: merge.s.r, c: merge.s.c });
            const end = XLSX.utils.encode_cell({ r: merge.e.r, c: merge.e.c });
            console.log(`${start}:${end}`);
        });
    }

    // セル内容を行ごとに出力
    console.log('\n=== セル内容（行ごと） ===');
    for (let r = range.s.r; r <= Math.min(range.e.r, 50); r++) {
        const rowData = [];
        for (let c = range.s.c; c <= range.e.c; c++) {
            const cellRef = XLSX.utils.encode_cell({ r, c });
            const cell = sheet[cellRef];
            if (cell && cell.v) {
                rowData.push(`${XLSX.utils.encode_col(c)}:「${cell.v}」`);
            }
        }
        if (rowData.length > 0) {
            console.log(`行${r + 1}: ${rowData.join(', ')}`);
        }
    }

    // HTMLテーブルとして出力
    console.log('\n=== HTML出力 ===');
    const html = XLSX.utils.sheet_to_html(sheet, { editable: false });
    fs.writeFileSync(path.join(__dirname, 'form-preview.html'), html);
    console.log('form-preview.html を生成しました');

} catch (err) {
    console.error('エラー:', err.message);
}
