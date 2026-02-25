import { createTheme } from '@mui/material/styles';
import { blue, cyan, green, red, grey } from '@mui/material/colors';

const PRIMARY_COLOR = '#00B8D4';
const SUCCESS_COLOR = '#00E676';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: PRIMARY_COLOR },
    secondary: { main: '#F50057' },
    background: {
      default: '#121212',
      paper: 'rgba(30, 41, 59, 0.8)',
    },
    success: { main: SUCCESS_COLOR },
    error: { main: '#FF1744' },
    text: {
      primary: '#FFFFFF',
      secondary: grey[500],
    },
  },
  typography: {
    fontFamily: '"Inter", "Noto Sans JP", sans-serif',
    h4: {
      fontWeight: 700,
      color: '#FFFFFF',
      textShadow: `0 0 10px ${PRIMARY_COLOR}`,
    },
  },
  // --- components: { ... } は、ここには、もう、ない ---
});

export default theme;