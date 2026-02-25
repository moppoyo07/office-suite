// src/features/clients/CardTestPage.jsx (検証用)

import { Typography, Box, IconButton, Stack } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CloseIcon from '@mui/icons-material/Close';
import PhoneIcon from '@mui/icons-material/Phone';

// テスト用のダミーデータ
const testClient = {
  name: "山田 太郎",
  inquiryDate: "問合せ: 2025/10/01",
};

function CardInnerContent() {
  return (
    // ★★★ あなたの言う「１BOX」です ★★★
    // このBoxのスタイルを色々変えて、中の挙動を見てみましょう
    <Box sx={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      p: 1.5,
      border: '1px solid red', // ★ 境界線がわかりやすいように赤枠をつける
      width: '100%', // まずは画面幅いっぱいで試す
    }}>

      {/* --- 左側：情報エリア --- */}
      <Box sx={{ minWidth: 0, mr: 1.5 }}>
        <Typography variant="subtitle1" noWrap sx={{ fontWeight: 'bold' }}>
          {testClient.name}
        </Typography>
        <Typography variant="body2" color="text.secondary" noWrap>
          {testClient.inquiryDate}
        </Typography>
      </Box>

      {/* --- 右側：ボタンエリア --- */}
      <Stack spacing={0} sx={{ flexShrink: 0 }}>
        {/* 上段 */}
        <Stack direction="row" spacing={0.5}>
          <IconButton size="small" color="primary"><PhoneIcon fontSize="inherit" /></IconButton>
          <IconButton size="small" color="error"><CloseIcon fontSize="inherit" /></IconButton>
        </Stack>
        {/* 下段 */}
        <Stack direction="row" spacing={0.5}>
          <IconButton size="small"><ArrowBackIcon fontSize="inherit" /></IconButton>
          <IconButton size="small"><ArrowForwardIcon fontSize="inherit" /></IconButton>
        </Stack>
      </Stack>

    </Box>
  );
}


// このページコンポーネントが、上記の中身を色々な幅で表示テストします
function CardTestPage() {
  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h5" gutterBottom>幅のテスト</Typography>

      <Typography sx={{ mt: 4 }}>カンバンカラム幅 (約200px)</Typography>
      <Box sx={{ width: '200px' }}>
        <CardInnerContent />
      </Box>
      
      <Typography sx={{ mt: 4 }}>カンバンカラム幅 (約250px)</Typography>
      <Box sx={{ width: '250px' }}>
        <CardInnerContent />
      </Box>

      <Typography sx={{ mt: 4 }}>グリッド幅 (約240px)</Typography>
      <Box sx={{ width: '240px' }}>
        <CardInnerContent />
      </Box>

      <Typography sx={{ mt: 4 }}>リスト表示幅 (約260px)</Typography>
      <Box sx={{ width: '260px' }}>
        <CardInnerContent />
      </Box>

      <Typography sx={{ mt: 4 }}>画面全体幅 (100%)</Typography>
      <Box sx={{ width: '100%' }}>
        <CardInnerContent />
      </Box>
    </Box>
  );
}

export default CardTestPage;