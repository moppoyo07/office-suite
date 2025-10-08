import { Typography } from '@mui/material';
import { useAuth } from '@/features/auth/context/AuthContext.jsx';

function DashboardHome() {
  const { currentUser } = useAuth();
  return (
    <div>
      <Typography variant="h4">
        ようこそ, {currentUser?.displayName} さん！
      </Typography>
      <Typography variant="body1">
        左のメニューから操作を選択してください。
      </Typography>
    </div>
  );
}
export default DashboardHome;