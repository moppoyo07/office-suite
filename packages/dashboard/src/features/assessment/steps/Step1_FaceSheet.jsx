// Step1: フェイスシート表（基本情報・通所経路・緊急連絡先・医療機関・支援機関）
import { Box, Typography, TextField, Stack, FormControl, InputLabel, Select, MenuItem, Divider, Button, IconButton } from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import DeleteIcon from '@mui/icons-material/Delete';

const SectionTitle = ({ children }) => (
  <Box sx={{ bgcolor: '#222', color: '#fff', px: 1.5, py: 0.5, mt: 2, mb: 1, fontWeight: 'bold', fontSize: 13 }}>
    {children}
  </Box>
);

const COMMUTE_TYPES = [
  { value: 'bus', label: 'バス' },
  { value: 'train', label: '電車' },
  { value: 'subway', label: '地下鉄・私鉄' },
  { value: 'car', label: '自家用車・バイク' },
  { value: 'walk', label: '徒歩・自転車' },
  { value: 'other', label: 'その他' },
];

export default function Step1_FaceSheet({ data, onChange }) {
  const d = data || {};

  const set = (field, value) => onChange({ ...d, [field]: value });

  // 通所経路
  const routes = d.commuteRoutes || [{}];
  const setRoute = (i, field, value) => {
    const updated = [...routes];
    updated[i] = { ...updated[i], [field]: value };
    set('commuteRoutes', updated);
  };
  const addRoute = () => set('commuteRoutes', [...routes, {}]);
  const removeRoute = (i) => set('commuteRoutes', routes.filter((_, idx) => idx !== i));

  // 緊急連絡先（3件）
  const emergency = d.emergency || [{}, {}, {}];
  const setEmergency = (i, field, value) => {
    const updated = [...emergency];
    updated[i] = { ...updated[i], [field]: value };
    set('emergency', updated);
  };

  // 医療機関（2件）
  const hospitals = d.hospitals || [{}, {}];
  const setHospital = (i, field, value) => {
    const updated = [...hospitals];
    updated[i] = { ...updated[i], [field]: value };
    set('hospitals', updated);
  };

  // 福祉サービス（2件）
  const welfareServices = d.welfareServices || [{}, {}];
  const setWelfare = (i, field, value) => {
    const updated = [...welfareServices];
    updated[i] = { ...updated[i], [field]: value };
    set('welfareServices', updated);
  };

  // 行政窓口（2件）
  const adminOffices = d.adminOffices || [{}, {}];
  const setAdmin = (i, field, value) => {
    const updated = [...adminOffices];
    updated[i] = { ...updated[i], [field]: value };
    set('adminOffices', updated);
  };

  return (
    <Box>
      <Typography variant="h6" fontWeight="bold" gutterBottom>フェイスシート（表）</Typography>

      <SectionTitle>基本情報</SectionTitle>
      <Stack spacing={2}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <TextField label="ふりがな" fullWidth value={d.nameKana || ''} onChange={e => set('nameKana', e.target.value)} />
          <TextField label="生年月日（例: 1990/04/01）" fullWidth value={d.birthDate || ''} onChange={e => set('birthDate', e.target.value)} />
        </Stack>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <TextField label="氏名" fullWidth value={d.name || ''} onChange={e => set('name', e.target.value)} />
          <FormControl fullWidth>
            <InputLabel>性別</InputLabel>
            <Select value={d.gender || ''} label="性別" onChange={e => set('gender', e.target.value)}>
              <MenuItem value="male">男性</MenuItem>
              <MenuItem value="female">女性</MenuItem>
              <MenuItem value="other">その他</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel>血液型</InputLabel>
            <Select value={d.bloodType || ''} label="血液型" onChange={e => set('bloodType', e.target.value)}>
              {['A', 'B', 'O', 'AB'].map(t => <MenuItem key={t} value={t}>{t}型</MenuItem>)}
              <MenuItem value="unknown">不明</MenuItem>
            </Select>
          </FormControl>
        </Stack>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <TextField label="郵便番号" sx={{ width: 160 }} value={d.postalCode || ''} onChange={e => set('postalCode', e.target.value)} />
          <TextField label="住所" fullWidth value={d.address || ''} onChange={e => set('address', e.target.value)} />
        </Stack>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <TextField label="電話番号" fullWidth value={d.phone || ''} onChange={e => set('phone', e.target.value)} />
          <TextField label="携帯電話" fullWidth value={d.mobilePhone || ''} onChange={e => set('mobilePhone', e.target.value)} />
          <TextField label="メールアドレス" fullWidth value={d.email || ''} onChange={e => set('email', e.target.value)} />
        </Stack>
      </Stack>

      <SectionTitle>通所経路</SectionTitle>
      {routes.map((r, i) => (
        <Box key={i} sx={{ border: '1px solid #ddd', borderRadius: 1, p: 1.5, mb: 1 }}>
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
            <FormControl sx={{ minWidth: 140 }}>
              <InputLabel>交通手段</InputLabel>
              <Select value={r.type || ''} label="交通手段" onChange={e => setRoute(i, 'type', e.target.value)}>
                {COMMUTE_TYPES.map(t => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField label="会社・路線名" sx={{ flex: 1, minWidth: 120 }} value={r.company || ''} onChange={e => setRoute(i, 'company', e.target.value)} />
            <TextField label="乗車駅・停留所" sx={{ flex: 1, minWidth: 100 }} value={r.from || ''} onChange={e => setRoute(i, 'from', e.target.value)} />
            <TextField label="降車駅・停留所" sx={{ flex: 1, minWidth: 100 }} value={r.to || ''} onChange={e => setRoute(i, 'to', e.target.value)} />
            <TextField label="片道運賃" type="number" sx={{ width: 100 }} value={r.cost || ''} onChange={e => setRoute(i, 'cost', e.target.value)} />
            <TextField label="割引運賃" type="number" sx={{ width: 100 }} value={r.costDiscounted || ''} onChange={e => setRoute(i, 'costDiscounted', e.target.value)} />
            {routes.length > 1 && (
              <IconButton color="error" onClick={() => removeRoute(i)}><DeleteIcon /></IconButton>
            )}
          </Stack>
        </Box>
      ))}
      <Button startIcon={<AddCircleOutlineIcon />} onClick={addRoute} size="small">経路を追加</Button>

      <SectionTitle>緊急連絡先</SectionTitle>
      {[0, 1, 2].map(i => (
        <Stack key={i} direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 1 }} alignItems="center">
          <Typography variant="body2" sx={{ minWidth: 24, fontWeight: 'bold' }}>{i + 1}</Typography>
          <TextField label="氏名" fullWidth value={emergency[i]?.name || ''} onChange={e => setEmergency(i, 'name', e.target.value)} />
          <TextField label="続柄" sx={{ width: 120 }} value={emergency[i]?.relation || ''} onChange={e => setEmergency(i, 'relation', e.target.value)} />
          <TextField label="電話番号" fullWidth value={emergency[i]?.phone || ''} onChange={e => setEmergency(i, 'phone', e.target.value)} />
        </Stack>
      ))}

      <SectionTitle>かかりつけ医療機関</SectionTitle>
      {[0, 1].map(i => (
        <Box key={i} sx={{ border: '1px solid #ddd', borderRadius: 1, p: 1.5, mb: 1 }}>
          <Typography variant="body2" fontWeight="bold" sx={{ mb: 1 }}>医療機関 {i + 1}</Typography>
          <Stack spacing={1.5}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField label="病院名" fullWidth value={hospitals[i]?.name || ''} onChange={e => setHospital(i, 'name', e.target.value)} />
              <TextField label="所在地（市・区・町）" fullWidth value={hospitals[i]?.location || ''} onChange={e => setHospital(i, 'location', e.target.value)} />
              <TextField label="電話番号" fullWidth value={hospitals[i]?.phone || ''} onChange={e => setHospital(i, 'phone', e.target.value)} />
            </Stack>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField label="受診科目" fullWidth value={hospitals[i]?.dept || ''} onChange={e => setHospital(i, 'dept', e.target.value)} />
              <TextField label="担当医" fullWidth value={hospitals[i]?.doctor || ''} onChange={e => setHospital(i, 'doctor', e.target.value)} />
              <TextField label="通院頻度" fullWidth value={hospitals[i]?.freq || ''} onChange={e => setHospital(i, 'freq', e.target.value)} />
            </Stack>
          </Stack>
        </Box>
      ))}

      <SectionTitle>相談支援事業所</SectionTitle>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        <TextField label="事業所名" fullWidth value={d.supportOffice?.name || ''} onChange={e => set('supportOffice', { ...d.supportOffice, name: e.target.value })} />
        <TextField label="担当者" fullWidth value={d.supportOffice?.person || ''} onChange={e => set('supportOffice', { ...d.supportOffice, person: e.target.value })} />
        <TextField label="電話番号" fullWidth value={d.supportOffice?.phone || ''} onChange={e => set('supportOffice', { ...d.supportOffice, phone: e.target.value })} />
      </Stack>

      <SectionTitle>福祉サービス・登録機関</SectionTitle>
      {[0, 1].map(i => (
        <Stack key={i} direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 1 }} alignItems="center">
          <Typography variant="body2" sx={{ minWidth: 24, fontWeight: 'bold' }}>{i + 1}</Typography>
          <TextField label="事業所名" fullWidth value={welfareServices[i]?.name || ''} onChange={e => setWelfare(i, 'name', e.target.value)} />
          <TextField label="種別" sx={{ width: 120 }} value={welfareServices[i]?.type || ''} onChange={e => setWelfare(i, 'type', e.target.value)} />
          <TextField label="担当" fullWidth value={welfareServices[i]?.person || ''} onChange={e => setWelfare(i, 'person', e.target.value)} />
          <TextField label="電話番号" fullWidth value={welfareServices[i]?.phone || ''} onChange={e => setWelfare(i, 'phone', e.target.value)} />
        </Stack>
      ))}

      <SectionTitle>行政窓口・ハローワーク</SectionTitle>
      {[0, 1].map(i => (
        <Stack key={i} direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 1 }} alignItems="center">
          <Typography variant="body2" sx={{ minWidth: 24, fontWeight: 'bold' }}>{i + 1}</Typography>
          <TextField label="市・区・町" fullWidth value={adminOffices[i]?.city || ''} onChange={e => setAdmin(i, 'city', e.target.value)} />
          <TextField label="課・係" fullWidth value={adminOffices[i]?.section || ''} onChange={e => setAdmin(i, 'section', e.target.value)} />
          <TextField label="担当" fullWidth value={adminOffices[i]?.person || ''} onChange={e => setAdmin(i, 'person', e.target.value)} />
          <TextField label="電話番号" fullWidth value={adminOffices[i]?.phone || ''} onChange={e => setAdmin(i, 'phone', e.target.value)} />
        </Stack>
      ))}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 1 }} alignItems="center">
        <Typography variant="body2" sx={{ minWidth: 80 }}>管轄ハローワーク</Typography>
        <FormControl sx={{ minWidth: 160 }}>
          <InputLabel>登録状況</InputLabel>
          <Select value={d.helloWork?.status || ''} label="登録状況" onChange={e => set('helloWork', { ...d.helloWork, status: e.target.value })}>
            <MenuItem value="registered">登録済</MenuItem>
            <MenuItem value="unregistered">未登録</MenuItem>
          </Select>
        </FormControl>
        <TextField label="担当者" fullWidth value={d.helloWork?.person || ''} onChange={e => set('helloWork', { ...d.helloWork, person: e.target.value })} />
        <TextField label="電話番号" fullWidth value={d.helloWork?.phone || ''} onChange={e => set('helloWork', { ...d.helloWork, phone: e.target.value })} />
      </Stack>
    </Box>
  );
}
