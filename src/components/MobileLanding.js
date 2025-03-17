import React, { useState, useEffect } from 'react';
import { Button, Box, Typography, useTheme, useMediaQuery, Link } from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import ChatIcon from '@mui/icons-material/Chat';

const MobileLanding = ({ onEnterChat }) => {
  const [showProjectInfo, setShowProjectInfo] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleProjectInfo = () => {
    setShowProjectInfo(true);
  };

  const handleEnterChat = () => {
    onEnterChat();
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      {!showProjectInfo && (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', justifyContent: 'center' }}>
          <Button variant="contained" color="primary" startIcon={<InfoIcon />} onClick={handleProjectInfo}>
            Info sul Progetto
          </Button>
          <Button variant="contained" color="primary" startIcon={<ChatIcon />} onClick={handleEnterChat}>
            Entra nella Chat
          </Button>
        </Box>
      )}
      {showProjectInfo && (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '20px',
            justifyContent: 'center',
            flex: '1',
            overflowY: 'auto',
            padding: '0 16px',
          }}
        >
          <Typography variant="h4" sx={{ marginBottom: '10px', textAlign: 'center' }}>
            "Brain Storming"
          </Typography>
          <Typography variant="subtitle1" sx={{ marginBottom: '20px', textAlign: 'center' }}>
            stimolatore di pensiero in azione
          </Typography>
          <Box>
            <Typography variant="body1" sx={{ marginBottom: '20px' }}>
              Due Intelligenze/Nuvola, con un’anima digitale e una forma e un linguaggio che rimandano alla natura e allo stesso tempo evocano l’immagine e le dinamiche di un cervello pensante, si fronteggiano in una conversazione simbolica che vuole mettere in relazione dialogante frammenti di ciò che è in rete a proposito di sostenibilità, per scatenare un brainstorming, uno scambio di idee che accenda idee, che
              crei uno spiazzamento fertile in chi le guarda e coinvolga in una riflessione più ampia in cui tutto, tutte e tutti siamo connessi.
            </Typography>
            <Typography variant="body1" sx={{ marginBottom: '20px' }}>
              Le due AI/Nuvole attingono dal cloud, ricombinano elementi di riflessione e mettono in gioco temi come smart cities, climate change, sviluppo sostenibile, conservazione della biodiversità, efficienza energetica, economia circolare, turismo sostenibile, politiche ambientali, urban planning, adattamento al riscaldamento globale, ecc.
            </Typography>
            <Typography variant="body1" sx={{ marginBottom: '20px' }}>
              Un dialogo non un monologo, per mettere le cose in relazione dunque in movimento, non per restituire risposte chiuse ma per far nascere un flusso vivo di pensiero. Questa conversazione nutrita di conversazioni infatti si apre e invita a entrare nel gioco, suggerisce la necessità di un confronto plurale e permanente.
            </Typography>
            <Typography variant="body1" sx={{ marginBottom: '20px' }}>
              Dispositivo ludico, che non si prende sul serio ma che parla di cose molto serie.
            </Typography>
            <Typography variant="body1" sx={{ marginBottom: '20px' }}>
              Osservando le nuvole dialoganti le si vedrà illuminarsi, in un botta e risposta potremo riconoscere quella che parla e quella che ascolta dal punto che si illuminerà in corrispondenza delle aree del cervello coinvolte nell’ascolto, nell’elaborazione del pensiero e nell’azione di parlare.
            </Typography>
            <Typography variant="body1" sx={{ marginBottom: '20px' }}>
              Sarà possibile conoscere il contenuto del brainstorming grazie a un'applicazione ad hoc da cui leggere in tempo reale lo scambio di battute fra le due, sarà anche possibile leggere i report che Chat GPT redigerà in chiusura di ogni modulo/argomento e si potrà intervenire nella conversazione mandando un proprio messaggio. Le Nuvole costelleranno il progetto di haiku, sintesi poetica e evocativa dei temi trattati per chiudere in levare e riaprire alla suggestione.
            </Typography>
          </Box>
             <Box sx={{ textAlign: 'center' }}>
              <Link href="https://nuvolaproject.cloud" target="_blank" rel="noopener" sx={{ fontWeight: 'bold', textDecoration: 'underline', color: theme.palette.primary.main }}>
                Scopri di più su NuvolaProject
              </Link>
            </Box>
          <Button sx={{ marginBottom: '20px' }} variant="contained" color="primary" startIcon={<ChatIcon />} onClick={handleEnterChat}>
            Entra nella Chat
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default MobileLanding;
