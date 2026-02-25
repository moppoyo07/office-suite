import { useNavigate } from 'react-router-dom';
import { Typography, Button, Box } from '@mui/material';
import { useAuth } from './context/AuthContext.jsx';

function LoginPage() {
  const { loginWithGoogle } = useAuth();
  const navigate = useNavigate(); // useNavigateフックを呼び出す

  const handleLogin = async () => {
    try {
      await loginWithGoogle();
      // ★★★ 失われた一行を、ここに追加します ★★★
      navigate('/'); // ログイン成功後、ダッシュボードのトップページに強制遷移
    } catch (error) {
      console.error("ログイン失敗:", error);
      alert("ログインに失敗しました。");
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', background: 'linear-gradient(90deg, #8b5cf6, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
        Manecto
      </Typography>
      <Button variant="contained" onClick={handleLogin}>
        Googleでログイン
      </Button>
    </Box>
  );
}

export default LoginPage;