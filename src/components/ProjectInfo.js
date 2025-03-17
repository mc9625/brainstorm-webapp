import React from 'react';
import { Box, Typography, Container } from '@mui/material';

const ProjectInfo = () => {
  return (
    <Container>
      <Box my={4}>
        <Typography variant="h4" component="h1" gutterBottom>
          Informazioni sul Progetto
        </Typography>
        <Typography variant="body1">
          Questo è un progetto per la creazione di un'app di chat. È stato creato con React e MUI e utilizza una combinazione di componenti funzionali e hooks per gestire lo stato e gli effetti collaterali.
        </Typography>
        <Typography variant="body1">
          Le funzionalità principali dell'applicazione includono la visualizzazione di una lista di conversazioni, la possibilità di selezionare una conversazione per visualizzare i dettagli e la possibilità di inviare nuovi messaggi all'interno di una conversazione.
        </Typography>
        // Include other information you want to display
      </Box>
    </Container>
  );
}

export default ProjectInfo;
