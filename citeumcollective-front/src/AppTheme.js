export default {
  fontFamily: 'Roboto, sans-serif',
  palette: {
    type: 'dark',
    text: { secondary: 'rgba(255, 255, 255, 0.5)' },
    primary: { main: '#f44336' },
    secondary: { main: '#f44336' },
    background: {
      paper: '#22353e',
      default: '#162026',
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
      fontSize: 30,
      textTransform: 'uppercase',
      letterSpacing: '0.3em',
    },
    h5: {
      color: '#ffffff',
      fontWeight: 300,
      fontSize: 20,
      textTransform: 'none',
    },
  },
};
