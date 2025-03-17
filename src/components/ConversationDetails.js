import React, { useState, useEffect, useRef } from 'react';
import {Box, Typography, Avatar, Button, Chip, useTheme } from '@mui/material';
import {db}  from '../firebase';
import { push, set, serverTimestamp, ref, onValue, query, orderByChild, equalTo } from 'firebase/database';
import {Fab, Dialog, TextField, IconButton, Grid, Divider  } from '@mui/material';
import { VolumeUp as VolumeUpIcon,   Add as AddIcon, Send as SendIcon  } from '@mui/icons-material';
import useMediaQuery from '@mui/material/useMediaQuery';
import ClearIcon from '@mui/icons-material/Clear';
import PersonIcon from '@mui/icons-material/Person';
import { CircularProgress } from '@mui/material';
import Modal from './Modal';  // Supponiamo che tu abbia un componente Modal definito separatamente

function ConversationDetails({ conversationId, mostRecentConversation }) {
  const [messages, setMessages] = useState([]);
  const [summary, setSummary] = useState('');
  const [showMessages, setShowMessages] = useState(false);
  const [showWaitingMessage, setShowWaitingMessage] = useState(false);
  const messagesEndRef = useRef(null);
  const newtopic = conversationId.split('-')[1].trim();
  const formattedTopic = newtopic.charAt(0).toUpperCase() + newtopic.slice(1).replace(/_/g, ' ');
  const lastMessageRef = useRef(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const [open, setOpen] = useState(false);
  const [haiku, setHaiku] = useState('');
  const [showHaiku, setShowHaiku] = useState(false);
  const [filteredMessages, setFilteredMessages] = useState(messages);
  const [message, setMessage] = useState("");
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const handleShowHaikuInline = () => {
    setShowHaiku(!showHaiku);
    setShowMessages(false);
  };
  // Effect Haiku
  const [modalVisible, setModalVisible] = useState(false);
  const handleShowHaikuModal = () => {
    setModalVisible(true);
  };
  const handleCloseHaikuModal = () => {
    setModalVisible(false);
  };
 
  const isDesktopOrTablet = useMediaQuery(theme.breakpoints.up('md'));
  const isPortrait = useMediaQuery('(orientation: portrait)');
  const textColor = isDesktopOrTablet || !isPortrait ? '#fff' : '#000';
  
  const handleSendMessage = () => {
    setSendingMessage(true);
    const messagesRef = ref(db, `userMessages/${conversationId}`);
    const newMessageRef = push(messagesRef);
    set(newMessageRef, {
      message: message,
      timestamp: serverTimestamp(),
      conversationId: conversationId,
    }).then(() => {
      setMessage("");
      handleClose();
      set(ref(db, 'controls/userMessageSent'), true);
    });
  };
  
  const [userMessageSent, setUserMessageSent] = useState(false);
  useEffect(() => {
    const controlsRef = ref(db, 'controls/userMessageSent');
    const controlsListener = onValue(controlsRef, (snapshot) => {
      const value = snapshot.val();
      setUserMessageSent(value === true);
    });
  
    return () => {
      // Clean up the listener
      controlsListener();
    };
  }, []);

  const speakSummary = () => {
    if (window.speechSynthesis.speaking) {
      // Stop the speech if it's currently speaking.
      window.speechSynthesis.cancel();
    } else {
      const utterance = new SpeechSynthesisUtterance(summary.summary);
      // Set the language to English.
      utterance.lang = 'en-US';
      // Set the speed of the speech. 1 is normal speed, 2 is twice as fast, 0.5 is half as fast, etc.
      utterance.rate = .7;
  
      // Fetch the list of voices available
      let voices = window.speechSynthesis.getVoices();
  
      // Filter voices to English (en-US) ones
      voices = voices.filter(voice => voice.lang === 'en-US');
      
      // If an English voice is available, use the first one.
      if (voices.length > 0) {
        utterance.voice = voices[0];
      }
  
      window.speechSynthesis.speak(utterance);
    }
  };

  useEffect(() => {
    if (summary && summary.haiku) {
      setHaiku(summary.haiku);
    } else {
      setHaiku('');
    }
  }, [summary]);
  


  useEffect(() => {
    if (!window.speechSynthesis) {
      console.log("Sorry, your browser doesn't support Speech Synthesis.");
    }
  }, []);

  useEffect(() => {
    const messagesRef = ref(db, `conversations/${conversationId}/dialogue`);
    let unsubscribeMessages;

    unsubscribeMessages = onValue(messagesRef, (snapshot) => {
      let messagesArray = [];
      const data = snapshot.val();

      for (const message in data) {
        if (data.hasOwnProperty(message)) {
          messagesArray.push({ id: message, ...data[message] });
        }
      }

      setMessages(messagesArray);
      // Qui viene implementata la logica per il messaggio di attesa
      setShowWaitingMessage(false);
      setTimeout(() => {
        if (conversationId === mostRecentConversation) {
          setShowWaitingMessage(true);
        }
      }, 2000); // Imposta un ritardo come desideri
    });

    // Reset showMessages
    setShowMessages(false);
    setShowWaitingMessage(false);
    setShowHaiku(false);

    // Cleanup function
    return () => {
      unsubscribeMessages();
    };
  }, [conversationId]);

  useEffect(() => {
    const summaryRef = ref(db, 'summary');
    const summaryQuery = query(summaryRef, orderByChild('conversation_id'), equalTo(conversationId));
    let timeoutId;
    onValue(summaryQuery, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const summaryData = Object.values(data)[0];
        setSummary(summaryData);
      } else {
        setSummary('');
        setShowMessages(true);
        // if this is the most recent conversation, show the waiting message
        if (conversationId === mostRecentConversation) {
          timeoutId = setTimeout(() => {
            setShowWaitingMessage(true);
          }, 2000);
        }
      }
    });
  }, [conversationId, mostRecentConversation]);

  const handleToggleMessages = () => {
    setShowMessages(!showMessages);
    if (showHaiku) {
      setShowHaiku(false);
    }
  };
  const handleToggleHaiku = () => {
    setShowHaiku(!showHaiku);
    if (showMessages) {
      setShowMessages(false);
    }
  };

  useEffect(() => {
    if (showMessages) {
      let delay = 0;
      messages.forEach((message) => {
        setTimeout(() => {
          const messageElement = document.getElementById(`message-${message.id}`);
          if (messageElement) {
            messageElement.style.display = 'flex';
            setTimeout(() => {
              messageElement.style.opacity = 1;   
              if (lastMessageRef.current) {
                lastMessageRef.current.scrollIntoView({ behavior: 'smooth' });
              }  
           }, 100);
          }
        }, delay);
        delay += 200;
      });
    } else {
      messages.forEach((message) => {
        const messageElement = document.getElementById(`message-${message.id}`);
        if (messageElement) {
          messageElement.style.display = 'none';
          messageElement.style.opacity = 0;
        }
      });
    }
  }, [showMessages, messages]);

 

  const handleHashtagClick = (hashtag) => {
    const newFilteredMessages = messages.filter(message => message.text && message.text.includes(hashtag));
    setFilteredMessages(newFilteredMessages);
  };

return (
    <div>
      <Typography variant="h4" sx={{ marginTop: '10px', marginBottom:'10px' }}>{formattedTopic}</Typography>
      <Divider sx={{ marginTop: '10px', marginBottom:'20px' }}/>
      {summary && (
        <>
          <Typography variant="h5">Summary</Typography>
          <IconButton onClick={speakSummary}>
            <VolumeUpIcon />
          </IconButton>
          <Box
            sx={{
              color: textColor,
              margin: '10px 0',
              padding: '10px 20px',
              borderRadius: '5px',
            }}
          >
            <div>{summary.summary}</div>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '10px' }}>
              {summary.hashtags && summary.hashtags.map((hashtag) => (
                <Chip
                  key={hashtag}
                  label={hashtag}
                  variant="outlined"
                  size="small"
                  style={{ color: '#FFFFFF', borderColor: '#FFFFFF' }}
                  onClick={() => handleHashtagClick(hashtag)}
                />
              ))}
            </Box>
          </Box>

        </>
      )}
      <Typography variant="h6">Messages</Typography>
      {summary  && (
        <Button style={{marginRight: '20px', marginTop: '30px', marginBottom: '30px'}} variant="contained" onClick={handleToggleMessages}>
           {showMessages ? 'Hide Messages' : 'Show Messages'}
        </Button>
      )}
      {haiku && (
        <>
          <Button  style={{ marginTop: '30px', marginBottom: '30px' }} variant="contained" onClick={handleShowHaikuInline}>
            {showHaiku ? 'Hide Haiku' : 'Show Haiku'}
          </Button>
          {showHaiku && (
            <Typography variant="body1">{haiku}</Typography>
          )}
        </>
      )}
      {showMessages && (
        <Box>
          {messages.map((message, index) => {
            const isLastMessage = index === messages.length - 1
            let backgroundColor, avatarColor, foregroundColor, floatDirection, borderRadius;
            if (message.AI === 'AI1') {
              backgroundColor = { xs: '#0b93f6', sm:'rgba(68,71,90,0.7)'};
              avatarColor = '#bd93f9';
              foregroundColor = '#FFFFFF';
              floatDirection = 'left';
              borderRadius = { xs: '18px 18px 18px 0', sm: '10px' };   // aggiornato per la vista mobile
            } else if (message.AI === 'AI2') {
              backgroundColor = {xs:'#e5e5ea', sm: 'rgba(98, 114, 164, 0.7)'};
              avatarColor = '#ff79c6';
              foregroundColor  = {xs: '#000000', sm:'#FFFFFF'};
              floatDirection = 'right';
              borderRadius = { xs: '18px 18px 0 18px', sm: '10px' }; 
            } else  if (message.AI === 'User') {
              backgroundColor = {xs: '#1FBA40', sm:'rgba(248, 248, 242, 0.9)'};
              avatarColor = '#757575';
              foregroundColor  = {xs: '#ffffff', sm:'#000000'};
              floatDirection = 'right';
              borderRadius = { xs: '18px 18px 0 18px', sm: '10px' };
            } else {
              backgroundColor = {xs: '#aeb9cc', sm:'rgba(174,185,204, 0.9)'};
              avatarColor = '#757575';
              foregroundColor  = {xs: '#000000', sm:'#000000'};
              floatDirection = 'left';
              borderRadius = { xs: '18px 18px 18px 0', sm: '10px' };
            }

            return (
              <Box
                key={message.id}
                id={`message-${message.id}`}
                ref={isLastMessage ? lastMessageRef : null}
                sx={{
                  display: 'none',   // hide the message initially
                  background: backgroundColor,
                  color: foregroundColor,
                  margin: '10px 0',
                  padding: '10px 20px',
                  borderRadius: borderRadius,
                  opacity: 0, 
                  minWidth: { xs: '80%', sm: '100%' },
                  width: { xs: '80%', sm: '100%' },
                  transition: 'opacity 0.5s ease',
                  float: floatDirection,
                  clear: 'both',
                }}
              >
                <Avatar
                  sx={{
                    marginRight: '10px',
                    backgroundColor: avatarColor,
                    color: '#ffffff',
                    display:{ sm:'inline-flex', xs:'none'}
                  }}
                >
                  {message.AI === 'User' ? <PersonIcon /> : message.AI}
                </Avatar>
                <div>
                  <p>{message.message}</p>
                </div>
                <div ref={messagesEndRef} />
              </Box>
            );
          })}
          {(!summary && showWaitingMessage) && (
            <>
            <Box
              sx={{
                display: 'flex',
                background: messages[messages.length-1].AI === 'AI1' ? {xs:'#e5e5ea', sm: 'rgba(98, 114, 164, 0.7)'} :{ xs: '#0b93f6', sm:'rgba(68,71,90,0.7)'},
                color: messages[messages.length-1].AI === 'AI2' ? '#FFFFFF': {xs: '#000000', sm:'#FFFFFF'},
                margin: '10px 0',
                padding: '10px 20px',
                borderRadius:messages[messages.length-1].AI === 'AI2' ? '18px 18px 18px 0' : '18px 18px 0 18px',
                minWidth: { xs: '80%', sm: '100%' },
                width: { xs: '80%', sm: '100%' },
                float: messages[messages.length-1].AI === 'AI1' ? 'right' : 'left',
                textAlign: messages[messages.length-1].AI === 'AI1' ? 'right' : 'left',
                opacity: 1, 
              }}
            >
              <Avatar
                sx={{
                  marginRight: '10px',
                  backgroundColor: messages[messages.length-1].AI === 'AI1' ? '#ff79c6' : '#bd93f9',
                  color: '#ffffff',
                  display:{ sm:'inline-flex', xs:'none'}
                }}
              >
                {messages[messages.length-1].AI === 'AI1' ? 'AI2' : 'AI1'}
                
              </Avatar>
              <Typography component="div" variant="h3">
                  <>
                        <span className="dot"><b>.</b></span>
                        <span className="dot"><b>.</b></span>
                        <span className="dot"><b>.</b></span>
                    </>
              </Typography>
            </Box>
             
             </>
          )}
          { isMobile && (
          <div style={{ marginBottom: '80px', color: 'transparent' }} ref={messagesEndRef}>
          <Box>__________________________</Box>
          </div>
          )}
          { !isMobile && (
          <div style={{ marginBottom: '20px', color: 'transparent' }} ref={messagesEndRef}>
          <Box>__________________________</Box>
          </div>
          )}
        </Box>
      )}
      {!isMobile && !summary && (
        <Box>
          {userMessageSent ? (
            <CircularProgress color="primary" size={36} style={{ position: 'fixed', bottom: '16px', right: '16px' }} />
          ) : (
            <Fab color="primary" aria-label="add" onClick={handleOpen} style={{ position: 'fixed', bottom: '16px', right: '16px' }}>
              <AddIcon />
            </Fab>
          )}
          <Dialog
            fullScreen={fullScreen}
            open={open}
            onClose={handleClose}
            aria-labelledby="responsive-dialog-title"
            PaperProps={{
              style: {
                position: 'absolute',
                bottom: 0,
                right:80,
                maxWidth: fullScreen ? '100%' : '60%',
                width: '100%',
                borderRadius: 5,
                backgroundColor: '#000000',
              },
            }}
          >
            <Box sx={{ p: 2 }}>
              <Grid container alignItems="center">
                <Grid item xs={11.5}>
                  <TextField 
                    autoFocus
                    margin="dense"
                    id="name"
                    label="Your Message"
                    type="text"
                    fullWidth
                    minWidth="100%"
                    variant="standard"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    color="primary"
                  />
                </Grid>
                <Grid item xs={.5}>
                  <IconButton color="primary" onClick={handleSendMessage} disabled={!message.trim()}>
                    <SendIcon />
                  </IconButton>
                </Grid>
              </Grid>
            </Box>
          </Dialog>
        </Box>
      )}

      {isMobile && !summary && (
        //if userMessageSent is true, show a loading indicator else show the box
        userMessageSent ? (
          <CircularProgress color="primary" size={36} style={{ position: 'fixed', bottom: '16px', right: '16px' }} />
        ) : (
        <Box sx={{ p: 2, position: 'fixed',display:'flex', bottom: 0, right: 0, width: '100%', backgroundColor: '#ffffff', color: '#000000', borderTop: '1px solid lightgray', }}>
          <TextField
            autoFocus
            margin="dense"
            id="prompt"
            label="Prompt"
            type="text"
            fullWidth
            multiline  // makes the TextField multi-line
            rowsMax={3}  // set a maximum number of lines
            inputProps={{ style: { whiteSpace: 'pre-wrap', color:'black'} }}  // wrap the text
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            variant="outlined"
            style={{borderColor: 'black', borderRadius: '5px'}}
            backgroundColor="#ff2222"
          />
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <IconButton onClick={() => setMessage('')} color="primary">
              <ClearIcon /> 
            </IconButton>
            <IconButton onClick={handleSendMessage} color="primary" disabled={!message.trim()}>
              <SendIcon />
            </IconButton>
          </Box>
        </Box>
        )
      )} 
    </div>
  );
}
export default ConversationDetails;