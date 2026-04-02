import {
  Box, Typography, Divider, Stack, Chip, Alert, Button, Grid
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import EditIcon from '@mui/icons-material/Edit';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

// --- 表示用の小部品 ---

const SectionBlock = ({ title, children }) => (
  <Box sx={{ mb: 3 }}>
    <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1, borderLeft: '3px solid #64748b', pl: 1 }}>
      {title}
    </Typography>
    {children}
  </Box>
);

const LabelValue = ({ label, value }) => (
  <Box>
    <Typography variant="caption" color="text.secondary">{label}</Typography>
    <Typography variant="body2" sx={{ mt: 0.25 }}>{value || '未記入'}</Typography>
  </Box>
);

const ChipGroup = ({ items }) => (
  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
    {items && items.length > 0
      ? items.map((s, i) => <Chip key={i} label={s} size="small" variant="outlined" />)
      : <Typography variant="body2" color="text.secondary">なし</Typography>}
  </Box>
);

const STATUS_LABEL = { stable: '安定している', active: '症状がある', unknown: 'わからない' };
const ADMISSION_LABEL = { none: 'なし', yes: 'あり' };
const VISITING_LABEL = { yes: '通院している', no: '通院していない' };
const MEDICATION_LABEL = { none: 'なし', yes: 'あり' };
const MANAGEMENT_LABEL = { self: '自己管理', family: '家族保管', other: 'その他' };
const ADHERENCE_LABEL = { good: '飲み忘れがない', poor: '飲み忘れがある', adjusting: '調整中' };
const BEHAVIOR_STATUS_LABEL = { none: '特にない', yes: 'ある', unknown: 'わからない' };

const BEHAVIOR_ITEMS = [
  { key: 'panic',        label: 'パニック' },
  { key: 'obsession',    label: 'こだわり' },
  { key: 'compulsion',   label: '強迫行為・強迫観念' },
  { key: 'hallucination',label: '幻覚・妄想' },
  { key: 'seizure',      label: '発作' },
  { key: 'other',        label: 'その他' },
];

const COPING_LABEL = { self: '自分の対処法がある', others: '周りの対処法がある', none: '対処方法がない' };

// --- メインコンポーネント ---

const HealthStatusSection = ({ mentalData, behaviorsData }) => {
  const navigate = useNavigate();
  const { clientId } = useParams();

  const m = mentalData || {};
  const b = behaviorsData || {};

  const disabilityStatus = m.disabilityStatus || {};
  const treatmentStatus  = m.treatmentStatus  || {};
  const hospitalStatus   = m.hospitalStatus   || {};
  const condition        = m.condition        || {};
  const badSignals       = m.badSignals       || {};
  const copingMethods    = m.copingMethods    || {};
  const consultation     = m.consultation     || {};
  const medication       = m.medication       || {};

  // 「ある」なのに支援者追記が空の行動項目
  const behaviorWarnings = BEHAVIOR_ITEMS.filter(
    item => b[item.key]?.status === 'yes' && !b[item.key]?.staffNote
  );

  const hasAnyData = m.disabilityStatus || m.badSignals || m.medication || Object.keys(b).length > 0;

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h5">心身の状況</Typography>
        <Button
          size="small"
          variant="outlined"
          startIcon={<EditIcon />}
          onClick={() => navigate(`/clients/${clientId}/assessment`)}
        >
          アセスメントで編集
        </Button>
      </Stack>
      <Divider sx={{ mb: 3 }} />

      {!hasAnyData && (
        <Alert severity="info" sx={{ mb: 2 }}>
          アセスメントがまだ入力されていません。「アセスメントで編集」から入力してください。
        </Alert>
      )}

      {behaviorWarnings.length > 0 && (
        <Alert severity="warning" icon={<WarningAmberIcon />} sx={{ mb: 2 }}>
          行動面（{behaviorWarnings.map(i => i.label).join('、')}）の支援者追記が未入力です。
        </Alert>
      )}

      {/* 障害の状況 */}
      <SectionBlock title="障害の状況">
        <Stack spacing={1}>
          <LabelValue label="障害特性・症状" value={disabilityStatus.description} />
          {disabilityStatus.staffNote && <LabelValue label="支援者追記" value={disabilityStatus.staffNote} />}
        </Stack>
      </SectionBlock>

      {/* 療育・通院・入院 */}
      <SectionBlock title="療育・通院・入院の状況">
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <LabelValue label="精神症状の診断確定時期" value={treatmentStatus.diagnosisDate} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <LabelValue label="きっかけ" value={treatmentStatus.trigger} />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <LabelValue label="初回受診時期" value={hospitalStatus.firstVisit} />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <LabelValue label="通院頻度" value={hospitalStatus.freq} />
          </Grid>
          <Grid size={{ xs: 12, sm: 2 }}>
            <LabelValue label="入院歴" value={ADMISSION_LABEL[hospitalStatus.admission]} />
          </Grid>
          <Grid size={{ xs: 12, sm: 2 }}>
            <LabelValue label="現在の通院" value={VISITING_LABEL[hospitalStatus.currentlyVisiting]} />
          </Grid>
          {hospitalStatus.staffNote && (
            <Grid size={12}>
              <LabelValue label="支援者追記" value={hospitalStatus.staffNote} />
            </Grid>
          )}
        </Grid>
      </SectionBlock>

      {/* 現在の病状 */}
      <SectionBlock title="現在の病状">
        <Stack spacing={1}>
          <LabelValue label="現在の状態" value={STATUS_LABEL[condition.status]} />
          {condition.status === 'active' && <LabelValue label="状況の詳細" value={condition.detail} />}
          {condition.staffNote && <LabelValue label="支援者追記" value={condition.staffNote} />}
        </Stack>
      </SectionBlock>

      {/* 体調不良のサイン */}
      <SectionBlock title="体調不良のサイン">
        <Stack spacing={1.5}>
          <Box>
            <Typography variant="caption" color="text.secondary">サイン</Typography>
            <Box sx={{ mt: 0.5 }}><ChipGroup items={badSignals.signs} /></Box>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">起きやすい状況</Typography>
            <Box sx={{ mt: 0.5 }}><ChipGroup items={badSignals.triggers} /></Box>
          </Box>
          {badSignals.staffNote && <LabelValue label="支援者追記" value={badSignals.staffNote} />}
        </Stack>
      </SectionBlock>

      {/* 体調不良時の対処法 */}
      <SectionBlock title="体調不良時の対処法">
        <Stack spacing={1.5}>
          <Box>
            <Typography variant="caption" color="text.secondary">対処法</Typography>
            <Box sx={{ mt: 0.5 }}><ChipGroup items={copingMethods.methods} /></Box>
          </Box>
          {copingMethods.other && <LabelValue label="その他・詳細" value={copingMethods.other} />}
          {copingMethods.staffNote && <LabelValue label="支援者追記" value={copingMethods.staffNote} />}
        </Stack>
      </SectionBlock>

      {/* 相談相手 */}
      <SectionBlock title="相談相手">
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <LabelValue label="相談相手" value={consultation.partner} />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <LabelValue label="氏名" value={consultation.name} />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <LabelValue label="続柄・関係" value={consultation.relation} />
          </Grid>
          {consultation.staffNote && (
            <Grid size={12}>
              <LabelValue label="支援者追記" value={consultation.staffNote} />
            </Grid>
          )}
        </Grid>
      </SectionBlock>

      {/* 服薬管理 */}
      <SectionBlock title="服薬管理">
        <Stack spacing={1}>
          <LabelValue label="服薬の有無" value={MEDICATION_LABEL[medication.status]} />
          {medication.status === 'yes' && (
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 3 }}>
                <LabelValue label="1日の回数" value={medication.times} />
              </Grid>
              <Grid size={{ xs: 12, sm: 5 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">タイミング</Typography>
                  <Box sx={{ mt: 0.5 }}><ChipGroup items={medication.timing} /></Box>
                </Box>
              </Grid>
              <Grid size={{ xs: 12, sm: 2 }}>
                <LabelValue label="整備方法" value={MANAGEMENT_LABEL[medication.management]} />
              </Grid>
              <Grid size={{ xs: 12, sm: 2 }}>
                <LabelValue label="服薬状況" value={ADHERENCE_LABEL[medication.adherence]} />
              </Grid>
            </Grid>
          )}
          {medication.staffNote && <LabelValue label="支援者追記" value={medication.staffNote} />}
        </Stack>
      </SectionBlock>

      <Divider sx={{ my: 3 }} />

      {/* 行動について */}
      <SectionBlock title="行動面">
        {BEHAVIOR_ITEMS.map(({ key, label }) => {
          const item = b[key] || {};
          return (
            <Box
              key={key}
              sx={{
                mb: 1.5, p: 1.5, borderRadius: 1, border: '1px solid',
                borderColor: item.status === 'yes' && !item.staffNote ? 'warning.main' : 'divider',
                bgcolor: item.status === 'yes' && !item.staffNote ? 'warning.light' : 'action.hover',
              }}
            >
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
                <Typography variant="subtitle2" fontWeight="bold">{label}</Typography>
                <Chip
                  label={BEHAVIOR_STATUS_LABEL[item.status] || '未入力'}
                  size="small"
                  color={item.status === 'yes' ? 'error' : item.status === 'none' ? 'success' : 'default'}
                  variant="outlined"
                />
              </Stack>
              {item.status === 'yes' && (
                <Stack spacing={0.5} sx={{ pl: 1 }}>
                  {item.coping?.length > 0 && (
                    <Typography variant="body2" color="text.secondary">
                      対処: {item.coping.map(c => COPING_LABEL[c] || c).join('・')}
                    </Typography>
                  )}
                  {item.selfComment && (
                    <Typography variant="body2" color="text.secondary">本人: {item.selfComment}</Typography>
                  )}
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    支援者: {item.staffNote || '（未記入）'}
                    {!item.staffNote && <Chip label="要記入" size="small" color="warning" sx={{ ml: 1 }} />}
                  </Typography>
                </Stack>
              )}
            </Box>
          );
        })}
        {b.behaviorNotes && (
          <Box sx={{ mt: 1 }}>
            <LabelValue label="特記事項" value={b.behaviorNotes} />
          </Box>
        )}
      </SectionBlock>
    </Box>
  );
};

export default HealthStatusSection;
