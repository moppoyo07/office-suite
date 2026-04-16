// src/features/settings/ActivityTemplateEditor.jsx
// 活動テンプレ（問合せ・見学・体験）の編集パネル
// SupportSettingsPageのタブから呼ばれる

import { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, TextField, Button, IconButton, Stack,
  Select, MenuItem, FormControl, InputLabel, CircularProgress, Alert,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import RestoreIcon from '@mui/icons-material/Restore';
import { useTenant } from '../../context/TenantContext';
import { useActivityTemplates } from '../../hooks/useActivityTemplates';
import {
  ACTIVITY_TEMPLATE_TYPES,
  TEMPLATE_TYPE_LABELS,
  DEFAULT_ACTIVITY_TEMPLATES,
} from '../../constants/activityTemplates';

export default function ActivityTemplateEditor() {
  const { activeCompanyId } = useTenant();
  const { templates, loading, save } = useActivityTemplates(activeCompanyId);

  const [selectedType, setSelectedType] = useState('inquiry');
  const [checklist, setChecklist] = useState([]);
  const [aiPrompt, setAiPrompt] = useState('');
  const [newItem, setNewItem] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // 種別切り替え or ロード完了時にフォームを更新
  useEffect(() => {
    if (!templates) return;
    const t = templates[selectedType];
    if (t) {
      setChecklist(t.checklist || []);
      setAiPrompt(t.aiPrompt || '');
    }
  }, [templates, selectedType]);

  const handleAddItem = () => {
    const trimmed = newItem.trim();
    if (!trimmed || checklist.includes(trimmed)) return;
    setChecklist(prev => [...prev, trimmed]);
    setNewItem('');
  };

  const handleRemoveItem = (index) => {
    setChecklist(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpdateItem = (index, value) => {
    setChecklist(prev => prev.map((v, i) => i === index ? value : v));
  };

  const handleMoveItem = (index, direction) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= checklist.length) return;
    setChecklist(prev => {
      const arr = [...prev];
      [arr[index], arr[newIndex]] = [arr[newIndex], arr[index]];
      return arr;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage({ type: '', text: '' });
    try {
      await save(selectedType, { checklist, aiPrompt });
      setMessage({ type: 'success', text: `${TEMPLATE_TYPE_LABELS[selectedType]}のテンプレを保存しました` });
    } catch (err) {
      console.error('保存エラー:', err);
      setMessage({ type: 'error', text: '保存に失敗しました' });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (!window.confirm(`${TEMPLATE_TYPE_LABELS[selectedType]}のテンプレをデフォルトに戻しますか？（保存するまで反映されません）`)) return;
    const def = DEFAULT_ACTIVITY_TEMPLATES[selectedType];
    setChecklist([...def.checklist]);
    setAiPrompt(def.aiPrompt);
  };

  if (loading) {
    return <Box sx={{ textAlign: 'center', py: 4 }}><CircularProgress /></Box>;
  }

  if (!activeCompanyId) {
    return <Alert severity="warning">事業所が選択されていません</Alert>;
  }

  return (
    <Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        問合せ・見学・体験の各場面で、スタッフが「何を聞けばいいか」のチェックリストと、
        録音要約をAIに依頼する時のプロンプトを編集できます。
      </Typography>

      {message.text && (
        <Alert severity={message.type} sx={{ mb: 2 }} onClose={() => setMessage({ type: '', text: '' })}>
          {message.text}
        </Alert>
      )}

      {/* 種別切り替え */}
      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>種別</InputLabel>
          <Select
            value={selectedType}
            label="種別"
            onChange={(e) => setSelectedType(e.target.value)}
          >
            {ACTIVITY_TEMPLATE_TYPES.map(type => (
              <MenuItem key={type} value={type}>{TEMPLATE_TYPE_LABELS[type]}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <Button
          variant="outlined"
          startIcon={<RestoreIcon />}
          onClick={handleReset}
          size="small"
        >
          デフォルトに戻す
        </Button>

        <Box sx={{ flexGrow: 1 }} />

        <Button
          variant="contained"
          color="primary"
          startIcon={<SaveIcon />}
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? '保存中...' : 'このテンプレを保存'}
        </Button>
      </Stack>

      {/* チェックリスト編集 */}
      <Paper sx={{ p: 2, mb: 3, bgcolor: 'rgba(30, 41, 59, 0.5)' }}>
        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
          📋 会話中のチェックリスト
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
          スタッフが会話中に「聞き忘れ防止」として使うリスト。上下の順番で表示されます。
        </Typography>

        <Stack spacing={1} sx={{ mb: 2 }}>
          {checklist.map((item, index) => (
            <Stack key={index} direction="row" spacing={1} alignItems="center">
              <Typography variant="caption" sx={{ minWidth: 28, color: 'text.secondary' }}>
                {index + 1}.
              </Typography>
              <TextField
                size="small"
                value={item}
                onChange={(e) => handleUpdateItem(index, e.target.value)}
                fullWidth
              />
              <IconButton size="small" onClick={() => handleMoveItem(index, -1)} disabled={index === 0}>
                ↑
              </IconButton>
              <IconButton size="small" onClick={() => handleMoveItem(index, 1)} disabled={index === checklist.length - 1}>
                ↓
              </IconButton>
              <IconButton size="small" onClick={() => handleRemoveItem(index)} color="error">
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Stack>
          ))}
          {checklist.length === 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
              項目がありません
            </Typography>
          )}
        </Stack>

        <Stack direction="row" spacing={1}>
          <TextField
            size="small"
            placeholder="新しい項目を追加…"
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddItem(); } }}
            fullWidth
          />
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddItem}
            disabled={!newItem.trim()}
          >
            追加
          </Button>
        </Stack>
      </Paper>

      {/* AIプロンプト編集 */}
      <Paper sx={{ p: 2, bgcolor: 'rgba(30, 41, 59, 0.5)' }}>
        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
          🤖 AI要約用プロンプト（NotebookLM等で使用）
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
          録音の要約をAIに依頼する時のフォーマット指定文。活動記録画面からワンクリックでコピーできます。
        </Typography>

        <TextField
          multiline
          minRows={10}
          maxRows={20}
          value={aiPrompt}
          onChange={(e) => setAiPrompt(e.target.value)}
          fullWidth
          placeholder="以下の録音内容を要約してください。&#10;&#10;【フォーマット】&#10;1. ..."
          sx={{
            fontFamily: 'monospace',
            '& textarea': { fontFamily: 'inherit', fontSize: '0.9rem', lineHeight: 1.6 },
          }}
        />
      </Paper>
    </Box>
  );
}
