export default {
  fontFamily: 'Roboto, sans-serif',
  palette: {
    type: 'dark',
    text: { secondary: 'rgba(255, 255, 255, 0.5)' },
    primary: { main: '#90a4ae' },
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
    h1: {
      margin: 0,
      padding: 0,
      color: '#ffffff',
      fontWeight: 300,
      fontSize: 25,
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
    h3: {
      margin: 0,
      padding: 0,
      color: '#90a4ae',
      fontWeight: 300,
      fontSize: 18,
      marginBottom: 15,
    },
    h4: {
      color: '#ffffff',
      fontWeight: 300,
      fontSize: 16,
      textTransform: 'none',
      marginBottom: 5,
    },
    h5: {
      color: '#ffffff',
      fontWeight: 300,
      fontSize: 20,
      textTransform: 'none',
    },
  },
};
