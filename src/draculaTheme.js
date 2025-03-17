import { createTheme } from '@mui/material/styles';

const draculaTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#BD93F9',
    },
    secondary: {
      main: '#F8F8F2',
    },
    background: {
      default: '#282A36',
      paper: '#282A36',
    },
    text: {
      primary: '#F8F8F2',
      secondary: '#F8F8F2',
    },
  },
});

export default draculaTheme;
