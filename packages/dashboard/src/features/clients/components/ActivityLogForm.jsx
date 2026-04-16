import { useState, useEffect } from 'react';
import {
  TextField, Button, Stack, Select, MenuItem, FormControl, InputLabel, Divider,
  Typography, Paper, Checkbox, FormControlLabel, Box, Tooltip, Snackbar,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { useTenant } from '../../../context/TenantContext';
import { fetchActivityTemplate } from '../../../hooks/useActivityTemplates';
import { ACTIVITY_TEMPLATE_TYPES, TEMPLATE_TYPE_LABELS } from '../../../constants/activityTemplates';

const ActivityLogForm = ({ initialData, initialType, onSubmit, onCancel, isSaving }) => {
  const { activeCompanyId } = useTenant();

  // 初期値がない場合は initialType があればそれを、なければ 'meeting_office' をデフォルト
  const [type, setType] = useState(initialData?.type || initialType || 'meeting_office');
  const [content, setContent] = useState(initialData?.content || '');

  // テンプレ（問合せ・見学・体験用）
  const [template, setTemplate] = useState(null);
  const [loadingTemplate, setLoadingTemplate] = useState(false);
  const [checkedItems, setCheckedItems] = useState({});
  const [snackbar, setSnackbar] = useState({ open: false, message: '' });

  const isTemplateType = ACTIVITY_TEMPLATE_TYPES.includes(type);

  useEffect(() => {
    if (initialData) {
      setType(initialData.type);
      setContent(initialData.content);
    }
  }, [initialData]);

  // タイプが テンプレ対象 に変わったらテンプレをロード
  useEffect(() => {
    let cancelled = false;
    if (!isTemplateType || !activeCompanyId) {
      setTemplate(null);
      setCheckedItems({});
      return;
    }
    setLoadingTemplate(true);
    fetchActivityTemplate(activeCompanyId, type)
      .then(t => {
        if (cancelled) return;
        setTemplate(t);
        setCheckedItems({});
      })
      .catch(err => {
        console.error('テンプレ取得失敗:', err);
      })
      .finally(() => {
        if (!cancelled) setLoadingTemplate(false);
      });
    return () => { cancelled = true; };
  }, [type, activeCompanyId, isTemplateType]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 親コンポーネントの処理結果を受け取る
    const result = await onSubmit({
      id: initialData?.id,
      type,
      content,
    });

    // ★重要修正: 保存に成功した場合のみ、フォームをリセットする
    if (result && result.success && !initialData) {
      setType('meeting_office');
      setContent('');
      setCheckedItems({});
    }
  };

  const handleCopyPrompt = async () => {
    if (!template?.aiPrompt) return;
    try {
      await navigator.clipboard.writeText(template.aiPrompt);
      setSnackbar({ open: true, message: 'AIプロンプトをコピーしました' });
    } catch (err) {
      console.error('コピー失敗:', err);
      setSnackbar({ open: true, message: 'コピーに失敗しました' });
    }
  };

  const handleToggleCheck = (index) => {
    setCheckedItems(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const isSubmitDisabled = !type || !content || isSaving;

  return (
    <form onSubmit={handleSubmit}>
      <Stack spacing={2}>
        <FormControl fullWidth>
          <InputLabel id="log-type-label">活動種別</InputLabel>
          <Select
            labelId="log-type-label"
            value={type}
            label="活動種別"
            onChange={(e) => setType(e.target.value)}
          >
            {/* ★ご要望の項目を追加★ */}
            <MenuItem value="inquiry" sx={{ color: '#5cf063ff', fontWeight: 'bold' }}>問合せ</MenuItem>
            <MenuItem value="tour" sx={{ color: '#0288d1', fontWeight: 'bold' }}>見学</MenuItem>
            <MenuItem value="trial" sx={{ color: '#0288d1', fontWeight: 'bold' }}>体験利用</MenuItem>
            <MenuItem value="contract_prep" sx={{ color: '#ed6c02', fontWeight: 'bold' }}>利用準備</MenuItem>
            <MenuItem value="retention_support" sx={{ color: '#9c27b0', fontWeight: 'bold' }}>定着支援</MenuItem>

            <Divider />
            <Typography variant="caption" sx={{ pl: 2, py: 0.5, color: 'text.secondary' }}>通常業務</Typography>

            <MenuItem value="meeting_office">面談（事業所内）</MenuItem>
            <MenuItem value="meeting_external">面談（事業所外）</MenuItem>
            <MenuItem value="phone_call">電話連絡</MenuItem>
            <MenuItem value="email">メール連絡</MenuItem>
            <MenuItem value="visit_home">家庭訪問</MenuItem>
            <MenuItem value="visit_company">職場訪問</MenuItem>
            <MenuItem value="accompany">同行支援</MenuItem>
            <MenuItem value="other">その他</MenuItem>
          </Select>
        </FormControl>

        {/* テンプレパネル（問合せ・見学・体験のみ） */}
        {isTemplateType && template && !loadingTemplate && (
          <Paper sx={{ p: 2, bgcolor: 'rgba(6, 182, 212, 0.08)', border: '1px solid rgba(6, 182, 212, 0.3)' }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
              <Typography variant="subtitle2" fontWeight="bold">
                📋 {TEMPLATE_TYPE_LABELS[type]} 聞き出しチェックリスト
              </Typography>
              <Tooltip title="録音→AI要約に使うプロンプトをクリップボードにコピー">
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<AutoAwesomeIcon />}
                  onClick={handleCopyPrompt}
                  disabled={!template.aiPrompt}
                >
                  AIプロンプトをコピー
                </Button>
              </Tooltip>
            </Stack>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
              会話中に聞き忘れ防止として使ってください（保存内容には影響しません）
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
              {(template.checklist || []).map((item, i) => (
                <FormControlLabel
                  key={i}
                  control={
                    <Checkbox
                      size="small"
                      checked={!!checkedItems[i]}
                      onChange={() => handleToggleCheck(i)}
                    />
                  }
                  label={
                    <Typography
                      variant="body2"
                      sx={{
                        textDecoration: checkedItems[i] ? 'line-through' : 'none',
                        color: checkedItems[i] ? 'text.secondary' : 'text.primary',
                      }}
                    >
                      {item}
                    </Typography>
                  }
                />
              ))}
              {(template.checklist || []).length === 0 && (
                <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>
                  チェックリスト項目がありません（設定画面で追加できます）
                </Typography>
              )}
            </Box>
          </Paper>
        )}

        <TextField
          label="活動内容"
          multiline
          minRows={15}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          fullWidth
          required
          placeholder={
            isTemplateType
              ? '録音→NotebookLM要約の結果を貼り付けるか、会話メモを入力してください'
              : '支援の内容や様子を詳しく入力してください'
          }
        />

        <Stack direction="row" justifyContent="flex-end" spacing={1} sx={{ mt: 2 }}>
          <Button onClick={onCancel} disabled={isSaving} size="large">キャンセル</Button>
          <Button type="submit" variant="contained" disabled={isSubmitDisabled} size="large">
            {isSaving ? '保存中...' : (initialData ? '更新する' : '保存する')}
          </Button>
        </Stack>
      </Stack>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={2500}
        onClose={() => setSnackbar({ open: false, message: '' })}
        message={snackbar.message}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </form>
  );
};

export default ActivityLogForm;
