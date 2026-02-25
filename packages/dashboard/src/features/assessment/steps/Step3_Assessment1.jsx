// Step3: アセスメントシート1（社会参加・日中活動・居住・免許・就労）
import { Box, Typography, TextField, Stack, FormControl, InputLabel, Select, MenuItem, Checkbox, FormControlLabel, FormGroup, RadioGroup as MuiRadioGroup, Radio, FormLabel } from '@mui/material';

const SectionTitle = ({ children }) => (
  <Box sx={{ bgcolor: '#222', color: '#fff', px: 1.5, py: 0.5, mt: 2, mb: 1, fontWeight: 'bold', fontSize: 13 }}>
    {children}
  </Box>
);

const SelectField = ({ label, value, options, onChange, width }) => (
  <FormControl fullWidth={!width} sx={width ? { width } : {}}>
    <InputLabel>{label}</InputLabel>
    <Select value={value || ''} label={label} onChange={e => onChange(e.target.value)}>
      {options.map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
    </Select>
  </FormControl>
);

export default function Step3_Assessment1({ data, onChange }) {
  const d = data || {};
  const set = (field, value) => onChange({ ...d, [field]: value });

  const social = d.social || {};
  const setSocial = (f, v) => set('social', { ...social, [f]: v });

  const dailyActivity = d.dailyActivity || {};
  const setDaily = (f, v) => set('dailyActivity', { ...dailyActivity, [f]: v });

  const housing = d.housing || {};
  const setHousing = (f, v) => set('housing', { ...housing, [f]: v });

  const employment = d.employment || {};
  const setEmployment = (f, v) => set('employment', { ...employment, [f]: v });

  const toggleEmploymentStatus = (val) => {
    const current = employment.currentStatus || [];
    const updated = current.includes(val) ? current.filter(v => v !== val) : [...current, val];
    setEmployment('currentStatus', updated);
  };

  const EMPLOYMENT_STATUSES = [
    '一般就労', 'パート・アルバイト', '就労移行支援', '就労継続支援A型', '就労継続支援B型', '未就労', 'その他'
  ];

  return (
    <Box>
      <Typography variant="h6" fontWeight="bold" gutterBottom>アセスメントシート１</Typography>

      <SectionTitle>社会参加（地域生活関連）</SectionTitle>
      <Stack spacing={2}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <TextField label="外出の頻度（例：週3回）" fullWidth value={social.outingFreq || ''} onChange={e => setSocial('outingFreq', e.target.value)} />
          <TextField label="主な外出先" fullWidth value={social.outingPlaces || ''} onChange={e => setSocial('outingPlaces', e.target.value)} />
        </Stack>
        <TextField label="社会参加の状況（地域活動・趣味など）" fullWidth multiline rows={2} value={social.participation || ''} onChange={e => setSocial('participation', e.target.value)} />
        <Box>
          <Typography variant="body2" sx={{ mb: 0.5 }}>過去2年間の入所歴</Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
            <SelectField label="入所歴" value={social.admissionHistory} options={[{value:'none',label:'なし'},{value:'yes',label:'あり'}]} onChange={v => setSocial('admissionHistory', v)} width={120} />
            {social.admissionHistory === 'yes' && (
              <>
                <TextField label="期間①（例：2020/04〜2021/03）" fullWidth value={social.admissionPeriod1 || ''} onChange={e => setSocial('admissionPeriod1', e.target.value)} />
                <TextField label="施設の種類①" fullWidth value={social.admissionType1 || ''} onChange={e => setSocial('admissionType1', e.target.value)} />
              </>
            )}
          </Stack>
          {social.admissionHistory === 'yes' && (
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 1 }}>
              <TextField label="期間②" fullWidth value={social.admissionPeriod2 || ''} onChange={e => setSocial('admissionPeriod2', e.target.value)} />
              <TextField label="施設の種類②" fullWidth value={social.admissionType2 || ''} onChange={e => setSocial('admissionType2', e.target.value)} />
            </Stack>
          )}
        </Box>
        <TextField label="その他（社会参加に関する特記事項）" fullWidth multiline rows={2} value={social.note || ''} onChange={e => setSocial('note', e.target.value)} />
      </Stack>

      <SectionTitle>日中活動</SectionTitle>
      <Stack spacing={2}>
        <SelectField label="主な活動場所" value={dailyActivity.place} options={[
          {value:'home',label:'自宅'},{value:'facility',label:'施設'},{value:'hospital',label:'病院'},{value:'other',label:'その他'}
        ]} onChange={v => setDaily('place', v)} />
        <TextField label="1日の様子（起床・食事・活動・就寝など）" fullWidth multiline rows={4} value={dailyActivity.dayDescription || ''} onChange={e => setDaily('dayDescription', e.target.value)} />
        <TextField label="休日の様子" fullWidth multiline rows={2} value={dailyActivity.holidayDescription || ''} onChange={e => setDaily('holidayDescription', e.target.value)} />
      </Stack>

      <SectionTitle>居住関連</SectionTitle>
      <Stack spacing={2}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <SelectField label="住居形態" value={housing.type} options={[
            {value:'own_single',label:'自宅（単身）'},{value:'own_family',label:'自宅（家族等と同居）'},
            {value:'group_home',label:'グループホーム'},{value:'care_home',label:'ケアホーム'},
            {value:'hospital',label:'病院'},{value:'facility',label:'入所施設'},{value:'other',label:'その他'}
          ]} onChange={v => setHousing('type', v)} />
          <SelectField label="建物種別" value={housing.structure} options={[
            {value:'house',label:'一戸建て'},{value:'mansion',label:'マンション'},{value:'apartment',label:'アパート'},{value:'other',label:'その他'}
          ]} onChange={v => setHousing('structure', v)} />
        </Stack>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <SelectField label="本人の部屋" value={housing.room} options={[
            {value:'private',label:'専用（個室）'},{value:'shared',label:'兼用（相部屋）'},{value:'none',label:'なし'}
          ]} onChange={v => setHousing('room', v)} />
          <SelectField label="寝具" value={housing.bedding} options={[
            {value:'bed',label:'ベッド'},{value:'futon',label:'布団'},{value:'other',label:'その他'}
          ]} onChange={v => setHousing('bedding', v)} />
        </Stack>
        <TextField label="その他特記事項（同居者・住環境など）" fullWidth multiline rows={2} value={housing.notes || ''} onChange={e => setHousing('notes', e.target.value)} />
      </Stack>

      <SectionTitle>免許・資格・検定など</SectionTitle>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        <SelectField label="有無" value={d.qualificationsStatus} options={[{value:'yes',label:'有'},{value:'none',label:'無'}]} onChange={v => set('qualificationsStatus', v)} width={100} />
        <TextField label="内容" fullWidth value={d.qualifications || ''} onChange={e => set('qualifications', e.target.value)} />
      </Stack>

      <SectionTitle>就労関連について</SectionTitle>
      <Stack spacing={2}>
        <Box>
          <Typography variant="body2" sx={{ mb: 0.5 }}>就労状況（複数選択可）</Typography>
          <FormGroup row>
            {EMPLOYMENT_STATUSES.map(s => (
              <FormControlLabel key={s} control={<Checkbox checked={(employment.currentStatus || []).includes(s)} onChange={() => toggleEmploymentStatus(s)} />} label={s} />
            ))}
          </FormGroup>
        </Box>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          {[
            { label: '一般就労・アルバイト経験', field: 'expGeneral' },
            { label: '就労移行・継続支援経験', field: 'expWelfare' },
            { label: '最近1年間の就労経験', field: 'expRecent' },
            { label: '中断の有無', field: 'interrupted' },
          ].map(({ label, field }) => (
            <SelectField key={field} label={label} value={employment[field]} options={[{value:'none',label:'なし'},{value:'yes',label:'あり'}]} onChange={v => setEmployment(field, v)} />
          ))}
        </Stack>
        <TextField label="主な就労先（最後）" fullWidth value={employment.mainEmployer || ''} onChange={e => setEmployment('mainEmployer', e.target.value)} />
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <SelectField label="一般就労希望" value={employment.hopeGeneral} options={[{value:'none',label:'なし'},{value:'yes',label:'あり'}]} onChange={v => setEmployment('hopeGeneral', v)} />
          <TextField label="希望する仕事" fullWidth value={employment.desiredJob || ''} onChange={e => setEmployment('desiredJob', e.target.value)} />
        </Stack>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <TextField label="就職希望時期" fullWidth value={employment.desiredTiming || ''} onChange={e => setEmployment('desiredTiming', e.target.value)} />
          <SelectField label="オープン・クローズ" value={employment.openClose} options={[{value:'open',label:'オープン（障害開示）'},{value:'close',label:'クローズ（非開示）'},{value:'undecided',label:'未定'}]} onChange={v => setEmployment('openClose', v)} />
        </Stack>
        <TextField label="特記事項・メモ" fullWidth multiline rows={2} value={employment.notes || ''} onChange={e => setEmployment('notes', e.target.value)} />
      </Stack>
    </Box>
  );
}
