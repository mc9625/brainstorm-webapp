import React, { useState, useEffect, useCallback } from 'react';
import { List, ListItemButton, ListItemText, Typography, Box, useTheme, Divider, useMediaQuery, Button, IconButton } from '@mui/material';
import { Chat, Refresh as RefreshIcon } from '@mui/icons-material';
import InfiniteScroll from 'react-infinite-scroll-component';

function ConversationList({ onSelect, selectedConversation, setConversationsLoaded, selectedHashtag, mostRecentConversation, setMostRecentConversation }) {
  const [conversations, setConversations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [lastLoaded, setLastLoaded] = useState(null);
  const [dbTotalConversations, setDbTotalConversations] = useState(0);
  const [dbTotalMessages, setDbTotalMessages] = useState(0);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [lastPolledCount, setLastPolledCount] = useState(0);
  
  const theme = useTheme();
  const isNotMobile = useMediaQuery(theme.breakpoints.up('md'));

  const pageSize = 20;
  const AUTO_REFRESH_INTERVAL = 10000; // 10 secondi per l'aggiornamento automatico

  const API_BASE_URL = ""; // URL relativo vuoto

  // Carica i contatori dal backend
  const loadCounters = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/counters`);
      if (!response.ok) {
        throw new Error(`Network error: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      console.log("Counter data:", data);

      setDbTotalConversations(data.totalConversations || 0);
      setDbTotalMessages(data.totalMessages || 0);
      
      // Verifica se il numero di conversazioni è aumentato
      if (lastPolledCount > 0 && data.totalConversations > lastPolledCount) {
        console.log("Nuova conversazione rilevata!");
        // Forza il caricamento delle conversazioni più recenti
        loadConversations(true);
      }
      
      setLastPolledCount(data.totalConversations || 0);
    } catch (error) {
      console.error('Error fetching counters:', error);
      setError(`Failed to load counters: ${error.message}`);
    }
  };

  // Funzione per caricare le conversazioni dal backend
  const loadConversations = useCallback(async (reset = false) => {
    if ((isLoading && !reset) || (!hasMore && !reset)) return;
  
    setIsLoading(true);
    setError(null);
  
    // Se reset è true, facciamo un caricamento completo
    const url = reset 
    ? `${API_BASE_URL}/api/conversations?limit=${pageSize + 1}`
    : `${API_BASE_URL}/api/conversations?limit=${pageSize + 1}${lastLoaded ? `&lastLoaded=${lastLoaded}` : ''}`;

    const cacheBuster = `&_t=${new Date().getTime()}`; // Aggiunge un parametro per evitare la cache
  
    try {
      console.log(`Fetching conversations from: ${url}${cacheBuster}`);
      const response = await fetch(`${url}${cacheBuster}`);
      
      if (!response.ok) {
        throw new Error(`Network error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log("Conversation data received:", data);
      
      let { conversations: conversationsData = [], hasMore: serverHasMore, nextLastLoaded } = data;

      // Se stiamo resettando, sostituiamo l'intera lista
      if (reset) {
        setConversations(conversationsData);
        setLastLoaded(nextLastLoaded);
        setHasMore(serverHasMore);
        
        if (conversationsData.length > 0) {
          const newestConv = conversationsData[0];
          
          // Controllo se è una nuova conversazione che non abbiamo ancora visto
          const isNewMostRecent = mostRecentConversation !== newestConv.id;
          
          console.log(`Most recent conversation: ${mostRecentConversation}, Newest: ${newestConv.id}, Is New: ${isNewMostRecent}`);
          
          // Aggiorna la conversazione più recente
          setMostRecentConversation(newestConv.id);
          
          // Se è una nuova conversazione, la seleziona automaticamente
          if (isNewMostRecent) {
            console.log(`Auto-selecting new conversation: ${newestConv.id}`);
            onSelect(newestConv.id, newestConv.id);
          }
        }
      } else {
        // Comportamento per lo scroll infinito - aggiungi dati
        if (selectedHashtag) {
          conversationsData = conversationsData.filter(conv => 
            conv.hashtags && conv.hashtags.includes(selectedHashtag)
          );
        }
        
        setConversations(prev => {
          // Evita duplicati
          const newConversations = conversationsData.filter(
            conv => !prev.some(p => p.id === conv.id)
          );
          return [...prev, ...newConversations];
        });

        if (conversationsData.length <= pageSize) {
          setHasMore(false);
        } else {
          setHasMore(serverHasMore);
        }

        if (nextLastLoaded) {
          setLastLoaded(nextLastLoaded);
        }
      }
  
      setConversationsLoaded(true);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Error fetching conversations:", error);
      setError(`Failed to load conversations: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [hasMore, isLoading, lastLoaded, onSelect, pageSize, selectedConversation, selectedHashtag, setConversationsLoaded, mostRecentConversation, setMostRecentConversation]);

  // Caricamento iniziale
  useEffect(() => {
    loadCounters();
    loadConversations(true); // Caricamento iniziale, reset a true
  }, []);
  
  // Configura l'aggiornamento automatico per conversazioni e contatori
  useEffect(() => {
    const refreshInterval = setInterval(() => {
      console.log("Auto-refreshing conversations and counters...");
      loadCounters(); // Questo attiverà un ricaricamento se rileva nuove conversazioni
    }, AUTO_REFRESH_INTERVAL);
    
    return () => clearInterval(refreshInterval);
  }, []);
  
  // Funzione di aggiornamento manuale
  const handleRefresh = () => {
    console.log("Manual refresh triggered");
    loadConversations(true);
    loadCounters();
  };

  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1 }}>
        <Typography variant="body2">
          Ultimo aggiornamento: {lastUpdated.toLocaleTimeString()}
        </Typography>
        <IconButton onClick={handleRefresh} disabled={isLoading}>
          <RefreshIcon />
        </IconButton>
      </Box>
      
      {error && (
        <Typography variant="body2" color="error" sx={{ p: 2 }}>
          {error}
        </Typography>
      )}
      
      <div className="infinite-scroll-container">
        <InfiniteScroll
          dataLength={conversations.length}
          next={() => loadConversations(false)} // Carica altri senza reset
          hasMore={hasMore}
          endMessage={
            <Typography variant="body1" align="center">Non ci sono altre conversazioni</Typography>
          }
          loader={<Typography variant="body2" align="center">Caricamento...</Typography>}
        >
          <List>
            {conversations.length > 0 ? (
              conversations.map((conversation) => (
                <ListItemButton
                  key={conversation.id}
                  onClick={() => onSelect(conversation.id, mostRecentConversation)}
                  selected={conversation.id === selectedConversation}
                >
                  <ListItemText
                    primary={
                      <Box component="div" display="flex" alignItems="center">
                        <Chat sx={{ marginRight: 1 }} />
                        <Typography component="div" variant="h7">
                          {conversation.topic || "Conversazione senza titolo"}
                          {conversation.id === mostRecentConversation && (
                            <>
                              <span className="dot">.</span>
                              <span className="dot">.</span>
                              <span className="dot">.</span>
                            </>
                          )}
                        </Typography>
                      </Box>
                    }
                    secondary={
                      <Box component="div">
                        <Typography variant="body2">
                          {new Date(conversation.timestamp).toLocaleString()}
                        </Typography>
                      </Box>
                    }
                    // **Add these props to prevent <p> nesting**
                    primaryTypographyProps={{ component: 'div' }}
                    secondaryTypographyProps={{ component: 'div' }}
                  />
                </ListItemButton>
              ))
            ) : (
              <Typography variant="body1" sx={{ p: 2, textAlign: 'center' }}>
                {isLoading ? 'Caricamento conversazioni...' : 'Nessuna conversazione trovata'}
              </Typography>
            )}
          </List>
        </InfiniteScroll>
      </div>
      
      {hasMore && (
        <div style={{ textAlign: "center", margin: "20px" }}>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={() => loadConversations(false)} // Carica altri senza reset
            disabled={isLoading}
          >
            {isLoading ? 'Caricamento...' : 'Carica altri'}
          </Button>
        </div>
      )}
      
      <Box sx={{ position: 'sticky', bottom: 0, p: 1, display:'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: theme.palette.background.default, borderTop: '1px solid rgba(128, 128, 128, 0.5)' }}>
        <Box sx={{ pb: isNotMobile ? 4 : 0 }}>
          <Typography variant="caption" component="span">
            Chat: {dbTotalConversations}
          </Typography>
          <Box component="span" sx={{ mx: 1 }}>
            |
          </Box>
          <Typography variant="caption" component="span">
            Messaggi: {dbTotalMessages}
          </Typography>
        </Box> 
        {isNotMobile && (
          <Box sx={{ position: 'absolute', paddingLeft: 2, paddingBottom: 2, bottom: 0, left: 0, pt: 2 }}>
            <Typography variant="body2" component="span" fontWeight="bold">
              <a href="https://nuvolaproject.cloud" target="_blank" rel='noopener noreferrer'>By Nuvolaproject</a>
            </Typography>
          </Box>
        )}
      </Box>
    </>
  );
}

export default ConversationList;