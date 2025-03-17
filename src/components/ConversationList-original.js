import React, { useState, useEffect } from 'react';
import {db} from '../firebase';
import { ref, onValue, query, orderByKey, orderByChild, limitToFirst, startAt, endAt, limitToLast  } from 'firebase/database';
import { List, ListItemButton, ListItemText, Typography, Box, useTheme, Divider, useMediaQuery } from '@mui/material';
import { Chat } from '@mui/icons-material';
import InfiniteScroll from 'react-infinite-scroll-component';


function ConversationList({ onSelect, selectedConversation, MostRecentConversation, setConversationsLoaded, selectedHashtag }) {
  const [conversations, setConversations] = useState([]);
  const [mostRecentConversation, setMostRecentConversation] = useState(null);
  const [totalConversations, setTotalConversations] = useState(0);
  const [totalMessages, setTotalMessages] = useState(0); 
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [lastKey, setLastKey] = useState('');
  const theme = useTheme();
  const [lastLoaded, setLastLoaded] = useState(null);

  const pageSize = 20;

  /* useEffect(() => {
    loadMoreConversations();
  }, []); */
  
  useEffect(() => {
    // Changed from 'conversations' to 'conversationIndex'
    const conversationsRef = ref(db, 'conversationIndex');
    const listener = onValue(conversationsRef, (snapshot) => {
      const data = snapshot.val();
      const loadedConversations = Object.keys(data).map((key) => ({
        id: key,
        title: data[key].title,
        lastUpdated: data[key].lastUpdated
      }));
      setConversations(loadedConversations);
    });

    return () => {
      listener();
    };
  }, []);

  useEffect(() => {
    onSelect(null, mostRecentConversation);
  }, [mostRecentConversation]);
  

  const loadMoreConversations = () => {
    console.log("loadMoreConversations called");
    if (!hasMore || isLoading) return;
  
    setIsLoading(true);
  
    const conversationsRef = ref(db, 'conversations');
    let conversationsQuery;
  
    // Se è il primo caricamento o non hai una lastLoaded valida
    if (!lastLoaded) {
      conversationsQuery = query(conversationsRef, orderByChild('timestamp'), limitToLast(pageSize + 1));
    } else {
      conversationsQuery = query(conversationsRef, orderByChild('timestamp'), endAt(lastLoaded), limitToLast(pageSize + 1));
    }
    
    
  
    onValue(conversationsQuery, (snapshot) => {
      console.log("Data received:", snapshot.val()); // Aggiungi questa riga
      const conversationsArray = [];
      let messagesCount = 0;
  
      snapshot.forEach(childSnapshot => {
        const conversation = childSnapshot.val();
  
        const topic = conversation.title.split(' - ')[0].replace('Brainstorming on', '').trim();
        const formattedTopic = topic.charAt(0).toUpperCase() + topic.slice(1);
        const dateTime = conversation.title.split(' - ')[1].trim();
        
        // Count messages in each conversation
        const dialogue = conversation.dialogue;
        for (const messageKey in dialogue) {
          messagesCount++;
        }
  
        // Use timestamp from conversation
        const timestampDate = new Date(conversation.timestamp);
        const timestampMs = timestampDate.getTime();

        conversationsArray.push({ 
          id: childSnapshot.key, 
          topic: formattedTopic, 
          dateTime, 
          timestamp: conversation.timestamp, 
        });
      });
      conversationsArray.reverse();
      // Se hai caricato meno conversazioni di quanto previsto, significa che non ci sono altre conversazioni da caricare
      if (conversationsArray.length <= pageSize) {
        setHasMore(false);
      } else {
        const lastItem = conversationsArray.pop();
        console.log("Setting lastLoaded to:", lastItem.timestamp);
        setLastLoaded(lastItem.timestamp); // Usa la stringa ISO direttamente
      }
  
      if (selectedHashtag) {
        conversationsArray = conversationsArray.filter(conv => conv.hashtags && conv.hashtags.includes(selectedHashtag));
      }
  
      setConversations(prev => {
        // Filtra le conversazioni che sono già nell'array
        const newConversations = conversationsArray.filter(conv => !prev.some(p => p.id === conv.id));
        return [...prev, ...newConversations];
      });
      setTotalConversations(prev => prev + conversationsArray.length);
      setTotalMessages(prev => prev + messagesCount);
      setConversationsLoaded(true);
      setIsLoading(false);
      if (!selectedConversation) {
        const mostRecentConv = conversationsArray[0]; // Dopo averle ordinate, la prima è la più recente
        setMostRecentConversation(mostRecentConv.id);
        onSelect(mostRecentConv.id, mostRecentConv.id);
      }
    });
  };
  
  

  return (
    <>
    <div className="infinite-scroll-container">
      <InfiniteScroll
        dataLength={conversations.length}
        next={loadMoreConversations}
        hasMore={hasMore}
        loader={<Typography variant="h6">Loading...</Typography>}
        endMessage={
          <Typography variant="body1" align="center">No more conversations</Typography>
        }
        >
        <List>
          {conversations.map((conversation) => (
            <ListItemButton
            key={conversation.id}
            //when open a conversation also pass a variable to let ConversationDetails know if it is the most recent one
            onClick={() => onSelect(conversation.id, mostRecentConversation)}
            selected={conversation.id === selectedConversation}
            >
            <ListItemText
                primary={
                    <Box component="div" display="flex" alignItems="center">
                    <Chat sx={{ marginRight: 1 }} />
                    <Typography component="div" variant="h7">
                        {conversation.topic}
                        {conversation.id === mostRecentConversation && 
                        <>
                            <span className="dot">.</span>
                            <span className="dot">.</span>
                            <span className="dot">.</span>
                        </>
                        }
                    </Typography>
                    </Box>
                }
                primaryTypographyProps={{ component: 'div' }}
                secondary={
                    <Box component="div">
                    <Typography variant="body2" component="div" sx={{ fontSize: '0.9rem', fontStyle: 'italic',  marginLeft: '2rem'  }}>
                        {conversation.dateTime}
                    </Typography>
                    </Box>
                }
                secondaryTypographyProps={{ component: 'div' }}
                />
            </ListItemButton>
          ))}
        </List>
      </InfiniteScroll>
      </div>
      {/* Pulsante di carica altro */}
      <button onClick={loadMoreConversations}>Carica altro</button>
        <Box sx={{ position: 'sticky', bottom: 0, p: 2, display:'flex', alignItem: 'center', justifyContent: 'space-between', backgroundColor: theme.palette.background.default, borderTop: '1px solid rgba(128, 128, 128, 0.5)' }}>
        <Box sx={{ pb: 3 }}>
            <Typography variant="body2" component="span">
              Chats: {totalConversations}
            </Typography>
            <Box component="span" sx={{ mx: 1 }}>
              |
            </Box>
            <Typography variant="body2" component="span">
              Msgs: {totalMessages}
            </Typography>
          </Box>

            <Divider/>
            <Box sx={{ position: 'absolute',paddingLeft:2,paddingBottom:2, bottom: 0, left: 0,  pt: 2 }}>
                <Typography variant="body2" component="span"  fontWeight="bold"><a href="https://nuvolaproject.cloud"target="_blank" rel='noopener noreferrer'>By Nuvolaproject</a></Typography>
            </Box>
        </Box>
    </>
  );
}

export default ConversationList;