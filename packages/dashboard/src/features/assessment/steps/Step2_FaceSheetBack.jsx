// Step2: フェイスシート裏（家族構成・経済状況・障害情報・緊急災害時対応）
import { Box, Typography, TextField, Stack, FormControl, InputLabel, Select, MenuItem, Checkbox, FormControlLabel, FormGroup, Divider } from '@mui/material';

const SectionTitle = ({ children }) => (
  <Box sx={{ bgcolor: '#222', color: '#fff', px: 1.5, py: 0.5, mt: 2, mb: 1, fontWeight: 'bold', fontSize: 13 }}>
    {children}
  </Box>
);

const RadioGroup = ({ label, value, options, onChange }) => (
  <FormControl fullWidth>
    <InputLabel>{label}</InputLabel>
    <Select value={value || ''} label={label} onChange={e => onChange(e.target.value)}>
      {options.map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
    </Select>
  </FormControl>
);

export default function Step2_FaceSheetBack({ data, onChange }) {
  const d = data || {};
  const set = (field, value) => onChange({ ...d, [field]: value });

  // 家族構成（6人）
  const family = d.family || Array(6).fill({});
  const setFamily = (i, field, value) => {
    const updated = [...family];
    updated[i] = { ...updated[i], [field]: value };
    set('family', updated);
  };

  // 経済状況
  const econ = d.economics || {};
  const setEcon = (field, value) => set('economics', { ...econ, [field]: value });

  // 障害情報
  const disability = d.disability || {};
  const setDisability = (field, value) => set('disability', { ...disability, [field]: value });
  const toggleDisabilityType = (type) => {
    const types = disability.types || [];
    const updated = types.includes(type) ? types.filter(t => t !== type) : [...types, type];
    setDisability('types', updated);
  };

  // 障害者手帳
  const certs = disability.certificates || {};
  const setCert = (key, field, value) => {
    setDisability('certificates', { ...certs, [key]: { ...certs[key], [field]: value } });
  };

  // 危機対応
  const crisis = d.crisis || {};
  const setCrisis = (field, value) => set('crisis', { ...crisis, [field]: value });

  const yesNoOptions = [
    { value: 'none', label: '特にない' },
    { value: 'yes', label: 'ある' },
  ];
  const pastPresentOptions = [
    { value: 'none', label: 'なし' },
    { value: 'yes', label: 'ある' },
  ];

  return (
    <Box>
      <Typography variant="h6" fontWeight="bold" gutterBottom>フェイスシート（裏）</Typography>

      <SectionTitle>家族構成</SectionTitle>
      {[0,1,2,3,4,5].map(i => (
        <Stack key={i} direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 1 }} alignItems="center">
          <Typography variant="body2" sx={{ minWidth: 20, fontWeight: 'bold' }}>{i + 1}</Typography>
          <TextField label="氏名" fullWidth value={family[i]?.name || ''} onChange={e => setFamily(i, 'name', e.target.value)} />
          <TextField label="続柄" sx={{ width: 100 }} value={family[i]?.relation || ''} onChange={e => setFamily(i, 'relation', e.target.value)} />
          <FormControl sx={{ width: 120 }}>
            <InputLabel>同居</InputLabel>
            <Select value={family[i]?.living || ''} label="同居" onChange={e => setFamily(i, 'living', e.target.value)}>
              <MenuItem value="yes">同居</MenuItem>
              <MenuItem value="no">別居</MenuItem>
            </Select>
          </FormControl>
          <TextField label="備考" fullWidth value={family[i]?.note || ''} onChange={e => setFamily(i, 'note', e.target.value)} />
        </Stack>
      ))}

      <SectionTitle>経済状況</SectionTitle>
      <Stack spacing={2}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <RadioGroup label="生活保護" value={econ.welfare?.status} options={[{value:'none',label:'無'},{value:'receiving',label:'受給中'},{value:'applying',label:'申請中'}]} onChange={v => setEcon('welfare', { ...econ.welfare, status: v })} />
          <TextField label="月額" sx={{ width: 140 }} value={econ.welfare?.amount || ''} onChange={e => setEcon('welfare', { ...econ.welfare, amount: e.target.value })} />
        </Stack>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <RadioGroup label="障害年金" value={econ.disabilityPension?.status} options={[{value:'none',label:'無'},{value:'receiving',label:'受給中'},{value:'applying',label:'申請中'}]} onChange={v => setEcon('disabilityPension', { ...econ.disabilityPension, status: v })} />
          <RadioGroup label="種別" value={econ.disabilityPension?.type} options={[{value:'basic',label:'基礎'},{value:'welfare',label:'厚生'},{value:'shared',label:'共済'}]} onChange={v => setEcon('disabilityPension', { ...econ.disabilityPension, type: v })} />
          <TextField label="級" sx={{ width: 80 }} value={econ.disabilityPension?.grade || ''} onChange={e => setEcon('disabilityPension', { ...econ.disabilityPension, grade: e.target.value })} />
          <TextField label="月額" sx={{ width: 140 }} value={econ.disabilityPension?.amount || ''} onChange={e => setEcon('disabilityPension', { ...econ.disabilityPension, amount: e.target.value })} />
        </Stack>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <RadioGroup label="健康保険" value={econ.healthInsurance?.type} options={[{value:'national',label:'国保'},{value:'social',label:'社保'},{value:'mutual',label:'共済'},{value:'other',label:'その他'}]} onChange={v => setEcon('healthInsurance', { ...econ.healthInsurance, type: v })} />
          <TextField label="被保険者氏名" fullWidth value={econ.healthInsurance?.holder || ''} onChange={e => setEcon('healthInsurance', { ...econ.healthInsurance, holder: e.target.value })} />
          <RadioGroup label="自立支援医療" value={econ.selfSupportMedical} options={[{value:'none',label:'なし'},{value:'receiving',label:'受給中'},{value:'applying',label:'申請中'}]} onChange={v => setEcon('selfSupportMedical', v)} />
        </Stack>
        <TextField label="備考（その他の収入・家族の収入など）" fullWidth multiline rows={2} value={econ.note || ''} onChange={e => setEcon('note', e.target.value)} />
      </Stack>

      <SectionTitle>障害・疾病の状況</SectionTitle>
      <Stack spacing={2}>
        <Box>
          <Typography variant="body2" sx={{ mb: 0.5 }}>障害種別（複数選択可）</Typography>
          <FormGroup row>
            {['精神', '知的', '身体', '発達', '難病'].map(type => (
              <FormControlLabel key={type} control={<Checkbox checked={(disability.types || []).includes(type)} onChange={() => toggleDisabilityType(type)} />} label={type} />
            ))}
          </FormGroup>
        </Box>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <TextField label="診断名" fullWidth value={disability.diagnosisName || ''} onChange={e => setDisability('diagnosisName', e.target.value)} />
          <TextField label="合併障害" fullWidth value={disability.comorbidity || ''} onChange={e => setDisability('comorbidity', e.target.value)} />
        </Stack>
        <Typography variant="body2" fontWeight="bold">障害者手帳</Typography>
        {[{ key: 'mental', label: '精神障害者保健福祉手帳' }, { key: 'intellectual', label: '療育手帳' }, { key: 'physical', label: '身体障害者手帳' }].map(({ key, label }) => (
          <Stack key={key} direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
            <Typography variant="body2" sx={{ minWidth: 160 }}>{label}</Typography>
            <TextField label="級" sx={{ width: 80 }} value={certs[key]?.grade || ''} onChange={e => setCert(key, 'grade', e.target.value)} />
            <TextField label="取得年月日" sx={{ width: 140 }} value={certs[key]?.date || ''} onChange={e => setCert(key, 'date', e.target.value)} />
            <TextField label="特記事項" fullWidth value={certs[key]?.note || ''} onChange={e => setCert(key, 'note', e.target.value)} />
          </Stack>
        ))}
        <RadioGroup label="手帳申請状況" value={disability.certStatus} options={[{value:'applying',label:'申請中'},{value:'not_applied',label:'未申請'},{value:'unavailable',label:'取得不可'},{value:'none',label:'なし'}]} onChange={v => setDisability('certStatus', v)} />
      </Stack>

      <SectionTitle>緊急災害時・危機対応</SectionTitle>
      <Stack spacing={3}>
        <Box>
          <Typography variant="body2" fontWeight="bold" sx={{ mb: 1 }}>① 非常災害時、身体面や体調面で心配なこと</Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <RadioGroup label="回答" value={crisis.physical?.answer} options={yesNoOptions} onChange={v => setCrisis('physical', { ...crisis.physical, answer: v })} />
            <TextField label="内容" fullWidth value={crisis.physical?.detail || ''} onChange={e => setCrisis('physical', { ...crisis.physical, detail: e.target.value })} />
            <TextField label="対処法" fullWidth value={crisis.physical?.coping || ''} onChange={e => setCrisis('physical', { ...crisis.physical, coping: e.target.value })} />
          </Stack>
        </Box>
        <Box>
          <Typography variant="body2" fontWeight="bold" sx={{ mb: 1 }}>② 発作はありますか（てんかん、パニック等）</Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <RadioGroup label="回答" value={crisis.seizure?.answer} options={yesNoOptions} onChange={v => setCrisis('seizure', { ...crisis.seizure, answer: v })} />
            <TextField label="内容" fullWidth value={crisis.seizure?.detail || ''} onChange={e => setCrisis('seizure', { ...crisis.seizure, detail: e.target.value })} />
            <TextField label="対処法" fullWidth value={crisis.seizure?.coping || ''} onChange={e => setCrisis('seizure', { ...crisis.seizure, coping: e.target.value })} />
          </Stack>
        </Box>
        <Box>
          <Typography variant="body2" fontWeight="bold" sx={{ mb: 1 }}>③ 自傷・他害の心配</Typography>
          <Stack spacing={1}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <RadioGroup label="過去" value={crisis.selfHarm?.past} options={pastPresentOptions} onChange={v => setCrisis('selfHarm', { ...crisis.selfHarm, past: v })} />
              <RadioGroup label="現在" value={crisis.selfHarm?.present} options={pastPresentOptions} onChange={v => setCrisis('selfHarm', { ...crisis.selfHarm, present: v })} />
            </Stack>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField label="内容" fullWidth value={crisis.selfHarm?.detail || ''} onChange={e => setCrisis('selfHarm', { ...crisis.selfHarm, detail: e.target.value })} />
              <TextField label="対処法" fullWidth value={crisis.selfHarm?.coping || ''} onChange={e => setCrisis('selfHarm', { ...crisis.selfHarm, coping: e.target.value })} />
            </Stack>
          </Stack>
        </Box>
        <Box>
          <Typography variant="body2" fontWeight="bold" sx={{ mb: 1 }}>④ 自殺念慮（死にたい気持ち・行動）の有無</Typography>
          <Stack spacing={1}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <RadioGroup label="過去" value={crisis.suicidal?.past} options={pastPresentOptions} onChange={v => setCrisis('suicidal', { ...crisis.suicidal, past: v })} />
              <RadioGroup label="現在" value={crisis.suicidal?.present} options={pastPresentOptions} onChange={v => setCrisis('suicidal', { ...crisis.suicidal, present: v })} />
            </Stack>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField label="内容" fullWidth value={crisis.suicidal?.detail || ''} onChange={e => setCrisis('suicidal', { ...crisis.suicidal, detail: e.target.value })} />
              <TextField label="乗り越えた方法" fullWidth value={crisis.suicidal?.coping || ''} onChange={e => setCrisis('suicidal', { ...crisis.suicidal, coping: e.target.value })} />
            </Stack>
          </Stack>
        </Box>
        <TextField label="全体を通しての特記事項" fullWidth multiline rows={3} value={crisis.generalNote || ''} onChange={e => setCrisis('generalNote', e.target.value)} />
      </Stack>
    </Box>
  );
}
