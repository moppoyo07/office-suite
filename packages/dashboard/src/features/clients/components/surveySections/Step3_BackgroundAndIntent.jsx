import React from 'react';
import { Grid, Stack, TextField, Typography, Box, Button, IconButton, MenuItem, Divider, Paper } from '@mui/material';
import { format } from 'date-fns';
import DeleteIcon from '@mui/icons-material/Delete';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';

// 日付フォーマット関数
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
    return '';
  }
};

// 交通手段の選択肢
const TRANSPORT_TYPES = [
  { value: 'public', label: '公共交通(電車/バス)' },
  { value: 'private', label: '自家用車/バイク' },
  { value: 'service', label: '事業所送迎' },
  { value: 'walk', label: '徒歩/自転車' },
];

const BasicInfoSection = ({ isEditing, data, handleChange, handleSave, handleCancelEdit, setEditedData }) => {
  
  // --- 経路情報の操作ハンドラ (配列操作用) ---
  
  // 経路を追加
  const handleAddRoute = () => {
    const currentRoutes = data.commuteRoutes || [];
    const newRoute = { type: 'public', company: '', from: '', to: '', cost: 0, costDiscounted: 0, note: '' };
    // 親のstateを更新 (setEditedDataが使える前提、もしくはhandleChangeをハックする)
    if(setEditedData) {
        setEditedData({ ...data, commuteRoutes: [...currentRoutes, newRoute] });
    }
  };

  // 経路を削除
  const handleRemoveRoute = (index) => {
    const currentRoutes = data.commuteRoutes || [];
    const newRoutes = currentRoutes.filter((_, i) => i !== index);
    if(setEditedData) {
        setEditedData({ ...data, commuteRoutes: newRoutes });
    }
  };

  // 経路の中身を変更
  const handleRouteChange = (index, field, value) => {
    const currentRoutes = [...(data.commuteRoutes || [])];
    currentRoutes[index] = { ...currentRoutes[index], [field]: value };
    if(setEditedData) {
        setEditedData({ ...data, commuteRoutes: currentRoutes });
    }
  };

  // 往復日額の合計計算
  const calculateDailyTotal = () => {
    const routes = data?.commuteRoutes || [];
    // 割引後運賃があればそれを、なければ通常運賃を使用。往復なので×2
    const oneWayTotal = routes.reduce((sum, r) => sum + Number(r.costDiscounted || r.cost || 0), 0);
    return oneWayTotal * 2;
  };

  // --- 表示モード (View Mode) ---
  const renderDisplayMode = () => (
    <Stack spacing={4}>
      {/* 基本情報 */}
      <Box>
        <Typography variant="subtitle1" gutterBottom sx={{ borderLeft: '4px solid #1976d2', pl: 1, mb: 2 }}>
          基本情報
        </Typography>
        <Grid container spacing={2} rowSpacing={3}>
          <Grid item xs={12} sm={6}>
            <Typography variant="caption" color="text.secondary">氏名</Typography>
            <Typography>{data?.name || '未設定'}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="caption" color="text.secondary">フリガナ</Typography>
            <Typography>{data?.nameKana || '未設定'}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="caption" color="text.secondary">生年月日</Typography>
            <Typography>{formatDate(data?.birthDate)}</Typography>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Typography variant="caption" color="text.secondary">性別</Typography>
            <Typography>{data?.gender || '未設定'}</Typography>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Typography variant="caption" color="text.secondary">血液型</Typography>
            <Typography>{data?.bloodType || '未設定'}</Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="caption" color="text.secondary">住所</Typography>
            <Typography>{(data?.postalCode ? `〒${data.postalCode} ` : '') + (data?.address || '未設定')}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="caption" color="text.secondary">電話番号</Typography>
            <Typography>{data?.phone || '未設定'}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="caption" color="text.secondary">携帯電話</Typography>
            <Typography>{data?.mobilePhone || '未設定'}</Typography>
          </Grid>
        </Grid>
      </Box>

      {/* 通所経路・助成設定 (ここを大幅拡張) */}
      <Box>
        <Typography variant="subtitle1" gutterBottom sx={{ borderLeft: '4px solid #ed6c02', pl: 1, mb: 2 }}>
          通所経路・助成金設定
        </Typography>
        
        {/* 経路リスト表示 */}
        <Stack spacing={2} sx={{ mb: 3 }}>
          {(data?.commuteRoutes && data.commuteRoutes.length > 0) ? (
            data.commuteRoutes.map((route, index) => (
              <Paper key={index} variant="outlined" sx={{ p: 2, bgcolor: 'background.default' }}>
                <Grid container spacing={1}>
                  <Grid item xs={12} sm={3}>
                    <Typography variant="caption" color="text.secondary">手段・会社</Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {TRANSPORT_TYPES.find(t => t.value === route.type)?.label}
                      {route.company && ` (${route.company})`}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Typography variant="caption" color="text.secondary">区間</Typography>
                    <Typography variant="body2">{route.from} ～ {route.to}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <Typography variant="caption" color="text.secondary">詳細・割引</Typography>
                    <Typography variant="body2">{route.note || '-'}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={2} sx={{ textAlign: 'right' }}>
                    <Typography variant="caption" color="text.secondary">片道運賃</Typography>
                    <Typography variant="body2">
                      {route.costDiscounted ? (
                         <span style={{ color: 'red' }}>¥{Number(route.costDiscounted).toLocaleString()}</span>
                      ) : (
                         `¥${Number(route.cost || 0).toLocaleString()}`
                      )}
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>
            ))
          ) : (
            <Typography color="text.secondary">経路情報が登録されていません</Typography>
          )}
        </Stack>

        {/* 金額サマリ */}
        <Paper elevation={0} sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 2 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={4}>
              <Typography variant="caption" color="text.secondary">往復日額 (実費合計)</Typography>
              <Typography variant="h6">¥ {calculateDailyTotal().toLocaleString()}</Typography>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Typography variant="caption" color="text.secondary">1ヶ月定期代 (比較用上限)</Typography>
              <Typography variant="h6">
                {data?.commuteMonthlyPass ? `¥ ${Number(data.commuteMonthlyPass).toLocaleString()}` : '-'}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Typography variant="caption" color="text.secondary">行政認定単価 (廿日市等)</Typography>
              <Typography variant="h6">
                {data?.commuteAdminDayCost ? `¥ ${Number(data.commuteAdminDayCost).toLocaleString()}` : '-'}
              </Typography>
            </Grid>
          </Grid>
        </Paper>
      </Box>
    </Stack>
  );

  // --- 編集モード (Edit Mode) ---
  const renderEditMode = () => (
    <Grid container spacing={4}>
      {/* 左カラム：基本情報 */}
      <Grid item xs={12} md={6}>
        <Typography variant="subtitle1" gutterBottom sx={{ borderLeft: '4px solid #1976d2', pl: 1, mb: 2 }}>基本情報</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}><TextField size="small" name="name" label="氏名" value={data?.name || ''} onChange={handleChange} fullWidth /></Grid>
          <Grid item xs={12} sm={6}><TextField size="small" name="nameKana" label="フリガナ" value={data?.nameKana || ''} onChange={handleChange} fullWidth /></Grid>
          <Grid item xs={12} sm={6}><TextField size="small" name="birthDate" label="生年月日" type="date" value={data?.birthDate ? format(new Date(data.birthDate.seconds ? data.birthDate.toDate() : data.birthDate), 'yyyy-MM-dd') : ''} onChange={handleChange} fullWidth InputLabelProps={{ shrink: true }} /></Grid>
          <Grid item xs={12} sm={3}><TextField size="small" name="gender" label="性別" value={data?.gender || ''} onChange={handleChange} fullWidth /></Grid>
          <Grid item xs={12} sm={3}><TextField size="small" name="bloodType" label="血液型" value={data?.bloodType || ''} onChange={handleChange} fullWidth /></Grid>
          <Grid item xs={12} sm={4}><TextField size="small" name="postalCode" label="郵便番号" value={data?.postalCode || ''} onChange={handleChange} fullWidth /></Grid>
          <Grid item xs={12} sm={8}><TextField size="small" name="address" label="住所" value={data?.address || ''} onChange={handleChange} fullWidth /></Grid>
          <Grid item xs={12} sm={6}><TextField size="small" name="phone" label="電話番号" value={data?.phone || ''} onChange={handleChange} fullWidth /></Grid>
          <Grid item xs={12} sm={6}><TextField size="small" name="mobilePhone" label="携帯電話" value={data?.mobilePhone || ''} onChange={handleChange} fullWidth /></Grid>
          <Grid item xs={12}><TextField size="small" name="email" label="メールアドレス" type="email" value={data?.email || ''} onChange={handleChange} fullWidth /></Grid>
        </Grid>
      </Grid>
      
      {/* 右カラム：通所経路 (リスト形式で編集) */}
      <Grid item xs={12} md={6}>
        <Typography variant="subtitle1" gutterBottom sx={{ borderLeft: '4px solid #ed6c02', pl: 1, mb: 2 }}>
            通所経路・助成設定
        </Typography>
        
        <Stack spacing={2}>
            {/* 経路リスト編集 */}
            {(data?.commuteRoutes || []).map((route, index) => (
                <Paper key={index} variant="outlined" sx={{ p: 1.5, position: 'relative' }}>
                    <IconButton 
                        size="small" 
                        onClick={() => handleRemoveRoute(index)}
                        sx={{ position: 'absolute', top: 4, right: 4, color: 'error.main' }}
                    >
                        <DeleteIcon fontSize="small" />
                    </IconButton>
                    
                    <Grid container spacing={2} sx={{ pr: 3 }}>
                        <Grid item xs={6}>
                            <TextField select fullWidth size="small" label="種別" value={route.type} onChange={(e)=>handleRouteChange(index, 'type', e.target.value)}>
                                {TRANSPORT_TYPES.map(t => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
                            </TextField>
                        </Grid>
                        <Grid item xs={6}>
                            <TextField fullWidth size="small" label="会社・路線名" placeholder="例:広島バス" value={route.company} onChange={(e)=>handleRouteChange(index, 'company', e.target.value)} />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField fullWidth size="small" label="出発" value={route.from} onChange={(e)=>handleRouteChange(index, 'from', e.target.value)} />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField fullWidth size="small" label="到着" value={route.to} onChange={(e)=>handleRouteChange(index, 'to', e.target.value)} />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField fullWidth size="small" type="number" label="通常運賃(片道)" value={route.cost} onChange={(e)=>handleRouteChange(index, 'cost', e.target.value)} />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField fullWidth size="small" type="number" label="割引・適用運賃(片道)" placeholder="同額なら空欄" value={route.costDiscounted} onChange={(e)=>handleRouteChange(index, 'costDiscounted', e.target.value)} />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField fullWidth size="small" label="備考・割引詳細" placeholder="例:障害者割引あり、ICOCA使用" value={route.note} onChange={(e)=>handleRouteChange(index, 'note', e.target.value)} />
                        </Grid>
                    </Grid>
                </Paper>
            ))}

            <Button 
                startIcon={<AddCircleOutlineIcon />} 
                variant="outlined" 
                onClick={handleAddRoute}
                sx={{ borderStyle: 'dashed' }}
            >
                経路を追加
            </Button>

            <Divider sx={{ my: 2 }} />

            {/* 定期代・行政単価設定 */}
            <Typography variant="body2" fontWeight="bold">助成金計算設定</Typography>
            <Grid container spacing={2}>
                 <Grid item xs={6}>
                    <TextField fullWidth size="small" type="number" name="commuteMonthlyPass" label="1ヶ月定期代(比較用)" value={data?.commuteMonthlyPass || ''} onChange={handleChange} helperText="実費より安い場合に適用されます" />
                 </Grid>
                 <Grid item xs={6}>
                    <TextField fullWidth size="small" type="number" name="commuteAdminDayCost" label="行政決定単価(日額)" value={data?.commuteAdminDayCost || ''} onChange={handleChange} helperText="廿日市市など固定単価の場合" />
                 </Grid>
            </Grid>
        </Stack>
      </Grid>
    </Grid>
  );

  return (
    <Box>
      {isEditing ? renderEditMode() : renderDisplayMode()}
      {isEditing && (
        <Stack direction="row" spacing={2} sx={{ mt: 3, justifyContent: 'flex-end' }}>
            <Button variant="outlined" onClick={handleCancelEdit}>キャンセル</Button>
            <Button variant="contained" onClick={() => handleSave(data)}>保存</Button>
        </Stack>
      )}
    </Box>
  );
};

export default BasicInfoSection;