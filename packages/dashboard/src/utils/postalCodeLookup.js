// src/utils/postalCodeLookup.js
// 郵便番号から住所を検索するユーティリティ
// zipcloud API（無料・制限なし）を使用

/**
 * 郵便番号から住所情報を取得
 * @param {string} postalCode - 郵便番号（ハイフンあり/なし両対応）
 * @returns {Promise<{prefecture: string, city: string, address1: string} | null>}
 */
export async function lookupPostalCode(postalCode) {
    // ハイフンを除去して7桁に正規化
    const normalized = postalCode.replace(/-/g, '').trim();

    // 7桁でない場合はスキップ
    if (normalized.length !== 7 || !/^\d+$/.test(normalized)) {
        return null;
    }

    try {
        const response = await fetch(
            `https://zipcloud.ibsnet.co.jp/api/search?zipcode=${normalized}`
        );

        if (!response.ok) {
            console.error('郵便番号API エラー:', response.status);
            return null;
        }

        const data = await response.json();

        if (data.status !== 200 || !data.results || data.results.length === 0) {
            console.log('該当する住所が見つかりません:', postalCode);
            return null;
        }

        const result = data.results[0];
        return {
            prefecture: result.address1,  // 都道府県
            city: result.address2,         // 市区町村
            address1: result.address3,     // 町名
        };
    } catch (error) {
        console.error('郵便番号検索エラー:', error);
        return null;
    }
}

/**
 * 郵便番号をフォーマット（XXX-XXXX形式）
 * @param {string} value - 入力値
 * @returns {string} フォーマットされた郵便番号
 */
export function formatPostalCode(value) {
    const digits = value.replace(/\D/g, '').slice(0, 7);
    if (digits.length > 3) {
        return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    }
    return digits;
}
