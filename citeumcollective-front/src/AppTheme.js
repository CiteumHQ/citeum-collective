export default {
  fontFamily: 'Roboto, sans-serif',
  palette: {
    type: 'dark',
    text: { secondary: 'rgba(255, 255, 255, 0.5)' },
    primary: { main: '#5f7d8a' },
    secondary: { main: '#f44336' },
    background: {
      paper: '#323232',
      default: '#37474f',
    },
    divider: 'rgba(255, 255, 255, 0.2)',
  },
  typography: {
    useNextVariants: true,
    body2: {
      fontSize: '0.8rem',
    },
    body1: {
      fontSize: '0.9rem',
    },
    h2: {
      margin: 0,
      padding: 0,
      color: '#ffffff',
      fontWeight: 300,
      fontSize: 20,
      textTransform: 'none',
    },
    h5: {
      color: '#ffffff',
      fontWeight: 300,
      fontSize: 20,
      textTransform: 'none',
    },
  },
};
