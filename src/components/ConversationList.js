import React, { useState, useEffect } from 'react';
import {db} from '../firebase';
import { ref, onValue, query, orderByKey, orderByChild, limitToFirst, startAt, endAt, limitToLast  } from 'firebase/database';
import { List, ListItemButton, ListItemText, Typography, Box, useTheme, Divider, useMediaQuery } from '@mui/material';
import Button from '@mui/material/Button';
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
  const [dbTotalConversations, setDbTotalConversations] = useState(0);
  const [dbTotalMessages, setDbTotalMessages] = useState(0);
  const isNotMobile = useMediaQuery(theme.breakpoints.up('md'));

  const pageSize = 20;

  // Questo useEffect ascolta i cambiamenti nel nodo "counters"
  useEffect(() => {
    const countersRef = ref(db, 'counters');
    const listener = onValue(countersRef, (snapshot) => {
      const data = snapshot.val();
      setDbTotalConversations(data.totalConversations || 0);
      setDbTotalMessages(data.totalMessages || 0);
    });

    return () => {
      listener();
    };
  }, []);

  useEffect(() => {
    loadMoreConversations();
  }, []);
  
 /*  useEffect(() => {
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
  console.log('Loaded Conversations:', loadedConversations);
    });

    return () => {
      listener();
    };
  }, []); */

  useEffect(() => {
    onSelect(null, mostRecentConversation);
  }, [mostRecentConversation]);
  

  const loadMoreConversations = () => {
    console.log("loadMoreConversations called");
    if (!hasMore || isLoading) return;
  
    setIsLoading(true);
  
    // Use 'conversationIndex' instead of 'conversations'
    const conversationsRef = ref(db, 'conversationIndex');
    let conversationsQuery;
  
    // If it's the first load or you don't have a valid lastLoaded
    if (!lastLoaded) {
      conversationsQuery = query(conversationsRef, orderByChild('lastUpdated'), limitToLast(pageSize + 1));
    } else {
      conversationsQuery = query(conversationsRef, orderByChild('lastUpdated'), endAt(lastLoaded), limitToLast(pageSize + 1));
    }
  
    onValue(conversationsQuery, (snapshot) => {
      console.log("Data received:", snapshot.val());
      const conversationsArray = [];
  
      snapshot.forEach(childSnapshot => {
        const conversation = childSnapshot.val();
        let topic = conversation.title ? conversation.title.split(' - ')[0] : 'No Title';
        // Rimuove "Brainstorming on " se esiste
        topic = topic.replace('Brainstorming on ', '');
        const formattedTopic = topic.charAt(0).toUpperCase() + topic.slice(1);
        const lastUpdated = conversation.lastUpdated ? conversation.lastUpdated : 'Unknown';
        conversationsArray.push({
          id: childSnapshot.key,
          topic: formattedTopic,
          lastUpdated,
          timestamp: conversation.lastUpdated,  // Using 'lastUpdated' as it exists in 'conversationIndex'
        });
      });
  
      conversationsArray.reverse();
      if (conversationsArray.length <= pageSize) {
        setHasMore(false);
      } else {
        const lastItem = conversationsArray.pop();
        console.log("Setting lastLoaded to:", lastItem.timestamp);
        setLastLoaded(lastItem.timestamp);
      }
  
      if (selectedHashtag) {
        conversationsArray = conversationsArray.filter(conv => conv.hashtags && conv.hashtags.includes(selectedHashtag));
      }
  
      setConversations(prev => {
        const newConversations = conversationsArray.filter(conv => !prev.some(p => p.id === conv.id));
        return [...newConversations, ...prev];
      });
  
      // Qui potremmo non aver bisogno di aggiornare totalMessages
      setTotalConversations(prev => prev + conversationsArray.length);
      setConversationsLoaded(true);
      setIsLoading(false);
  
      if (!selectedConversation) {
        const mostRecentConv = conversationsArray[0];
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
                          {new Date(conversation.lastUpdated).toLocaleString()}
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
      {hasMore ? (
        <div style={{ textAlign: "center", margin: "20px" }}>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={loadMoreConversations}
          >
            Load More
          </Button>
        </div>
      ) : null}
        <Box sx={{ position: 'sticky', bottom: 0, p: 1, display:'flex', alignItem: 'center', justifyContent: 'space-between', backgroundColor: theme.palette.background.default, borderTop: '1px solid rgba(128, 128, 128, 0.5)' }}>
          <Box sx={{ pb: isNotMobile ? 4 : 0 }}>
              <Typography variant="caption" component="span">
                Chats: {dbTotalConversations}
              </Typography>
              <Box component="span" sx={{ mx: 1 }}>
                |
              </Box>
              <Typography variant="caption" component="span">
                Msgs: {dbTotalMessages}
              </Typography>
          </Box> 
          {isNotMobile && ( 
            <Box sx={{ position: 'absolute',paddingLeft:2,paddingBottom:2, bottom: 0, left: 0,  pt: 2 }}>
              
                <Typography variant="body2" component="span"  fontWeight="bold"><a href="https://nuvolaproject.cloud"target="_blank" rel='noopener noreferrer'>By Nuvolaproject</a></Typography>
            </Box>
          )}
        </Box>
    </>
  );
}

export default ConversationList;