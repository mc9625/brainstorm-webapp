import React from 'react';
import { Box, Typography } from '@mui/material';
import { styled } from '@mui/system';
import stormGif from '../images/thestorm.gif';


const SplashScreen = () => {
  const Image = styled('img')({
    width: 450,
    height: 450,
    objectFit: 'cover',
    borderRadius: '50%',
  });
  console.log('SplashScreen');
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '100vh',
        backgroundColor: '#000000',
        color: '#ffffff',
      }}
    >
      <Typography variant="h4" align="center" style={{ paddingTop: '20px' }}>
        Brainstorming
      </Typography>
      <Typography variant="h6" align="center" style={{ paddingTop: '40px' }}>
        Loading...
      </Typography>

      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
        }}
      >
        <Image src={stormGif} alt="Loading..." />
      </Box>

      <Typography variant="body1" align="center" style={{ paddingBottom: '20px' }}>
        Credits: NuvolaProject
      </Typography>
    </Box>
  );
};

export default SplashScreen;
