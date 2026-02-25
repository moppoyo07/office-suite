// Step5: アセスメントシート（精神）通院・体調サイン・服薬
import { Box, Typography, TextField, Stack, FormControl, InputLabel, Select, MenuItem, Checkbox, FormControlLabel, FormGroup } from '@mui/material';

const SectionTitle = ({ children }) => (
  <Box sx={{ bgcolor: '#222', color: '#fff', px: 1.5, py: 0.5, mt: 2, mb: 1, fontWeight: 'bold', fontSize: 13 }}>
    {children}
  </Box>
);

const SelectField = ({ label, value, options, onChange }) => (
  <FormControl fullWidth>
    <InputLabel>{label}</InputLabel>
    <Select value={value || ''} label={label} onChange={e => onChange(e.target.value)}>
      {options.map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
    </Select>
  </FormControl>
);

const BAD_SIGNALS = [
  '眠れない', '食欲がない', '気持ちが沈む', '口数の増加',
  '疲れやすい', '意欲・行動が多い', 'イライラする',
  '周りと過ごすのが難しくなる', '口数が少なくなる', '他の人といたくなくなる', 'その他',
];

const TRIGGER_OPTIONS = ['環境の変化', '疲れ', '季節・天候', 'その他', 'わからない'];

const COPING_METHODS = [
  '直す', '通院する', '休息をとる', '診察を受ける・薬を休める',
  '横になる', '自己管理', '家族に連絡', 'その他', 'わからない',
];

const MEDICATION_TIMING = ['朝', '昼', '夜', '就寝前', '頓服'];

export default function Step5_Mental({ data, onChange }) {
  const d = data || {};
  const set = (field, value) => onChange({ ...d, [field]: value });

  const toggleArr = (fieldObj, key, val) => {
    const current = fieldObj[key] || [];
    const updated = current.includes(val) ? current.filter(v => v !== val) : [...current, val];
    return { ...fieldObj, [key]: updated };
  };

  const disabilityStatus = d.disabilityStatus || {};
  const treatmentStatus = d.treatmentStatus || {};
  const hospitalStatus = d.hospitalStatus || {};
  const condition = d.condition || {};
  const badSignals = d.badSignals || {};
  const copingMethods = d.copingMethods || {};
  const consultation = d.consultation || {};
  const medication = d.medication || {};

  return (
    <Box>
      <Typography variant="h6" fontWeight="bold" gutterBottom>アセスメントシート（精神）</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        ※支援者がヒアリングしながら記載します
      </Typography>

      <SectionTitle>障害の状況</SectionTitle>
      <Stack spacing={2}>
        <TextField label="障害特性（症状）について（本人・関係機関から）" fullWidth multiline rows={3} value={disabilityStatus.description || ''} onChange={e => set('disabilityStatus', { ...disabilityStatus, description: e.target.value })} />
        <TextField label="支援者追記" fullWidth multiline rows={2} value={disabilityStatus.staffNote || ''} onChange={e => set('disabilityStatus', { ...disabilityStatus, staffNote: e.target.value })} />
      </Stack>

      <SectionTitle>療育・通院・入院の状況</SectionTitle>
      <Stack spacing={2}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <TextField label="精神症状の診断確定時期（例：2018年4月）" fullWidth value={treatmentStatus.diagnosisDate || ''} onChange={e => set('treatmentStatus', { ...treatmentStatus, diagnosisDate: e.target.value })} />
          <TextField label="きっかけ" fullWidth value={treatmentStatus.trigger || ''} onChange={e => set('treatmentStatus', { ...treatmentStatus, trigger: e.target.value })} />
        </Stack>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <TextField label="初めて受診を受けた時期" fullWidth value={hospitalStatus.firstVisit || ''} onChange={e => set('hospitalStatus', { ...hospitalStatus, firstVisit: e.target.value })} />
          <TextField label="通院頻度（例：月1回）" fullWidth value={hospitalStatus.freq || ''} onChange={e => set('hospitalStatus', { ...hospitalStatus, freq: e.target.value })} />
        </Stack>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <SelectField label="入院の有無" value={hospitalStatus.admission} options={[{value:'none',label:'なし'},{value:'yes',label:'あり'}]} onChange={v => set('hospitalStatus', { ...hospitalStatus, admission: v })} />
          <SelectField label="現在の通院" value={hospitalStatus.currentlyVisiting} options={[{value:'yes',label:'通院している'},{value:'no',label:'通院していない'}]} onChange={v => set('hospitalStatus', { ...hospitalStatus, currentlyVisiting: v })} />
        </Stack>
        <TextField label="支援者追記" fullWidth multiline rows={2} value={hospitalStatus.staffNote || ''} onChange={e => set('hospitalStatus', { ...hospitalStatus, staffNote: e.target.value })} />
      </Stack>

      <SectionTitle>現在の病状について</SectionTitle>
      <Stack spacing={2}>
        <SelectField label="現在の状態" value={condition.status} options={[
          {value:'stable',label:'安定している'},{value:'active',label:'症状がある'},{value:'unknown',label:'わからない'}
        ]} onChange={v => set('condition', { ...condition, status: v })} />
        {condition.status === 'active' && (
          <TextField label="どんな状況か" fullWidth multiline rows={2} value={condition.detail || ''} onChange={e => set('condition', { ...condition, detail: e.target.value })} />
        )}
        <TextField label="支援者追記" fullWidth multiline rows={2} value={condition.staffNote || ''} onChange={e => set('condition', { ...condition, staffNote: e.target.value })} />
      </Stack>

      <SectionTitle>体調不良のサイン</SectionTitle>
      <Stack spacing={2}>
        <Box>
          <Typography variant="body2" sx={{ mb: 0.5 }}>体調がよくない時のサイン（複数選択可）</Typography>
          <FormGroup row>
            {BAD_SIGNALS.map(s => (
              <FormControlLabel key={s} control={<Checkbox checked={(badSignals.signs || []).includes(s)} onChange={() => set('badSignals', toggleArr(badSignals, 'signs', s))} />} label={s} />
            ))}
          </FormGroup>
        </Box>
        <Box>
          <Typography variant="body2" sx={{ mb: 0.5 }}>どんな時に起こりがちか（複数選択可）</Typography>
          <FormGroup row>
            {TRIGGER_OPTIONS.map(t => (
              <FormControlLabel key={t} control={<Checkbox checked={(badSignals.triggers || []).includes(t)} onChange={() => set('badSignals', toggleArr(badSignals, 'triggers', t))} />} label={t} />
            ))}
          </FormGroup>
        </Box>
        <TextField label="支援者追記" fullWidth multiline rows={2} value={badSignals.staffNote || ''} onChange={e => set('badSignals', { ...badSignals, staffNote: e.target.value })} />
      </Stack>

      <SectionTitle>体調不良時の対処法</SectionTitle>
      <Stack spacing={2}>
        <Box>
          <Typography variant="body2" sx={{ mb: 0.5 }}>対処法（複数選択可）</Typography>
          <FormGroup row>
            {COPING_METHODS.map(c => (
              <FormControlLabel key={c} control={<Checkbox checked={(copingMethods.methods || []).includes(c)} onChange={() => set('copingMethods', toggleArr(copingMethods, 'methods', c))} />} label={c} />
            ))}
          </FormGroup>
        </Box>
        <TextField label="その他・詳細" fullWidth value={copingMethods.other || ''} onChange={e => set('copingMethods', { ...copingMethods, other: e.target.value })} />
        <TextField label="支援者追記" fullWidth multiline rows={2} value={copingMethods.staffNote || ''} onChange={e => set('copingMethods', { ...copingMethods, staffNote: e.target.value })} />
      </Stack>

      <SectionTitle>相談相手</SectionTitle>
      <Stack spacing={2}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <TextField label="相談相手（例：家族・主治医・支援者）" fullWidth value={consultation.partner || ''} onChange={e => set('consultation', { ...consultation, partner: e.target.value })} />
          <TextField label="氏名" fullWidth value={consultation.name || ''} onChange={e => set('consultation', { ...consultation, name: e.target.value })} />
          <TextField label="続柄・関係" fullWidth value={consultation.relation || ''} onChange={e => set('consultation', { ...consultation, relation: e.target.value })} />
        </Stack>
        <TextField label="支援者追記" fullWidth multiline rows={2} value={consultation.staffNote || ''} onChange={e => set('consultation', { ...consultation, staffNote: e.target.value })} />
      </Stack>

      <SectionTitle>服薬管理</SectionTitle>
      <Stack spacing={2}>
        <SelectField label="服薬の有無" value={medication.status} options={[{value:'none',label:'なし'},{value:'yes',label:'あり'}]} onChange={v => set('medication', { ...medication, status: v })} />
        {medication.status === 'yes' && (
          <>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField label="1日の回数" sx={{ width: 120 }} value={medication.times || ''} onChange={e => set('medication', { ...medication, times: e.target.value })} />
              <Box>
                <Typography variant="body2" sx={{ mb: 0.5 }}>タイミング</Typography>
                <FormGroup row>
                  {MEDICATION_TIMING.map(t => (
                    <FormControlLabel key={t} control={<Checkbox checked={(medication.timing || []).includes(t)} onChange={() => set('medication', toggleArr(medication, 'timing', t))} />} label={t} />
                  ))}
                </FormGroup>
              </Box>
            </Stack>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <SelectField label="精神症状" value={medication.symptoms?.hasSymptoms} options={[{value:'none',label:'なし'},{value:'yes',label:'あり'}]} onChange={v => set('medication', { ...medication, symptoms: { ...medication.symptoms, hasSymptoms: v } })} />
              {medication.symptoms?.hasSymptoms === 'yes' && (
                <TextField label="症状の内容" fullWidth value={medication.symptoms?.detail || ''} onChange={e => set('medication', { ...medication, symptoms: { ...medication.symptoms, detail: e.target.value } })} />
              )}
            </Stack>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <SelectField label="整備方法" value={medication.management} options={[
                {value:'self',label:'自己管理'},{value:'family',label:'家族保管'},{value:'other',label:'その他'}
              ]} onChange={v => set('medication', { ...medication, management: v })} />
              <SelectField label="服薬状況" value={medication.adherence} options={[
                {value:'good',label:'飲み忘れがない'},{value:'poor',label:'飲み忘れがある'},{value:'adjusting',label:'調整中'}
              ]} onChange={v => set('medication', { ...medication, adherence: v })} />
            </Stack>
          </>
        )}
        <TextField label="支援者追記" fullWidth multiline rows={2} value={medication.staffNote || ''} onChange={e => set('medication', { ...medication, staffNote: e.target.value })} />
      </Stack>
    </Box>
  );
}
