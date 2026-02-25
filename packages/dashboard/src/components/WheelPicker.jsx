// src/components/WheelPicker.jsx
// ホイールピッカーコンポーネント（iOSの時間選択のような縦スクロール方式）

import { useRef, useEffect, useState } from 'react';
import { Box, Typography } from '@mui/material';

const ITEM_HEIGHT = 40; // 各項目の高さ
const VISIBLE_ITEMS = 5; // 表示する項目数

export default function WheelPicker({
    options = [],
    value,
    onChange,
    suffix = '',
    highlightColor = '#06b6d4',
}) {
    const containerRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);

    // 選択中のインデックスを計算
    const selectedIndex = options.findIndex(opt => opt === value);

    // スクロール位置を値に基づいて設定
    useEffect(() => {
        if (containerRef.current && selectedIndex >= 0 && !isDragging) {
            const scrollTop = selectedIndex * ITEM_HEIGHT;
            containerRef.current.scrollTop = scrollTop;
        }
    }, [selectedIndex, isDragging]);

    // スクロール終了時に最も近い項目にスナップ
    const handleScroll = () => {
        if (!containerRef.current) return;

        const scrollTop = containerRef.current.scrollTop;
        const index = Math.round(scrollTop / ITEM_HEIGHT);
        const clampedIndex = Math.max(0, Math.min(index, options.length - 1));

        if (options[clampedIndex] !== value) {
            onChange(options[clampedIndex]);
        }
    };

    // スクロール終了を検知してスナップ
    const handleScrollEnd = () => {
        if (!containerRef.current) return;

        const scrollTop = containerRef.current.scrollTop;
        const index = Math.round(scrollTop / ITEM_HEIGHT);
        const clampedIndex = Math.max(0, Math.min(index, options.length - 1));

        // スムーズにスナップ
        containerRef.current.scrollTo({
            top: clampedIndex * ITEM_HEIGHT,
            behavior: 'smooth'
        });

        if (options[clampedIndex] !== value) {
            onChange(options[clampedIndex]);
        }
        setIsDragging(false);
    };

    // デバウンスされたスクロール終了検知
    let scrollTimeout;
    const onScroll = () => {
        setIsDragging(true);
        handleScroll();
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(handleScrollEnd, 100);
    };

    // 項目クリックで選択
    const handleItemClick = (option, index) => {
        onChange(option);
        if (containerRef.current) {
            containerRef.current.scrollTo({
                top: index * ITEM_HEIGHT,
                behavior: 'smooth'
            });
        }
    };

    return (
        <Box
            sx={{
                position: 'relative',
                height: ITEM_HEIGHT * VISIBLE_ITEMS,
                overflow: 'hidden',
            }}
        >
            {/* 選択中ハイライト */}
            <Box
                sx={{
                    position: 'absolute',
                    top: '50%',
                    left: 0,
                    right: 0,
                    height: ITEM_HEIGHT,
                    transform: 'translateY(-50%)',
                    bgcolor: `${highlightColor}20`,
                    borderTop: `2px solid ${highlightColor}`,
                    borderBottom: `2px solid ${highlightColor}`,
                    pointerEvents: 'none',
                    zIndex: 1,
                }}
            />

            {/* グラデーションオーバーレイ（上下フェード） */}
            <Box
                sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: ITEM_HEIGHT * 2,
                    background: 'linear-gradient(to bottom, rgba(30,41,59,1) 0%, rgba(30,41,59,0) 100%)',
                    pointerEvents: 'none',
                    zIndex: 2,
                }}
            />
            <Box
                sx={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: ITEM_HEIGHT * 2,
                    background: 'linear-gradient(to top, rgba(30,41,59,1) 0%, rgba(30,41,59,0) 100%)',
                    pointerEvents: 'none',
                    zIndex: 2,
                }}
            />

            {/* スクロールコンテナ */}
            <Box
                ref={containerRef}
                onScroll={onScroll}
                sx={{
                    height: '100%',
                    overflowY: 'auto',
                    scrollSnapType: 'y mandatory',
                    '&::-webkit-scrollbar': { display: 'none' },
                    scrollbarWidth: 'none',
                    // 上下のパディングで中央に配置
                    pt: `${ITEM_HEIGHT * Math.floor(VISIBLE_ITEMS / 2)}px`,
                    pb: `${ITEM_HEIGHT * Math.floor(VISIBLE_ITEMS / 2)}px`,
                }}
            >
                {options.map((option, index) => {
                    const isSelected = option === value;
                    const isHighTemp = parseFloat(option) >= 37.5;

                    return (
                        <Box
                            key={option}
                            onClick={() => handleItemClick(option, index)}
                            sx={{
                                height: ITEM_HEIGHT,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                scrollSnapAlign: 'center',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                            }}
                        >
                            <Typography
                                sx={{
                                    fontSize: isSelected ? '1.5rem' : '1rem',
                                    fontWeight: isSelected ? 'bold' : 'normal',
                                    color: isHighTemp
                                        ? '#ef4444'
                                        : isSelected
                                            ? highlightColor
                                            : '#64748b',
                                    transition: 'all 0.2s',
                                }}
                            >
                                {option}{suffix}
                            </Typography>
                        </Box>
                    );
                })}
            </Box>
        </Box>
    );
}
