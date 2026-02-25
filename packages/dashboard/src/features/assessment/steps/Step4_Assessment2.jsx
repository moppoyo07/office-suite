// Step4: アセスメントシート2（意向・好み・自由記述7項目）
import { Box, Typography, TextField, Stack } from '@mui/material';

const SectionTitle = ({ children }) => (
  <Box sx={{ bgcolor: '#222', color: '#fff', px: 1.5, py: 0.5, mt: 2, mb: 1, fontWeight: 'bold', fontSize: 13 }}>
    {children}
  </Box>
);

const FIELDS = [
  { key: 'likes',              label: '好きなこと（もの）・得意なこと' },
  { key: 'dislikes',           label: '嫌いなこと（もの）・苦手なこと' },
  { key: 'desiredLifestyle',   label: '希望する暮らし' },
  { key: 'supportRequests',    label: '特に支援してほしいこと' },
  { key: 'supportPrecautions', label: '支援をするとき、気をつけてほしいこと' },
  { key: 'futureDreams',       label: '将来の夢や希望' },
  { key: 'other',              label: 'その他' },
];

export default function Step4_Assessment2({ data, onChange }) {
  const d = data || {};
  const set = (field, value) => onChange({ ...d, [field]: value });

  return (
    <Box>
      <Typography variant="h6" fontWeight="bold" gutterBottom>アセスメントシート２（本人の意向・好み）</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        ご本人の声をそのまま記入してください。支援員が聞き取りながら記入します。
      </Typography>

      <SectionTitle>本人のご意向</SectionTitle>
      <Stack spacing={3}>
        {FIELDS.map(({ key, label }) => (
          <TextField
            key={key}
            label={label}
            fullWidth
            multiline
            rows={4}
            value={d[key] || ''}
            onChange={e => set(key, e.target.value)}
            placeholder="ご本人の言葉で記入してください"
          />
        ))}
      </Stack>
    </Box>
  );
}
