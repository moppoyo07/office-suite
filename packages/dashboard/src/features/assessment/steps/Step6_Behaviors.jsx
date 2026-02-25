// Step6: 行動について（パニック・こだわり・強迫・幻覚・発作・その他）
import { Box, Typography, TextField, Stack, FormControl, InputLabel, Select, MenuItem, Checkbox, FormControlLabel, FormGroup, Divider } from '@mui/material';

const SectionTitle = ({ children }) => (
  <Box sx={{ bgcolor: '#222', color: '#fff', px: 1.5, py: 0.5, mt: 2, mb: 1, fontWeight: 'bold', fontSize: 13 }}>
    {children}
  </Box>
);

const BEHAVIOR_ITEMS = [
  { key: 'panic',        label: 'パニック' },
  { key: 'obsession',    label: 'こだわり' },
  { key: 'compulsion',   label: '強迫行為・強迫観念' },
  { key: 'hallucination',label: '幻覚・妄想' },
  { key: 'seizure',      label: '発作' },
  { key: 'other',        label: 'その他' },
];

const STATUS_OPTIONS = [
  { value: 'none',    label: '特にない' },
  { value: 'yes',     label: 'ある' },
  { value: 'unknown', label: 'わからない' },
];

const COPING_OPTIONS = [
  { value: 'self',   label: '自分の対処法がある' },
  { value: 'others', label: '周りの対処法がある' },
  { value: 'none',   label: '対処方法がない' },
];

function BehaviorItem({ label, value = {}, onChange }) {
  const set = (field, val) => onChange({ ...value, [field]: val });

  const toggleCoping = (val) => {
    const current = value.coping || [];
    const updated = current.includes(val) ? current.filter(v => v !== val) : [...current, val];
    set('coping', updated);
  };

  return (
    <Box sx={{ border: '1px solid #e0e0e0', borderRadius: 1, p: 2, mb: 2 }}>
      <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1.5 }}>{label}</Typography>
      <Stack spacing={2}>
        <FormControl fullWidth>
          <InputLabel>状態</InputLabel>
          <Select value={value.status || ''} label="状態" onChange={e => set('status', e.target.value)}>
            {STATUS_OPTIONS.map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
          </Select>
        </FormControl>
        {value.status === 'yes' && (
          <>
            <Box>
              <Typography variant="body2" sx={{ mb: 0.5 }}>対処法（複数選択可）</Typography>
              <FormGroup row>
                {COPING_OPTIONS.map(o => (
                  <FormControlLabel key={o.value} control={<Checkbox checked={(value.coping || []).includes(o.value)} onChange={() => toggleCoping(o.value)} />} label={o.label} />
                ))}
              </FormGroup>
            </Box>
            <TextField label="本人コメント（本人の言葉で）" fullWidth multiline rows={2} value={value.selfComment || ''} onChange={e => set('selfComment', e.target.value)} />
          </>
        )}
        <TextField label="支援者追記" fullWidth multiline rows={2} value={value.staffNote || ''} onChange={e => set('staffNote', e.target.value)} />
      </Stack>
    </Box>
  );
}

export default function Step6_Behaviors({ data, onChange }) {
  const d = data || {};
  const set = (field, value) => onChange({ ...d, [field]: value });

  return (
    <Box>
      <Typography variant="h6" fontWeight="bold" gutterBottom>行動について</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        各項目について、本人の状況を確認しながら記入してください。
      </Typography>

      <SectionTitle>行動面の各項目</SectionTitle>
      {BEHAVIOR_ITEMS.map(({ key, label }) => (
        <BehaviorItem
          key={key}
          label={label}
          value={d[key] || {}}
          onChange={val => set(key, val)}
        />
      ))}

      <SectionTitle>特記事項</SectionTitle>
      <TextField
        label="その他、具体的な行動について記入してください"
        fullWidth
        multiline
        rows={4}
        value={d.behaviorNotes || ''}
        onChange={e => set('behaviorNotes', e.target.value)}
      />
    </Box>
  );
}
