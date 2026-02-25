import React from 'react';
import { Grid, Stack, TextField, Typography, Box, Button, IconButton, MenuItem, Divider, Paper, InputAdornment, Chip } from '@mui/material';
import { format } from 'date-fns';
import DeleteIcon from '@mui/icons-material/Delete';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';

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
    if (setEditedData) {
      setEditedData({ ...data, commuteRoutes: [...currentRoutes, newRoute] });
    }
  };

  // 経路を削除
  const handleRemoveRoute = (index) => {
    const currentRoutes = data.commuteRoutes || [];
    const newRoutes = currentRoutes.filter((_, i) => i !== index);
    if (setEditedData) {
      setEditedData({ ...data, commuteRoutes: newRoutes });
    }
  };

  // 経路の中身を変更
  const handleRouteChange = (index, field, value) => {
    const currentRoutes = [...(data.commuteRoutes || [])];
    currentRoutes[index] = { ...currentRoutes[index], [field]: value };
    if (setEditedData) {
      setEditedData({ ...data, commuteRoutes: currentRoutes });
    }
  };

  // 往復日額の合計計算（定期分は除く）
  const calculateDailyTotal = () => {
    const routes = data?.commuteRoutes || [];
    // 支払方法が 'daily' または未設定（デフォルトdaily）のものだけ合計
    const dailyRoutes = routes.filter(r => !r.paymentMethod || r.paymentMethod === 'daily');
    const oneWayTotal = dailyRoutes.reduce((sum, r) => sum + Number(r.costDiscounted || r.cost || 0), 0);
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
          <Grid size={{ xs: 12, sm: 6 }}>
            <Typography variant="caption" color="text.secondary">氏名</Typography>
            <Typography>{data?.name || '未設定'}</Typography>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Typography variant="caption" color="text.secondary">フリガナ</Typography>
            <Typography>{data?.nameKana || '未設定'}</Typography>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Typography variant="caption" color="text.secondary">生年月日</Typography>
            <Typography>{formatDate(data?.birthDate)}</Typography>
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <Typography variant="caption" color="text.secondary">性別</Typography>
            <Typography>{data?.gender || '未設定'}</Typography>
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <Typography variant="caption" color="text.secondary">血液型</Typography>
            <Typography>{data?.bloodType || '未設定'}</Typography>
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <Typography variant="caption" color="text.secondary">MBTI診断</Typography>
            <Typography>{data?.mbtiType || '未設定'}</Typography>
          </Grid>
          <Grid size={12}>
            <Typography variant="caption" color="text.secondary">住所</Typography>
            <Typography>{(data?.postalCode ? `〒${data.postalCode} ` : '') + (data?.address || '未設定')}</Typography>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Typography variant="caption" color="text.secondary">電話番号</Typography>
            <Typography>{data?.phone || '未設定'}</Typography>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Typography variant="caption" color="text.secondary">携帯電話</Typography>
            <Typography>{data?.mobilePhone || '未設定'}</Typography>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Typography variant="caption" color="text.secondary">月次利用上限</Typography>
            <Typography sx={{ color: data?.monthlyLimit ? '#10b981' : '#94a3b8' }}>
              {data?.monthlyLimit ? `${data.monthlyLimit}日` : '未設定（デフォルト: 月-8日）'}
            </Typography>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Typography variant="caption" color="text.secondary">PINコード（セルフチェックイン用）</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
              {data?.pin ? (
                <>
                  <LockIcon sx={{ fontSize: 18, color: '#10b981' }} />
                  <Chip label="設定済み" size="small" color="success" variant="outlined" />
                </>
              ) : (
                <>
                  <LockOpenIcon sx={{ fontSize: 18, color: '#f59e0b' }} />
                  <Chip label="未設定" size="small" color="warning" variant="outlined" />
                </>
              )}
            </Box>
          </Grid>
        </Grid>
      </Box>

      {/* 通所経路・助成設定 */}
      <Box>
        <Typography variant="subtitle1" gutterBottom sx={{ borderLeft: '4px solid #ed6c02', pl: 1, mb: 2 }}>
          通所経路・助成金設定
        </Typography>

        {/* 経路リスト表示 */}
        <Stack spacing={2} sx={{ mb: 3 }}>
          {(data?.commuteRoutes && data.commuteRoutes.length > 0) ? (
            data.commuteRoutes.map((route, index) => (
              <Paper key={index} variant="outlined" sx={{ p: 2, bgcolor: 'rgba(255, 255, 255, 0.05)' }}>
                <Grid container spacing={1}>
                  <Grid size={{ xs: 12, sm: 3 }}>
                    <Typography variant="caption" color="text.secondary">手段・会社</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip
                        label={route.paymentMethod === 'pass' ? '定期' : '日額'}
                        size="small"
                        color={route.paymentMethod === 'pass' ? 'secondary' : 'default'}
                        variant="outlined"
                        sx={{ height: 20, fontSize: '0.7rem' }}
                      />
                      <Typography variant="body2" fontWeight="bold">
                        {TRANSPORT_TYPES.find(t => t.value === route.type)?.label}
                        {route.company && ` (${route.company})`}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <Typography variant="caption" color="text.secondary">区間</Typography>
                    <Typography variant="body2">{route.from} ～ {route.to}</Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 3 }}>
                    <Typography variant="caption" color="text.secondary">詳細・割引</Typography>
                    <Typography variant="body2">{route.note || '-'}</Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 2 }} sx={{ textAlign: 'right' }}>
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
        <Paper variant="outlined" sx={{ p: 2, bgcolor: 'rgba(255, 255, 255, 0.05)', borderRadius: 2 }}>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, sm: 3 }}>
              {/* Removed Global Payment Type Display */}
            </Grid>
            <Grid size={{ xs: 12, sm: 3 }}>
              <Typography variant="caption" color="text.secondary">往復日額 (実費合計)</Typography>
              <Typography variant="h6">¥ {calculateDailyTotal().toLocaleString()}</Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 3 }}>
              <Typography variant="caption" color="text.secondary">1ヶ月定期代</Typography>
              <Typography variant="h6">
                {data?.commuteMonthlyPass ? `¥ ${Number(data.commuteMonthlyPass).toLocaleString()}` : '-'}
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 3 }}>
              <Typography variant="caption" color="text.secondary">行政認定単価</Typography>
              <Typography variant="h6">
                {data?.commuteAdminDayCost ? `¥ ${Number(data.commuteAdminDayCost).toLocaleString()}` : '-'}
              </Typography>
            </Grid>
          </Grid>
        </Paper>
      </Box>

      {/* 日程管理 */}
      <Box>
        <Typography variant="subtitle1" gutterBottom sx={{ borderLeft: '4px solid #8b5cf6', pl: 1, mb: 2 }}>
          日程管理
        </Typography>
        <Paper variant="outlined" sx={{ p: 2, bgcolor: 'rgba(139, 92, 246, 0.05)', borderRadius: 2 }}>
          <Grid container spacing={2} rowSpacing={2}>
            {/* 入所前フェーズ */}
            <Grid size={{ xs: 6, sm: 3 }}>
              <Typography variant="caption" color="text.secondary">問合せ日</Typography>
              <Typography>{formatDate(data?.createdAt) || '未設定'}</Typography>
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <Typography variant="caption" color="text.secondary">見学日</Typography>
              <Typography>{formatDate(data?.interviewDate) || '未設定'}</Typography>
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <Typography variant="caption" color="text.secondary">体験開始日</Typography>
              <Typography>{formatDate(data?.trialStartDate) || '未設定'}</Typography>
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <Typography variant="caption" color="text.secondary">契約日</Typography>
              <Typography>{formatDate(data?.contractDate) || '未設定'}</Typography>
            </Grid>

            {/* 利用・就職フェーズ */}
            <Grid size={12}><Divider sx={{ my: 1 }} /></Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <Typography variant="caption" color="text.secondary">利用開始日</Typography>
              <Typography sx={{ color: data?.serviceStartDate ? '#10b981' : 'inherit' }}>
                {formatDate(data?.serviceStartDate) || '未設定'}
              </Typography>
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <Typography variant="caption" color="text.secondary">就職日</Typography>
              <Typography sx={{ color: data?.employmentDate ? '#f59e0b' : 'inherit' }}>
                {formatDate(data?.employmentDate) || '未設定'}
              </Typography>
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <Typography variant="caption" color="text.secondary">就職先企業名</Typography>
              <Typography>{data?.employmentCompany || '未設定'}</Typography>
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <Typography variant="caption" color="text.secondary">離職日</Typography>
              <Typography sx={{ color: data?.retirementDate ? '#ef4444' : 'inherit' }}>
                {formatDate(data?.retirementDate) || '未設定'}
              </Typography>
            </Grid>

            {/* 定着支援フェーズ */}
            <Grid size={12}><Divider sx={{ my: 1 }} /></Grid>
            <Grid size={12}>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                定着支援面談予定
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 4, sm: 2 }}>
                  <Typography variant="caption" color="#06b6d4">1ヶ月目</Typography>
                  <Typography variant="body2">{formatDate(data?.followUp1MonthDate) || '-'}</Typography>
                </Grid>
                <Grid size={{ xs: 4, sm: 2 }}>
                  <Typography variant="caption" color="#06b6d4">2ヶ月目</Typography>
                  <Typography variant="body2">{formatDate(data?.followUp2MonthDate) || '-'}</Typography>
                </Grid>
                <Grid size={{ xs: 4, sm: 2 }}>
                  <Typography variant="caption" color="#06b6d4">3ヶ月目</Typography>
                  <Typography variant="body2">{formatDate(data?.followUp3MonthDate) || '-'}</Typography>
                </Grid>
                <Grid size={{ xs: 4, sm: 2 }}>
                  <Typography variant="caption" color="#06b6d4">4ヶ月目</Typography>
                  <Typography variant="body2">{formatDate(data?.followUp4MonthDate) || '-'}</Typography>
                </Grid>
                <Grid size={{ xs: 4, sm: 2 }}>
                  <Typography variant="caption" color="#06b6d4">5ヶ月目</Typography>
                  <Typography variant="body2">{formatDate(data?.followUp5MonthDate) || '-'}</Typography>
                </Grid>
                <Grid size={{ xs: 4, sm: 2 }}>
                  <Typography variant="caption" color="#06b6d4">6ヶ月目</Typography>
                  <Typography variant="body2">{formatDate(data?.followUp6MonthDate) || '-'}</Typography>
                </Grid>
              </Grid>
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
      <Grid size={{ xs: 12, md: 6 }}>
        <Typography variant="subtitle1" gutterBottom sx={{ borderLeft: '4px solid #1976d2', pl: 1, mb: 2 }}>基本情報</Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}><TextField size="small" name="name" label="氏名" value={data?.name || ''} onChange={handleChange} fullWidth /></Grid>
          <Grid size={{ xs: 12, sm: 6 }}><TextField size="small" name="nameKana" label="フリガナ" value={data?.nameKana || ''} onChange={handleChange} fullWidth /></Grid>
          <Grid size={{ xs: 12, sm: 6 }}><TextField size="small" name="birthDate" label="生年月日" type="date" value={data?.birthDate ? format(new Date(data.birthDate.seconds ? data.birthDate.toDate() : data.birthDate), 'yyyy-MM-dd') : ''} onChange={handleChange} fullWidth InputLabelProps={{ shrink: true }} /></Grid>
          <Grid size={{ xs: 12, sm: 3 }}><TextField size="small" name="gender" label="性別" value={data?.gender || ''} onChange={handleChange} fullWidth /></Grid>
          <Grid size={{ xs: 12, sm: 3 }}><TextField size="small" name="bloodType" label="血液型" value={data?.bloodType || ''} onChange={handleChange} fullWidth /></Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              select
              size="small"
              name="mbtiType"
              label="MBTI診断"
              value={data?.mbtiType || ''}
              onChange={handleChange}
              fullWidth
            >
              <MenuItem value="">未設定</MenuItem>
              <MenuItem value="INTJ">INTJ - 建築家</MenuItem>
              <MenuItem value="INTP">INTP - 論理学者</MenuItem>
              <MenuItem value="ENTJ">ENTJ - 指揮官</MenuItem>
              <MenuItem value="ENTP">ENTP - 討論者</MenuItem>
              <MenuItem value="INFJ">INFJ - 提唱者</MenuItem>
              <MenuItem value="INFP">INFP - 仲介者</MenuItem>
              <MenuItem value="ENFJ">ENFJ - 主人公</MenuItem>
              <MenuItem value="ENFP">ENFP - 運動家</MenuItem>
              <MenuItem value="ISTJ">ISTJ - 管理者</MenuItem>
              <MenuItem value="ISFJ">ISFJ - 擁護者</MenuItem>
              <MenuItem value="ESTJ">ESTJ - 幹部</MenuItem>
              <MenuItem value="ESFJ">ESFJ - 領事</MenuItem>
              <MenuItem value="ISTP">ISTP - 巨匠</MenuItem>
              <MenuItem value="ISFP">ISFP - 冒険家</MenuItem>
              <MenuItem value="ESTP">ESTP - 起業家</MenuItem>
              <MenuItem value="ESFP">ESFP - エンターテイナー</MenuItem>
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}><TextField size="small" name="postalCode" label="郵便番号" value={data?.postalCode || ''} onChange={handleChange} fullWidth /></Grid>
          <Grid size={{ xs: 12, sm: 8 }}><TextField size="small" name="address" label="住所" value={data?.address || ''} onChange={handleChange} fullWidth /></Grid>
          <Grid size={{ xs: 12, sm: 6 }}><TextField size="small" name="phone" label="電話番号" value={data?.phone || ''} onChange={handleChange} fullWidth /></Grid>
          <Grid size={{ xs: 12, sm: 6 }}><TextField size="small" name="mobilePhone" label="携帯電話" value={data?.mobilePhone || ''} onChange={handleChange} fullWidth /></Grid>
          <Grid size={12}><TextField size="small" name="email" label="メールアドレス" type="email" value={data?.email || ''} onChange={handleChange} fullWidth /></Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              size="small"
              name="monthlyLimit"
              label="月次利用上限（日）"
              type="number"
              value={data?.monthlyLimit || ''}
              onChange={handleChange}
              fullWidth
              helperText="空欄の場合、月-8日がデフォルト"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              size="small"
              name="pin"
              label="PINコード"
              value={data?.pin || ''}
              onChange={(e) => {
                // 数字のみ、最大4桁に制限
                const value = e.target.value.replace(/[^0-9]/g, '').slice(0, 4);
                handleChange({ target: { name: 'pin', value } });
              }}
              fullWidth
              placeholder="4桁の数字"
              helperText="セルフチェックイン用の認証コード（4桁）"
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon sx={{ fontSize: 18, color: data?.pin?.length === 4 ? '#10b981' : '#94a3b8' }} />
                    </InputAdornment>
                  ),
                },
              }}
              error={data?.pin && data.pin.length !== 4}
            />
          </Grid>
        </Grid>
      </Grid>

      {/* 右カラム：通所経路 */}
      <Grid size={{ xs: 12, md: 6 }}>
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
                <Grid size={6}>
                  <TextField select fullWidth size="small" label="種別" value={route.type} onChange={(e) => handleRouteChange(index, 'type', e.target.value)}>
                    {TRANSPORT_TYPES.map(t => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
                  </TextField>
                </Grid>
                <Grid size={6}>
                  <TextField
                    select
                    fullWidth
                    size="small"
                    label="支給方式"
                    value={route.paymentMethod || 'daily'}
                    onChange={(e) => handleRouteChange(index, 'paymentMethod', e.target.value)}
                  >
                    <MenuItem value="daily">日額 (片道×2)</MenuItem>
                    <MenuItem value="pass">定期 (定期代に含む)</MenuItem>
                  </TextField>
                </Grid>
                <Grid size={6}>
                  <TextField fullWidth size="small" label="会社・路線名" placeholder="例:広島バス" value={route.company} onChange={(e) => handleRouteChange(index, 'company', e.target.value)} />
                </Grid>
                <Grid size={6}>
                  <TextField fullWidth size="small" label="出発" value={route.from} onChange={(e) => handleRouteChange(index, 'from', e.target.value)} />
                </Grid>
                <Grid size={6}>
                  <TextField fullWidth size="small" label="到着" value={route.to} onChange={(e) => handleRouteChange(index, 'to', e.target.value)} />
                </Grid>
                <Grid size={6}>
                  <TextField fullWidth size="small" type="number" label="通常運賃(片道)" value={route.cost} onChange={(e) => handleRouteChange(index, 'cost', e.target.value)} />
                </Grid>
                <Grid size={6}>
                  <TextField fullWidth size="small" type="number" label="割引・適用運賃(片道)" placeholder="同額なら空欄" value={route.costDiscounted} onChange={(e) => handleRouteChange(index, 'costDiscounted', e.target.value)} />
                </Grid>
                <Grid size={12}>
                  <TextField fullWidth size="small" label="備考・割引詳細" placeholder="例:障害者割引あり、ICOCA使用" value={route.note} onChange={(e) => handleRouteChange(index, 'note', e.target.value)} />
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
            {/* Payment Type moved to per-route, keeping Month Pass global */}
            <Grid size={6}>
              <TextField
                fullWidth
                size="small"
                type="number"
                name="commuteMonthlyPass"
                label="1ヶ月定期代"
                value={data?.commuteMonthlyPass || ''}
                onChange={handleChange}
                helperText="定期支給の経路がある場合に使用"
              />
            </Grid>
            <Grid size={6}>
              <TextField
                fullWidth
                size="small"
                type="number"
                name="commuteAdminDayCost"
                label="行政決定単価(日額)"
                value={data?.commuteAdminDayCost || ''}
                onChange={handleChange}
                helperText="廿日市市など固定単価の場合"
              />
            </Grid>
          </Grid>
        </Stack>
      </Grid>

      {/* 日程管理 編集 */}
      <Grid size={12}>
        <Typography variant="subtitle1" gutterBottom sx={{ borderLeft: '4px solid #8b5cf6', pl: 1, mb: 2, mt: 2 }}>
          日程管理
        </Typography>
        <Grid container spacing={2}>
          {/* 入所前フェーズ */}
          <Grid size={{ xs: 6, sm: 3 }}>
            <TextField size="small" name="interviewDate" label="見学日" type="date" value={data?.interviewDate ? format(new Date(data.interviewDate.seconds ? data.interviewDate.toDate() : data.interviewDate), 'yyyy-MM-dd') : ''} onChange={handleChange} fullWidth InputLabelProps={{ shrink: true }} />
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <TextField size="small" name="trialStartDate" label="体験開始日" type="date" value={data?.trialStartDate ? format(new Date(data.trialStartDate.seconds ? data.trialStartDate.toDate() : data.trialStartDate), 'yyyy-MM-dd') : ''} onChange={handleChange} fullWidth InputLabelProps={{ shrink: true }} />
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <TextField size="small" name="contractDate" label="契約日" type="date" value={data?.contractDate ? format(new Date(data.contractDate.seconds ? data.contractDate.toDate() : data.contractDate), 'yyyy-MM-dd') : ''} onChange={handleChange} fullWidth InputLabelProps={{ shrink: true }} />
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <TextField size="small" name="serviceStartDate" label="利用開始日" type="date" value={data?.serviceStartDate ? format(new Date(data.serviceStartDate.seconds ? data.serviceStartDate.toDate() : data.serviceStartDate), 'yyyy-MM-dd') : ''} onChange={handleChange} fullWidth InputLabelProps={{ shrink: true }} />
          </Grid>

          {/* 就職・離職 */}
          <Grid size={{ xs: 6, sm: 3 }}>
            <TextField size="small" name="employmentDate" label="就職日" type="date" value={data?.employmentDate ? format(new Date(data.employmentDate.seconds ? data.employmentDate.toDate() : data.employmentDate), 'yyyy-MM-dd') : ''} onChange={handleChange} fullWidth InputLabelProps={{ shrink: true }} />
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <TextField size="small" name="employmentCompany" label="就職先企業名" value={data?.employmentCompany || ''} onChange={handleChange} fullWidth />
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <TextField size="small" name="retirementDate" label="離職日" type="date" value={data?.retirementDate ? format(new Date(data.retirementDate.seconds ? data.retirementDate.toDate() : data.retirementDate), 'yyyy-MM-dd') : ''} onChange={handleChange} fullWidth InputLabelProps={{ shrink: true }} />
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }} />

          {/* 定着支援面談日 */}
          <Grid size={12}>
            <Typography variant="body2" fontWeight="bold" sx={{ mt: 1, mb: 1 }}>定着支援面談予定</Typography>
          </Grid>
          <Grid size={{ xs: 6, sm: 2 }}>
            <TextField size="small" name="followUp1MonthDate" label="1ヶ月目" type="date" value={data?.followUp1MonthDate ? format(new Date(data.followUp1MonthDate.seconds ? data.followUp1MonthDate.toDate() : data.followUp1MonthDate), 'yyyy-MM-dd') : ''} onChange={handleChange} fullWidth InputLabelProps={{ shrink: true }} />
          </Grid>
          <Grid size={{ xs: 6, sm: 2 }}>
            <TextField size="small" name="followUp2MonthDate" label="2ヶ月目" type="date" value={data?.followUp2MonthDate ? format(new Date(data.followUp2MonthDate.seconds ? data.followUp2MonthDate.toDate() : data.followUp2MonthDate), 'yyyy-MM-dd') : ''} onChange={handleChange} fullWidth InputLabelProps={{ shrink: true }} />
          </Grid>
          <Grid size={{ xs: 6, sm: 2 }}>
            <TextField size="small" name="followUp3MonthDate" label="3ヶ月目" type="date" value={data?.followUp3MonthDate ? format(new Date(data.followUp3MonthDate.seconds ? data.followUp3MonthDate.toDate() : data.followUp3MonthDate), 'yyyy-MM-dd') : ''} onChange={handleChange} fullWidth InputLabelProps={{ shrink: true }} />
          </Grid>
          <Grid size={{ xs: 6, sm: 2 }}>
            <TextField size="small" name="followUp4MonthDate" label="4ヶ月目" type="date" value={data?.followUp4MonthDate ? format(new Date(data.followUp4MonthDate.seconds ? data.followUp4MonthDate.toDate() : data.followUp4MonthDate), 'yyyy-MM-dd') : ''} onChange={handleChange} fullWidth InputLabelProps={{ shrink: true }} />
          </Grid>
          <Grid size={{ xs: 6, sm: 2 }}>
            <TextField size="small" name="followUp5MonthDate" label="5ヶ月目" type="date" value={data?.followUp5MonthDate ? format(new Date(data.followUp5MonthDate.seconds ? data.followUp5MonthDate.toDate() : data.followUp5MonthDate), 'yyyy-MM-dd') : ''} onChange={handleChange} fullWidth InputLabelProps={{ shrink: true }} />
          </Grid>
          <Grid size={{ xs: 6, sm: 2 }}>
            <TextField size="small" name="followUp6MonthDate" label="6ヶ月目" type="date" value={data?.followUp6MonthDate ? format(new Date(data.followUp6MonthDate.seconds ? data.followUp6MonthDate.toDate() : data.followUp6MonthDate), 'yyyy-MM-dd') : ''} onChange={handleChange} fullWidth InputLabelProps={{ shrink: true }} />
          </Grid>
        </Grid>
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