import React from 'react';
import { Modal, Backdrop, Fade } from '@mui/material';
import { styled, keyframes } from '@mui/system';

const inkBleedAnimation = keyframes`
  0% {
    background-color: #fff;
  }
  50% {
    background-color: #000;
  }
  100% {
    background-color: #fff;
  }
`;

const StyledModal = styled(Modal)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}));

const StyledPaper = styled('div')(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  border: '2px solid #000',
  boxShadow: theme.shadows[5],
  padding: theme.spacing(2, 4, 3),
}));

export default function InkBleedModal({ isVisible, onClose, children }) {
  return (
    <StyledModal
      open={isVisible}
      onClose={onClose}
      closeAfterTransition
      BackdropComponent={Backdrop}
      BackdropProps={{
        timeout: 500,
      }}
    >
      <Fade in={isVisible}>
        <StyledPaper>
          {children}
        </StyledPaper>
      </Fade>
    </StyledModal>
  );
}
