// ClientCreatePage.jsx

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Paper, Typography, TextField, Button, Box, Grid } from '@mui/material';
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/firebase/index.js";

function ClientCreatePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    nameKana: '',
    phone: '', // ★★★ phoneNumber から phone に統一 ★★★
    status: 'inquiry', // 初期ステータス
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('氏名を入力してください。');
      return;
    }
    setLoading(true);
    try {
      // 保存するデータを作成
      const dataToSave = {
        ...formData,
        inquiryDate: serverTimestamp(), // 問い合わせ日
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      // Firestoreの "clients" コレクションに新しいドキュメントを追加
      const docRef = await addDoc(collection(db, "clients"), dataToSave);
      
      console.log("新しい利用者を登録しました。ドキュメントID:", docRef.id);
      alert('新しい利用者を登録しました。');
      navigate('/clients'); // 登録後は利用者一覧ページに遷移

    } catch (error) {
      console.error("登録エラー:", error);
      alert("登録に失敗しました。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        新規利用者の登録
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        最初の問い合わせ内容（氏名・電話番号など）を登録します。詳細は見学アンケートやフェイスシートで入力します。
      </Typography>

      <Box component="form" onSubmit={handleSubmit} noValidate>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              name="name"
              label="氏名"
              variant="outlined"
              fullWidth
              required
              value={formData.name}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              name="nameKana"
              label="氏名（フリガナ）"
              variant="outlined"
              fullWidth
              value={formData.nameKana}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              // ★★★ name属性を "phone" に変更 ★★★
              name="phone" 
              label="電話番号"
              type="tel"
              variant="outlined"
              fullWidth
              // ★★★ valueもformData.phoneを参照 ★★★
              value={formData.phone}
              onChange={handleChange}
            />
          </Grid>
        </Grid>
        <Button
          type="submit"
          variant="contained"
          color="primary"
          disabled={loading}
          sx={{ mt: 3 }}
        >
          {loading ? '登録中...' : 'この内容で登録する'}
        </Button>
      </Box>
    </Paper>
  );
}

export default ClientCreatePage;