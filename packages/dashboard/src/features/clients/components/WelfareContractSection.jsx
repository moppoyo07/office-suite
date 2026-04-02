import { Grid, Stack, TextField, Typography, Box, Button, FormControl, InputLabel, Select, MenuItem, Chip } from '@mui/material';
import { format } from 'date-fns';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../../firebase/index';
import { useState, useEffect } from 'react';

// データを安全に表示するためのヘルパーコンポーネント
const DisplayItem = ({ label, value, sm, xs }) => (
  <Grid size={{ xs: xs || 12, sm: sm }}>
    <Typography variant="caption" color="text.secondary">{label}</Typography>
    <Typography>{value || '未設定'}</Typography>
  </Grid>
);

const DisplayRow = ({ children }) => (
  <Grid container spacing={2}>{children}</Grid>
);

// 日付をフォーマットする安全な関数
const formatDate = (date) => {
  try {
    if (date && typeof date.toDate === 'function') {
      return format(date.toDate(), 'yyyy/MM/dd');
    }
    if (date) {
      return format(new Date(date), 'yyyy/MM/dd');
    }
    return '';
  } catch (error) {
    return '日付形式エラー';
  }
};

const WelfareContractSection = ({ isEditing, data, handleChange, handleSave, handleCancelEdit }) => {
  const [municipalities, setMunicipalities] = useState([]);

  // 自治体リストを取得
  useEffect(() => {
    const fetchMunicipalities = async () => {
      try {
        const q = query(
          collection(db, 'municipalities'),
          where('isActive', '==', true)
        );
        const snapshot = await getDocs(q);
        const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        list.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'ja'));
        setMunicipalities(list);
      } catch (err) {
        console.error('自治体取得エラー:', err);
      }
    };
    fetchMunicipalities();
  }, []);

  // billingInfoの値変更ハンドラ
  const handleBillingInfoChange = (field) => (e) => {
    handleChange({
      target: {
        name: 'billingInfo',
        value: {
          ...data?.billingInfo,
          [field]: e.target.value
        }
      }
    });
  };

  const billingInfo = data?.billingInfo || {};

  // 表示モードのJSX
  const renderDisplayMode = () => {
    return (
      <Stack spacing={3}>
        <DisplayRow>
          <DisplayItem label="診断名" value={data?.diagnosisName} />
        </DisplayRow>
        {data?.disabilityTypes?.length > 0 && (
          <DisplayRow>
            <Grid size={12}>
              <Typography variant="caption" color="text.secondary">障害種別</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mt: 0.5 }}>
                {data.disabilityTypes.map(t => <Chip key={t} label={t} size="small" variant="outlined" />)}
              </Box>
            </Grid>
          </DisplayRow>
        )}
        <DisplayRow>
          <DisplayItem label="障害者手帳" value={data?.disabilityHandbook} sm={3} />
          <DisplayItem label="受給者証番号" value={data?.recipientId} sm={3} />
          <DisplayItem label="受給者証有効期限" value={formatDate(data?.recipientExpiry)} sm={3} />
          <DisplayItem label="利用料上限月額" value={data?.usageFee ? `${data.usageFee}円` : '未設定'} sm={3} />
        </DisplayRow>
        <DisplayRow>
          <DisplayItem label="暫定期間終了日" value={formatDate(data?.provisionalPeriodEndDate)} sm={4} />
          <DisplayItem label="契約日" value={formatDate(data?.contractDate)} sm={4} />
          <DisplayItem label="利用開始日" value={formatDate(data?.serviceStartDate)} sm={4} />
        </DisplayRow>
        <DisplayRow>
          <DisplayItem label="利用終了日" value={formatDate(data?.serviceEndDate)} sm={4} />
        </DisplayRow>
        <DisplayRow>
          <DisplayItem label="請求先自治体" value={billingInfo.municipalityName || '未設定'} sm={4} />
        </DisplayRow>

      </Stack>
    );
  };

  // 編集モード
  const renderEditMode = () => (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12 }}>
        <TextField size="small" name="diagnosisName" label="診断名" value={data?.diagnosisName || ''} onChange={handleChange} fullWidth />
      </Grid>
      <Grid size={{ xs: 12, sm: 3 }}>
        <TextField size="small" name="disabilityHandbook" label="障害者手帳" value={data?.disabilityHandbook || ''} onChange={handleChange} fullWidth />
      </Grid>
      <Grid size={{ xs: 12, sm: 3 }}>
        <TextField size="small" name="recipientId" label="受給者証番号" value={data?.recipientId || ''} onChange={handleChange} fullWidth />
      </Grid>
      <Grid size={{ xs: 12, sm: 3 }}>
        <TextField
          size="small"
          name="recipientExpiry"
          label="受給者証有効期限"
          type="date"
          value={data?.recipientExpiry ? format(new Date(data.recipientExpiry.seconds ? data.recipientExpiry.toDate() : data.recipientExpiry), 'yyyy-MM-dd') : ''}
          onChange={handleChange}
          fullWidth
          slotProps={{ inputLabel: { shrink: true } }}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 3 }}>
        <TextField size="small" name="usageFee" label="利用料上限月額" type="number" value={data?.usageFee || ''} onChange={handleChange} fullWidth placeholder="例: 37200" />
      </Grid>
      <Grid size={{ xs: 12, sm: 4 }}>
        <TextField
          size="small"
          name="provisionalPeriodEndDate"
          label="暫定期間終了日"
          type="date"
          value={data?.provisionalPeriodEndDate ? format(new Date(data.provisionalPeriodEndDate.seconds ? data.provisionalPeriodEndDate.toDate() : data.provisionalPeriodEndDate), 'yyyy-MM-dd') : ''}
          onChange={handleChange}
          fullWidth
          slotProps={{ inputLabel: { shrink: true } }}
          helperText="暫定期間がある場合のみ入力（2週間前にアラート表示）"
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 4 }}>
        <TextField
          size="small"
          name="contractDate"
          label="契約日"
          type="date"
          value={data?.contractDate ? format(new Date(data.contractDate.seconds ? data.contractDate.toDate() : data.contractDate), 'yyyy-MM-dd') : ''}
          onChange={handleChange}
          fullWidth
          slotProps={{ inputLabel: { shrink: true } }}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 4 }}>
        <TextField
          size="small"
          name="serviceStartDate"
          label="利用開始日"
          type="date"
          value={data?.serviceStartDate ? format(new Date(data.serviceStartDate.seconds ? data.serviceStartDate.toDate() : data.serviceStartDate), 'yyyy-MM-dd') : ''}
          onChange={handleChange}
          fullWidth
          slotProps={{ inputLabel: { shrink: true } }}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 4 }}>
        <TextField
          size="small"
          name="serviceEndDate"
          label="利用終了日"
          type="date"
          value={data?.serviceEndDate ? format(new Date(data.serviceEndDate.seconds ? data.serviceEndDate.toDate() : data.serviceEndDate), 'yyyy-MM-dd') : ''}
          onChange={handleChange}
          fullWidth
          slotProps={{ inputLabel: { shrink: true } }}
        />
      </Grid>

      <Grid size={{ xs: 12, sm: 4 }}>
        <FormControl size="small" fullWidth sx={{ mt: 1 }}>
          <InputLabel>請求先自治体</InputLabel>
          <Select
            label="請求先自治体"
            value={billingInfo.municipalityName || ''}
            onChange={handleBillingInfoChange('municipalityName')}
          >
            <MenuItem value="">未設定</MenuItem>
            {municipalities.map(m => (
              <MenuItem key={m.id} value={m.billingName}>{m.name}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
    </Grid>
  );

  return (
    <Box>
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
        {isEditing ? (
          <>
            <Button variant="outlined" onClick={handleCancelEdit}>キャンセル</Button>
            <Button variant="contained" onClick={() => handleSave()}>保存</Button>
          </>
        ) : (
          null
        )}
      </Box>
      {isEditing ? renderEditMode() : renderDisplayMode()}
    </Box>
  );
};

export default WelfareContractSection;