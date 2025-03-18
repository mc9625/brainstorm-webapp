import React, { useState, useEffect } from 'react';
import { Box, Container, Divider, ThemeProvider, CssBaseline, useMediaQuery, Typography } from '@mui/material';
import { Cloud } from '@mui/icons-material';
import ConversationList from './components/ConversationList';
import ConversationDetails from './components/ConversationDetails';
import SplashScreen from './components/SplashScreen';
import MobileLanding from './components/MobileLanding';
import ProjectInfo from './components/ProjectInfo'; // Importa il tuo componente ProjectInfo
import { Drawer, Fab, IconButton } from '@mui/material';
import { Chat as ChatIcon } from '@mui/icons-material';
import draculaTheme from './draculaTheme';
import { useTheme } from '@mui/material/styles';
import './style.css';


function App() {
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [mostRecentConversation, setMostRecentConversation] = useState(null);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [showSplashScreen, setShowSplashScreen] = useState(true); 
  const theme = useTheme();
  const matches = useMediaQuery(theme.breakpoints.down('sm'));
  const [conversationsLoaded, setConversationsLoaded] = useState(false);
  const [showChat, setShowChat] = useState(false); // Initialize chat visibility state
  const [showProjectInfo, setShowProjectInfo] = useState(false); // Aggiungi lo stato per gestire la visualizzazione di ProjectInfo
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isMobileLandscape = useMediaQuery('(max-width: 959.95px)'); 
  const isPortrait = useMediaQuery('(orientation: portrait)');
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleConversationSelect = (conversationId, mostRecentId) => {
    setSelectedConversation(conversationId);
    if (mostRecentId !== null) {
      setMostRecentConversation(mostRecentId);
    }
  };
  
  const [selectedHashtag, setSelectedHashtag] = useState(null); 
  const handleHashtagSelect = (hashtag) => {
    setSelectedHashtag(hashtag);
  };
  
  useEffect(() => {
    if (mostRecentConversation) {
      setShowSplashScreen(false)
      setSelectedConversation(mostRecentConversation);
    }
  }, [mostRecentConversation]);
  
  useEffect(() => {
    if(isFirstLoad) {
      setSelectedConversation(mostRecentConversation);
    }
    setIsFirstLoad(false);
  }, [mostRecentConversation, matches, isFirstLoad]);
  

  useEffect(() => {
    const timeout = setTimeout(() => {
      setShowSplashScreen(false);
    }, 3000);

    if(conversationsLoaded) {
      clearTimeout(timeout); 
      setShowSplashScreen(false);
    }
    return () => {
      clearTimeout(timeout);
    };
  }, [conversationsLoaded]);

  useEffect(() => {
    if (conversationsLoaded) {
      setShowSplashScreen(false);
    }
  }, [conversationsLoaded]);

  return (
    <ThemeProvider theme={draculaTheme}>
      <CssBaseline />
      {showSplashScreen && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0, 0, 0, 1)',
            opacity:.8,
            zIndex: 9999,
          }}
        >
          <SplashScreen />
        </Box>
      )}
      {showProjectInfo ? (
        <ProjectInfo /> // Mostra ProjectInfo se showProjectInfo è true
      ) : matches ? (
        showChat && !showSplashScreen ? (
          <Container maxWidth="none"
            sx={{ 
              paddingLeft: '0!important',
              paddingRight: '0!important',
            }}
          >
            <Box 
              className="no-padding-container"
              sx={{ display: 'flex', height: '100vh', 
              paddingTop: { xs: 0, sm: 0 },
              paddingLeft: { xs: 0, sm: 0 },
              paddingRight: { xs: 0, sm: 0 },
              backgroundColor: { xs: '#ffffff', sm: '#282a36' },
              color: { xs: '#000000', sm: '#ffffff'} }}>
              {isPortrait && (
                <>
                  <Fab
                    color="primary"
                    aria-label="conversations"
                    sx={{ position: 'fixed', top: '20px', right: '16px', zIndex: 1000 }}
                    onClick={() => setDrawerOpen(true)}
                  >
                    <ChatIcon />
                  </Fab>
                  <Drawer
                    anchor="bottom"
                    open={drawerOpen}
                    onClose={() => setDrawerOpen(false)}
                  >
                    <Box sx={{ p: 2, maxHeight: '60vh', overflow: 'auto' }}>
                      <Typography variant="h6">Conversazioni</Typography>
                      <ConversationList 
                        onSelect={(id) => {
                          handleConversationSelect(id, mostRecentConversation);
                          setDrawerOpen(false);
                        }}
                        selectedConversation={selectedConversation}
                        mostRecentConversation={mostRecentConversation}
                        setMostRecentConversation={setMostRecentConversation}
                        setConversationsLoaded={setConversationsLoaded}
                        compact={true}
                      />
                    </Box>
                  </Drawer>
                </>
              )}
              <Box sx={{ 
                  width: isMobile ? (isMobileLandscape ? '0' : '0') : '30%', 
                  borderRight: { xs: 'none', sm: '1px solid gray' }, 
                  overflow: 'auto' 
                }}>
                <Box sx={{ 
                  display: isMobile && isMobileLandscape ? 'none' : 'flex', 
                  alignItems: 'center', 
                  paddingLeft: 2 
                  }}>
                  <Cloud fontSize={isMobile && isMobileLandscape ? "small" : "large"} />
                    <Typography variant={isMobile && isMobileLandscape ? "h6" : "h2"}>&nbsp; Memoria & Oblio</Typography>
                </Box>
                <Divider />
                <ConversationList onSelect={handleConversationSelect} selectedConversation={selectedConversation} mostRecentConversation={mostRecentConversation} setMostRecentConversation={setMostRecentConversation} setConversationsLoaded={setConversationsLoaded} />
              </Box>
              <Box sx={{ 
                  width: isMobile ? (isMobileLandscape ? '100%' : '100%') : '70%',
                  paddingLeft: { xs: '0', sm: '32px' }, 
                  paddingRight: { xs: '0', sm: '32px' },
                  paddingBottom: { xs: '0', sm: '32px' }, 
                  overflow: 'auto'
              }}>
                    {selectedConversation && <ConversationDetails conversationId={selectedConversation} mostRecentConversation={mostRecentConversation} />}
              </Box>
            </Box>
          </Container>
        ) : (
          !showSplashScreen && <MobileLanding onEnterChat={() => setShowChat(true)} />
        )
      ) : (
        <Container maxWidth="none"
          sx={{ 
            paddingLeft: '0!important',
            paddingRight: '0!important',
          }}
        >
          <Box sx={{ display: 'flex', height: '100vh', 
            paddingTop: { xs: 0, sm: 0 },
            paddingLeft: { xs: 1, sm: 0 },
            paddingRight: { xs: 1, sm: 0 },
            backgroundColor: { xs: '#ffffff', sm: '#282a36' },
            color: { xs: '#000000', sm: '#ffffff'} }}>

            {isPortrait && (
              <>
                <Fab
                  color="primary"
                  aria-label="conversations"
                  sx={{ position: 'fixed', bottom: '80px', left: '16px', zIndex: 1000 }}
                  onClick={() => setDrawerOpen(true)}
                >
                  <ChatIcon />
                </Fab>
                <Drawer
                  anchor="bottom"
                  open={drawerOpen}
                  onClose={() => setDrawerOpen(false)}
                >
                  <Box sx={{ p: 2, maxHeight: '60vh', overflow: 'auto' }}>
                    <Typography variant="h6">Conversazioni</Typography>
                    <ConversationList 
                      onSelect={(id) => {
                        handleConversationSelect(id, mostRecentConversation);
                        setDrawerOpen(false);
                      }}
                      selectedConversation={selectedConversation}
                      mostRecentConversation={mostRecentConversation}
                      setMostRecentConversation={setMostRecentConversation}
                      setConversationsLoaded={setConversationsLoaded}
                      compact={true}
                    />
                  </Box>
                </Drawer>
              </>
            )}
            <Box sx={{ 
              width: { 
                xs: '100%', // width al 100% per schermi extra-small e up
                sm: '35%',  // width al 50% per schermi small e up
                md: '25%'   // width al 35% per schermi medium e up
              }, 
              borderRight: { xs: 'none', sm: '1px solid gray' }, overflow: 'auto' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', paddingLeft: 2 , paddingTop: isMobile ? 1 : 2, paddingBottom: isMobile ? 2 : 1}}>
                <Typography variant={isMobile && isMobileLandscape ? "h4" : "h6"}>&nbsp; Memoria e Oblio</Typography>
              </Box>
              <Divider />
              <ConversationList onSelect={handleConversationSelect} selectedConversation={selectedConversation} mostRecentConversation={mostRecentConversation} setMostRecentConversation={setMostRecentConversation} setConversationsLoaded={setConversationsLoaded} />
            </Box>
            <Box sx={{ 
                 width: { 
                  xs: '100%', // width al 100% per schermi extra-small e up
                  sm: '65%',  // width al 50% per schermi small e up
                  md: '75%'   // width al 35% per schermi medium e up
                }, 
                paddingLeft: { xs: '15px', sm: '32px' }, 
                paddingRight: { xs: '15px', sm: '32px' },
                paddingBottom: { xs: '15px', sm: '32px' }, 
                overflow: 'auto'
            }}>
                  {selectedConversation && <ConversationDetails conversationId={selectedConversation} mostRecentConversation={mostRecentConversation} />}
            </Box>
          </Box>
        </Container>
      )}
    </ThemeProvider>
  );
}

export default App;
