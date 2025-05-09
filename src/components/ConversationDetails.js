import React, { useState, useEffect, useRef } from 'react';
import {
  Box, Typography, Avatar, Button, Chip, useTheme, Divider, useMediaQuery,
  Fab, Dialog, TextField, IconButton, Grid, CircularProgress, Paper,
  Accordion, AccordionSummary, AccordionDetails, Collapse, Zoom, Tooltip,
  LinearProgress,
  autocompleteClasses
} from '@mui/material';
import {
  VolumeUp as VolumeUpIcon, Add as AddIcon, Send as SendIcon,
  Refresh as RefreshIcon, ExpandMore as ExpandMoreIcon, Close as CloseIcon,
  Message as MessageIcon, ArrowDownward
} from '@mui/icons-material';
import ClearIcon from '@mui/icons-material/Clear';
import PersonIcon from '@mui/icons-material/Person';
import ReactMarkdown from 'react-markdown';

// API URL - set this to your actual API URL
import API_CONFIG from '../config';
const API_BASE_URL = API_CONFIG.API_BASE_URL;

// Constants & Theme
const CONVERSATION_LENGTH = 10;

// Dracula theme
const draculaTheme = {
  background: '#282a36',
  currentLine: '#44475a',
  selection: '#44475a',
  foreground: '#f8f8f2',
  comment: '#6272a4',
  cyan: '#8be9fd',
  green: '#50fa7b',
  orange: '#ffb86c',
  pink: '#ff79c6',
  purple: '#bd93f9',
  red: '#ff5555',
  yellow: '#f1fa8c'
};

// Animation keyframes
const animationKeyframes = `
  @keyframes bounce {
    0%, 60%, 100% { transform: translateY(0); }
    30% { transform: translateY(-5px); }
  }
  
  .hide-scrollbar {
    overflow-y: auto;
    scrollbar-width: none;
    -ms-overflow-style: none;
  }
  
  .hide-scrollbar::-webkit-scrollbar {
    display: none;
  }
`;

// Typing indicator components
const AI1TypingIndicator = () => (
  <div style={{ 
    backgroundColor: 'rgba(68,71,90,0.7)',
    color: '#f8f8f2',
    margin: '10px 0',
    padding: '10px 20px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    float: 'left',
    clear: 'both',
    width: 'fit-content',
    maxWidth: '80%'
  }}>
    <div style={{ 
      width: '30px',
      height: '30px',
      borderRadius: '50%',
      backgroundColor: '#bd93f9',
      color: '#f8f8f2',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: '10px',
      fontWeight: 'bold'
    }}>
      AI1
    </div>
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <div style={{ 
        width: '8px', 
        height: '8px', 
        backgroundColor: 'white', 
        borderRadius: '50%',
        margin: '0 3px',
        animation: 'bounce 1.3s infinite'
      }}></div>
      <div style={{ 
        width: '8px', 
        height: '8px', 
        backgroundColor: 'white', 
        borderRadius: '50%',
        margin: '0 3px',
        animation: 'bounce 1.3s infinite',
        animationDelay: '0.15s'
      }}></div>
      <div style={{ 
        width: '8px', 
        height: '8px', 
        backgroundColor: 'white', 
        borderRadius: '50%',
        margin: '0 3px',
        animation: 'bounce 1.3s infinite',
        animationDelay: '0.3s'
      }}></div>
    </div>
  </div>
);

const AI2TypingIndicator = () => (
  <div style={{ 
    backgroundColor: 'rgba(98,114,164,0.7)',
    color: '#f8f8f2',
    margin: '10px 0',
    padding: '10px 20px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    float: 'right',
    clear: 'both',
    width: 'fit-content',
    maxWidth: '80%'
  }}>
    <div style={{ 
      width: '30px',
      height: '30px',
      borderRadius: '50%',
      backgroundColor: '#ff79c6',
      color: '#f8f8f2',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: '10px',
      fontWeight: 'bold'
    }}>
      AI2
    </div>
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <div style={{ 
        width: '8px', 
        height: '8px', 
        backgroundColor: 'white', 
        borderRadius: '50%',
        margin: '0 3px',
        animation: 'bounce 1.3s infinite'
      }}></div>
      <div style={{ 
        width: '8px', 
        height: '8px', 
        backgroundColor: 'white', 
        borderRadius: '50%',
        margin: '0 3px',
        animation: 'bounce 1.3s infinite',
        animationDelay: '0.15s'
      }}></div>
      <div style={{ 
        width: '8px', 
        height: '8px', 
        backgroundColor: 'white', 
        borderRadius: '50%',
        margin: '0 3px',
        animation: 'bounce 1.3s infinite',
        animationDelay: '0.3s'
      }}></div>
    </div>
  </div>
);

// Helper function for title cleaning
const cleanTitle = (title) => {
  if (!title) return 'Loading Conversation...';
  
  // 1. Remove [ITA] or [ENG] at the beginning
  let cleanedTitle = title.replace(/^\s*\[(ITA|ENG)\]\s*/i, '');
  
  // 2. Remove timestamp in format YYYY-MM-DD HH:MM:SS at the end
  cleanedTitle = cleanedTitle.replace(/\s-\s\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2}.*$/, '');
  
  // 3. Handle "brainstorming-[topic]-[timestamp]" format
  if (cleanedTitle.match(/^brainstorming-.*-\d+$/i)) {
    // Extract the middle part (the topic) using a more flexible regex
    const match = cleanedTitle.match(/^brainstorming-(.*?)-\d+$/i);
    if (match && match[1]) {
      // Replace underscores with spaces and capitalize first letter of each word
      cleanedTitle = match[1].replace(/_/g, ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    }
  }
  
  // 4. Handle "Brainstorming su/on [topic]" format
  const brainstormingMatch = cleanedTitle.match(/^Brainstorming (?:su|on) (.*)$/i);
  if (brainstormingMatch && brainstormingMatch[1]) {
    cleanedTitle = brainstormingMatch[1];
  }
  
  return cleanedTitle;
};

// Main Component
function ConversationDetails({ conversationId, mostRecentConversation }) {
  // All state declarations - including the showSummary state
  const [messages, setMessages] = useState([]);
  const [summary, setSummary] = useState(null);
  const [formattedTitle, setFormattedTitle] = useState('Loading Conversation...');
  const [message, setMessage] = useState("");
  const [haiku, setHaiku] = useState('');
  const [botPersonalities, setBotPersonalities] = useState({ AI1: null, AI2: null });
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [error, setError] = useState(null);
  const [topic, setTopic] = useState("");
  const [progress, setProgress] = useState(0);
  const [rawTitle, setRawTitle] = useState("");
  const [showSummary, setShowSummary] = useState(true);
  
  // UI states
  const [canSendMessage, setCanSendMessage] = useState(true);
  const [showMessages, setShowMessages] = useState(false);
  const [showHaiku, setShowHaiku] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [userHasScrolled, setUserHasScrolled] = useState(false);
  const [showAI1Typing, setShowAI1Typing] = useState(false);
  const [showAI2Typing, setShowAI2Typing] = useState(false);
  const [isProcessingUserMessage, setIsProcessingUserMessage] = useState(false);
  const [mobileInputExpanded, setMobileInputExpanded] = useState(false);
  const [open, setOpen] = useState(false);
  const [sentMessage, setSentMessage] = useState("");
  const [lastMessageId, setLastMessageId] = useState(null);
  
  // References
  const messagesEndRef = useRef(null);
  const lastMessageRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const isInitialRender = useRef(true);
  const scrollTimer = useRef(null);
  const isManualScroll = useRef(false);
  const isInitialLoad = useRef(true);

  // Media queries
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  
  // Debug logging
  const DEBUG = true;
  const debug = (message) => {
    if (DEBUG) {
      console.log(`[ConversationDetails] ${message}`);
    }
  };
  
  // Check if this is the active conversation
  const isActiveConversation = conversationId === mostRecentConversation;

  // IMPLEMENTATION OF ALL FUNCTIONS
  
  // Format title when rawTitle changes
  useEffect(() => {
    if (rawTitle) {
      const cleaned = cleanTitle(rawTitle);
      console.log(`Raw title: ${rawTitle}, Cleaned title: ${cleaned}`);
      setFormattedTitle(cleaned);
    }
  }, [rawTitle]);
  
  useEffect(() => {
    if (messages.length > 0) {
      const aiMessages = messages.filter(msg => msg.speaker === 'AI1' || msg.speaker === 'AI2');
      // CORREZIONE: Usare CONVERSATION_LENGTH come numero target di messaggi AI
      const targetAIMessages = CONVERSATION_LENGTH;
      console.log(`AI Messages: ${aiMessages.length} of expected ${targetAIMessages}`);
  
      // CORREZIONE: usare targetAIMessages nel calcolo
      const calculatedProgress = Math.min(100, Math.round((aiMessages.length / targetAIMessages) * 100));
      console.log(`Progress calculation: ${aiMessages.length} messages out of ${targetAIMessages} = ${calculatedProgress}%`);
  
      setProgress(calculatedProgress);
    } else {
      setProgress(0);
    }
  }, [messages]);
  
  // Check for duplicate user messages
  const hasDuplicateUserMessages = (msgList) => {
    if (!msgList || msgList.length < 2) return false;
    
    const userMessages = msgList.filter(msg => msg.speaker === 'User');
    
    const messageCounts = {};
    for (const msg of userMessages) {
      const content = msg.message.trim();
      messageCounts[content] = (messageCounts[content] || 0) + 1;
      
      if (messageCounts[content] > 1) {
        return true;
      }
    }
    return false;
  };
  
  // Reset state when conversation changes
  useEffect(() => {
    debug(`Conversation changed to: ${conversationId}, most recent: ${mostRecentConversation}`);
    
    // Reset all states
    setMessages([]);
    setSummary(null);
    setHaiku('');
    setShowMessages(conversationId === mostRecentConversation);
    setShowHaiku(false);
    setUserHasScrolled(false);
    setShowAI1Typing(false);
    setShowAI2Typing(false);
    setFormattedTitle('Loading Conversation...');
    setRawTitle('');
    setBotPersonalities({ AI1: null, AI2: null });
    setIsProcessingUserMessage(false);
    setMobileInputExpanded(false);
    setSentMessage("");
    setCanSendMessage(true);
    setProgress(0);
    setTopic("");
    setLastMessageId(null);
    isInitialRender.current = true;
    isInitialLoad.current = true;
    
    // Only proceed if we have a valid conversation ID
    if (!conversationId) return;
    
    // Load all data for this conversation
    loadConversationData();
    
    // Setup polling ONLY for the most recent conversation
    let intervalId;
    if (conversationId === mostRecentConversation) {
      debug("Setting up polling for most recent conversation");
      intervalId = setInterval(() => {
        if (conversationId === mostRecentConversation) {
          fetchMessages();
        }
      }, 3000);
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [conversationId, mostRecentConversation]);
  
  // Load conversation data
  const loadConversationData = async () => {
    if (!conversationId) return;
    
    setIsLoading(true);
    
    try {
      debug(`Loading conversation data for ID: ${conversationId}`);
      
      // 1. Fetch conversation details
      const detailsResponse = await fetch(`${API_BASE_URL}/api/conversations/${conversationId}`);
      
      if (detailsResponse.ok) {
        const detailsData = await detailsResponse.json();
        if (detailsData) {
          console.log("Conversation details:", detailsData);
          if (detailsData.title) {
            setRawTitle(detailsData.title);
          }
          if (detailsData.topic) {
            setTopic(detailsData.topic);
          }
        }
      }
      
      // 2. Fetch summary (if available)
      try {
        const summaryResponse = await fetch(`${API_BASE_URL}/api/conversations/${conversationId}/summary`);
        
        if (summaryResponse.ok) {
          const summaryData = await summaryResponse.json();
          console.log("Summary data received:", summaryData);
          
          if (summaryData && Object.keys(summaryData).length > 0) {
            setSummary(summaryData);
            if (summaryData.title) {
              setRawTitle(summaryData.title);
            }
            if (summaryData.topic) {
              setTopic(summaryData.topic);
            }
            if (summaryData.haiku) {
              setHaiku(summaryData.haiku);
            }
          } else {
            console.log("Empty summary data received");
          }
        } else {
          console.log(`Summary fetch failed with status: ${summaryResponse.status}`);
        }
      } catch (summaryError) {
        console.error('Error fetching summary:', summaryError);
      }
      
      // 3. Fetch bot personalities (if available)
      try {
        const personalitiesResponse = await fetch(`${API_BASE_URL}/api/conversations/${conversationId}/personalities`);
        
        if (personalitiesResponse.ok) {
          const personalitiesData = await personalitiesResponse.json();
          if (personalitiesData) {
            setBotPersonalities(personalitiesData);
          }
        }
      } catch (personalitiesError) {
        console.error('Error fetching bot personalities:', personalitiesError);
      }
      
      // 4. Fetch messages
      await fetchMessages();
      
    } catch (error) {
      console.error('Error loading conversation data:', error);
      setError('Failed to load conversation data');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fetch and update messages
  const fetchMessages = async () => {
    if (!conversationId) return;
    
    try {
      debug(`Fetching messages for conversation ID: ${conversationId}`);
      const response = await fetch(`${API_BASE_URL}/api/conversations/${conversationId}/messages`);
      
      if (!response.ok) {
        throw new Error(`Network error: ${response.status}`);
      }
      
      const data = await response.json();
      debug(`Received ${data.length} messages from server`);
      
      // Filter duplicate user messages if needed
      if (hasDuplicateUserMessages(data)) {
        debug("FOUND DUPLICATE USER MESSAGES! Filtering...");
        
        const uniqueMessages = [];
        const seenUserMessages = new Set();
        
        for (const msg of data) {
          if (msg.speaker === 'User') {
            const content = msg.message.trim();
            if (seenUserMessages.has(content)) {
              debug(`Skipping duplicate user message: "${content}"`);
              continue;
            }
            seenUserMessages.add(content);
          }
          uniqueMessages.push(msg);
        }
        
        setMessages(uniqueMessages);
        debug(`Filtered ${data.length - uniqueMessages.length} duplicate messages`);
      } else {
        setMessages(data);
      }
      
      // Check for new messages
      const newLastMessageId = data.length > 0 ? data[data.length - 1].id : null;
      setLastMessageId(newLastMessageId);
      
      // No longer initial render after first load
      isInitialRender.current = false;
      
      // Check for sent message in response
      if (sentMessage && data.some(msg => msg.speaker === 'User' && msg.message === sentMessage)) {
        debug("Found sent message in server response, clearing.");
        setSentMessage("");
      }
      
      setLastUpdated(new Date());
      updateApplicationState(data);
      
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Updated application state logic
  const updateApplicationState = (messagesList) => {
    // Se la lista dei messaggi è vuota
    if (!messagesList || messagesList.length === 0) {
      // Se l'utente ha appena inviato un messaggio (sentMessage è popolato),
      // è probabile che stiamo aspettando la risposta di AI1.
      // Manteniamo l'indicatore di AI1 attivo ottimisticamente.
      if (sentMessage) {
        debug("Nessun messaggio dal server, ma un messaggio utente è in attesa. AI1 typing rimane attivo ottimisticamente.");
        setShowAI1Typing(true);
        setShowAI2Typing(false); // AI2 non dovrebbe scrivere ora
        setCanSendMessage(false); // L'utente non dovrebbe inviare di nuovo immediatamente
        setIsProcessingUserMessage(true); // Stiamo processando
      } else {
        // La conversazione è genuinamente vuota o resettata, nessun messaggio in attesa
        debug("Nessun messaggio dal server e nessun messaggio utente in attesa. Indicatori di typing spenti.");
        setCanSendMessage(true);
        setIsProcessingUserMessage(false);
        setShowAI1Typing(false);
        setShowAI2Typing(false);
      }
      return;
    }

    // Se ci sono messaggi, procedi con la logica esistente
    const lastMessage = messagesList[messagesList.length - 1];
    debug(`Last message from: ${lastMessage.speaker}`);

    // MODIFIED RULES FOR MESSAGING BEHAVIOR AND TYPING INDICATORS:

    // 1. If the last message is from a User, show AI1 is typing
    if (lastMessage.speaker === 'User') {
      debug("Last message from User - showing AI1 typing");
      setCanSendMessage(false);
      setIsProcessingUserMessage(true);
      setShowAI1Typing(true);
      setShowAI2Typing(false);
    }
    // 2. If the last message is from AI1, show AI2 is typing
    else if (lastMessage.speaker === 'AI1') {
      debug("Last message from AI1 - showing AI2 typing");
      setCanSendMessage(false);
      setIsProcessingUserMessage(true);
      setShowAI1Typing(false);
      setShowAI2Typing(true);
    }
    // 3. For all other speakers (AI2, System), don't show typing
    else {
      debug(`Last message from ${lastMessage.speaker} - no typing indicators`);
      setCanSendMessage(true);
      setIsProcessingUserMessage(false);
      setShowAI1Typing(false);
      setShowAI2Typing(false);
    }
  };

  // Send message function
  const sendMessage = async (userMsg) => {
    try {
      debug(`Sending message to server: "${userMsg}"`);
      
      const response = await fetch(`${API_BASE_URL}/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg,
          speaker: 'User'
        })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to send message: ${response.status}`);
      }
      
      debug("Message sent successfully to server");
      
      // Save sent message to verify in future responses
      setSentMessage(userMsg);
      
      // Show typing indicator immediately
      setShowAI1Typing(true);
      
      // Update messages after a short delay
      setTimeout(() => {
        fetchMessages();
      }, 1000);
      
      return true;
    } catch (error) {
      console.error('Error sending message:', error);
      setError(`Failed to send message: ${error.message}`);
      return false;
    }
  };
  
  // Handle send button click
  const handleSendMessage = async () => {
    if (!message.trim() || !conversationId || !canSendMessage) {
      debug("Message send aborted - conditions not met");
      return;
    }
    
    try {
      // Disable sending immediately
      setCanSendMessage(false);
      setIsProcessingUserMessage(true);
      
      // Store message locally
      const userMsg = message.trim();
      
      // Clear input and close dialogs
      setMessage("");
      setOpen(false);
      setMobileInputExpanded(false);
      
      // Reset scroll state
      setUserHasScrolled(false);
      
      // Show typing indicator
      setShowAI1Typing(true);
      
      // Send message to server
      const success = await sendMessage(userMsg);
      
      if (!success) {
        // If sending failed, re-enable button and hide typing
        setCanSendMessage(true);
        setIsProcessingUserMessage(false);
        setShowAI1Typing(false);
        return;
      }
      
    } catch (error) {
      console.error('Error in send message flow:', error);
      setError(`Failed to send message: ${error.message}`);
      
      // Re-enable on error
      setCanSendMessage(true);
      setIsProcessingUserMessage(false);
      setShowAI1Typing(false);
    }
  };
  
  // Auto-clear typing indicators
  useEffect(() => {
    if (showAI1Typing || showAI2Typing) {
      const timeoutId = setTimeout(() => {
        debug("Auto-clearing typing indicators after timeout");
        setShowAI1Typing(false);
        setShowAI2Typing(false);
      }, 30000); // 30 seconds max wait
      
      return () => clearTimeout(timeoutId);
    }
  }, [showAI1Typing, showAI2Typing]);
  
  // Toggle messages visibility
  const handleToggleMessages = () => {
    setShowMessages(!showMessages);
    if (showHaiku) {
      setShowHaiku(false);
    }
    
    // Reset scroll state when toggling
    if (!showMessages) {
      setUserHasScrolled(false);
      isInitialRender.current = true;
    }
  };
  
  // Toggle haiku visibility
  const handleShowHaikuInline = () => {
    setShowHaiku(!showHaiku);
    if (showMessages) {
      setShowMessages(false);
    }
  };
  
  // Manual refresh
  const handleRefresh = () => {
    fetchMessages();
  };
  
  // Text-to-speech for summary
  const speakSummary = () => {
    if (!summary || !summary.summary) return;
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    } else {
      const utterance = new SpeechSynthesisUtterance(summary.summary);
      utterance.lang = 'en-US';
      utterance.rate = 0.7;
      let voices = window.speechSynthesis.getVoices().filter(voice => voice.lang === 'en-US');
      if (voices.length > 0) {
        utterance.voice = voices[0];
      }
      window.speechSynthesis.speak(utterance);
    }
  };
  
  // Mobile input controls
  const toggleMobileInput = () => {
    setMobileInputExpanded(!mobileInputExpanded);
  };
  
  const handleCloseMobileInput = () => {
    setMobileInputExpanded(false);
  };
  
  // Dialog controls
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
  
  // Render message bubble
  const renderMessageBubble = (msg, index) => {
    const isLastMessage = index === messages.length - 1;
    
    // Styling based on speaker
    let backgroundColor = '#aeb9cc';
    let avatarColor = '#757575';
    let foregroundColor = '#f8f8f2';
    let floatDirection = 'left';

    if (msg.speaker === 'AI1') {
      backgroundColor = 'rgba(68,71,90,0.7)';
      avatarColor = '#bd93f9';
      foregroundColor = '#f8f8f2';
      floatDirection = 'left';
    } else if (msg.speaker === 'AI2') {
      backgroundColor = 'rgba(98,114,164,0.7)';
      avatarColor = '#ff79c6';
      foregroundColor = '#f8f8f2';
      floatDirection = 'right';
    } else if (msg.speaker === 'User') {
      backgroundColor = 'rgba(68,71,90,0.5)';
      avatarColor = '#757575';
      foregroundColor = '#f8f8f2';
      floatDirection = 'right';
    }

    return (
      <Box
        key={msg.id || `msg-${index}`} // Fallback to index if id is not available
        ref={isLastMessage ? lastMessageRef : null}
        sx={{
          backgroundColor,
          color: foregroundColor,
          margin: '10px 0',
          padding: '10px 20px',
          borderRadius: '10px',
          float: floatDirection,
          clear: 'both',
          maxWidth: '80%',
          transition: 'opacity 0.5s ease'
        }}
      >
        <Avatar
          sx={{
            marginRight: '10px',
            backgroundColor: avatarColor,
            color: '#f8f8f2',
            display: { sm: 'inline-flex', xs: 'none' }
          }}
        >
          {msg.speaker === 'User' ? <PersonIcon /> : msg.speaker}
        </Avatar>
        <Box>
          <ReactMarkdown>{msg.message}</ReactMarkdown>
          {msg.timestamp && (
            <Typography variant="caption" sx={{ opacity: 0.7, display: 'block' }}>
              {new Date(msg.timestamp).toLocaleTimeString()}
            </Typography>
          )}
        </Box>
      </Box>
    );
  };
  
  // Render bot personalities section
  const renderBotPersonalities = () => {
    const hasPersonalities = 
      botPersonalities.AI1 || botPersonalities.AI2;
      
    if (!hasPersonalities) return null;
    
    return (
      <Box sx={{ mb: 3 }}>
        <Accordion defaultExpanded={false}>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="bot-personalities-content"
            id="bot-personalities-header"
            sx={{ color: draculaTheme.foreground }}
          >
            <Typography variant="h6">Bot Personalities</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              {botPersonalities.AI1 && (
                <Grid item xs={12} md={6}>
                  <Paper 
                    elevation={2} 
                    sx={{ 
                      p: 2, 
                      bgcolor: 'rgba(68,71,90,0.5)',
                      height: '100%',
                      color: draculaTheme.foreground
                    }}
                  >
                    <Typography variant="h6" sx={{ color: draculaTheme.purple, fontWeight: 'bold', mb: 1 }}>
                      AI1
                    </Typography>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                      Personality:
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                      {botPersonalities.AI1.prompt}
                    </Typography>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                      Background:
                    </Typography>
                    <Typography variant="body2">
                      {botPersonalities.AI1.description}
                    </Typography>
                  </Paper>
                </Grid>
              )}
              
              {botPersonalities.AI2 && (
                <Grid item xs={12} md={6}>
                  <Paper 
                    elevation={2} 
                    sx={{ 
                      p: 2, 
                      bgcolor: 'rgba(98,114,164,0.5)',
                      height: '100%',
                      color: draculaTheme.foreground
                    }}
                  >
                    <Typography variant="h6" sx={{ color: draculaTheme.pink, fontWeight: 'bold', mb: 1 }}>
                      AI2
                    </Typography>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                      Personality:
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                      {botPersonalities.AI2.prompt}
                    </Typography>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                      Background:
                    </Typography>
                    <Typography variant="body2">
                      {botPersonalities.AI2.description}
                    </Typography>
                  </Paper>
                </Grid>
              )}
            </Grid>
          </AccordionDetails>
        </Accordion>
      </Box>
    );
  };

  // Base container style
  const containerStyle = {
    backgroundColor: draculaTheme.background,
    color: draculaTheme.foreground,
    minHeight: '100vh',
    position: 'relative',
    padding: '10px',
    border: 'none',
    outline: 'none'
  };

  // RENDER METHOD
  return (
    <div style={containerStyle}>
      {/* Animation style for typing dots and hidden scrollbar */}
      <style>{animationKeyframes}</style>
      
      {/* Loading indicator */}
      {isLoading && (
        <CircularProgress
          sx={{ position: 'absolute', top: 10, right: 10, zIndex: 9999 }}
        />
      )}
      
      {/* Error display */}
      {error && (
        <Typography color="error" sx={{ mt: 2, mb: 2 }}>
          {error}
        </Typography>
      )}
      
      {/* Header with title and refresh button */}
      <Box sx={{ 
      position: 'sticky',
      top: 0,
      zIndex: 10,
      backgroundColor: draculaTheme.background,
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center',
      padding: '10px 0',
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
    }}>
      <Typography 
        variant={isMobile ? "h5" : "h4"} 
        sx={{ 
          color: draculaTheme.foreground
        }}
      >
        {formattedTitle}
      </Typography>
      {!isMobile && (
        <Box>
          <Typography 
            variant="caption" 
            sx={{ 
              mr: 1,
              color: draculaTheme.comment
            }}
          >
            Updated: {lastUpdated.toLocaleTimeString()}
          </Typography>
          <IconButton 
            onClick={handleRefresh} 
            disabled={isLoading}
            sx={{ 
              color: draculaTheme.foreground
            }}
          >
            <RefreshIcon />
          </IconButton>
        </Box>
      )}
    </Box>
     
    <Box sx={{ 
      overflow: 'auto',
      position: 'relative'
    }}>
        {/* Progress bar - SOLO per conversazioni attive/in corso */}
        {isActiveConversation && (
          <Box sx={{
              flexGrow:1,
              overflow: 'auto', 
              width: '100%', 
              mt: 1, 
              mb: 1 
              }}>
            <Typography 
              variant="caption" 
              display="block" 
              sx={{ 
                mb: 1,
                color: draculaTheme.comment
              }}
            >
              Conversation progress: {progress}%
            </Typography>
            <LinearProgress 
              variant="determinate" 
              value={progress} 
              sx={{ 
                height: 8, 
                borderRadius: 2,
                backgroundColor: 'rgba(40, 42, 54, 0.5)',
                '& .MuiLinearProgress-bar': {
                  backgroundColor: draculaTheme.purple
                }
              }} 
            /> 
          </Box>
        )}
    
      
      <Divider sx={{ 
        marginTop: '10px', 
        marginBottom: '20px',
        backgroundColor: draculaTheme.comment
      }} />
      
      {/* Bot personalities section */}
      {renderBotPersonalities()}

      {/* Collapsible Summary section */}
      {summary && summary.summary && (
        <Accordion 
          defaultExpanded={showSummary}
          sx={{
            backgroundColor: 'rgba(40, 42, 54, 0.3)',
            color: draculaTheme.foreground,
            boxShadow: 'none',
            '&:before': {
              display: 'none', // Remove the default divider
            },
            mb: 3
          }}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon sx={{ color: draculaTheme.foreground }} />}
            sx={{ 
              padding: '0 8px',
              '& .MuiAccordionSummary-content': {
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }
            }}
          >
            <Typography variant="h5" sx={{ color: draculaTheme.foreground }}>
              Summary
            </Typography>
            <IconButton 
              onClick={(e) => {
                e.stopPropagation(); // Prevent accordion from toggling
                speakSummary();
              }}
              sx={{ color: draculaTheme.foreground }}
            >
              <VolumeUpIcon />
            </IconButton>
          </AccordionSummary>
          <AccordionDetails>
            <Box
              sx={{
                color: draculaTheme.foreground,
                padding: '0 12px 12px'
              }}
            >
              <Box>{summary.summary}</Box>
              {summary.hashtags && (
                <Box
                  sx={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '10px',
                    marginTop: '10px'
                  }}
                >
                  {summary.hashtags.split(',').map((hashtag) => (
                    <Chip
                      key={hashtag.trim()}
                      label={hashtag.trim()}
                      variant="outlined"
                      size="small"
                      style={{ 
                        color: draculaTheme.foreground, 
                        borderColor: draculaTheme.comment
                      }}
                    />
                  ))}
                </Box>
              )}
            </Box>
          </AccordionDetails>
        </Accordion>
      )}
      </Box>

      {/* Action buttons (Show messages and Show haiku) in a single row with more space */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'flex-start', 
        gap: 4,
        mt: 4,
        mb: 4
      }}>
        {/* Show Messages button only if summary exists */}
        {summary && summary.summary && (
          <Button
            variant="contained"
            onClick={handleToggleMessages}
            sx={{ 
              backgroundColor: showMessages ? draculaTheme.pink : draculaTheme.purple,
              '&:hover': {
                backgroundColor: showMessages ? draculaTheme.pink : draculaTheme.purple,
                opacity: 0.8
              }
            }}
          >
            {showMessages ? 'Hide Messages' : 'Show Messages'}
          </Button>
        )}

        {/* Show Haiku button only if haiku exists */}
        {haiku && (
          <Button
            variant="contained"
            onClick={handleShowHaikuInline}
            sx={{ 
              backgroundColor: showHaiku ? draculaTheme.pink : draculaTheme.purple,
              '&:hover': {
                backgroundColor: showHaiku ? draculaTheme.pink : draculaTheme.purple,
                opacity: 0.8
              }
            }}
          >
            {showHaiku ? 'Hide Haiku' : 'Show Haiku'}
          </Button>
        )}
      </Box>

      {/* Haiku content */}
      {showHaiku && haiku && (
        <Paper
          elevation={3}
          sx={{
            p: 3,
            mb: 4,
            backgroundColor: 'rgba(40, 42, 54, 0.5)',
            color: draculaTheme.foreground,
            borderLeft: `4px solid ${draculaTheme.orange}`,
            fontStyle: 'italic',
            lineHeight: 2
          }}
        >
          <Typography variant="body1" component="div" sx={{ whiteSpace: 'pre-line' }}>
            {haiku}
          </Typography>
        </Paper>
      )}

      {/* Messages section with typing indicators */}
      {showMessages && (
        <Box 
          ref={messagesContainerRef}
          className="hide-scrollbar" // Classe CSS per nascondere la scrollbar
          sx={{ 
            maxHeight: '60vh',
            p: 2,
            borderRadius: '8px',
            bgcolor: 'rgba(40, 42, 54, 0.3)',
            border: 'none',
            outline: 'none',
            overflow: 'auto'
          }}
        >
          {messages.length > 0 ? (
            <>
              {/* Messages from server */}
              {messages.map((msg, i) => renderMessageBubble(msg, i))}
              
              {/* Typing indicators */}
              {showAI1Typing && <AI1TypingIndicator />}
              {showAI2Typing && <AI2TypingIndicator />}
            </>
          ) : (
            <Typography 
              variant="body1" 
              sx={{ 
                textAlign: 'center', 
                my: 4,
                color: draculaTheme.comment
              }}
            >
              {isLoading ? 'Loading messages...' : 'No messages found for this conversation.'}
            </Typography>
          )}
          <div ref={messagesEndRef} style={{ clear: 'both' }} />
        </Box>
      )}

      {/* Desktop message input - only for most recent conversation and not completed */}
      {!isMobile && conversationId === mostRecentConversation && progress < 100 && (
        <>
          {isProcessingUserMessage ? (
            <Fab
              sx={{
                position: 'fixed', 
                bottom: '16px', 
                right: '16px',
                backgroundColor: draculaTheme.purple
              }}
              disabled
              aria-label="processing"
            >
              <CircularProgress size={24} color="inherit" />
            </Fab>
          ) : (
            <Tooltip title={canSendMessage ? "Send a message" : "Please wait for bot response"}>
              <span style={{ position: 'fixed', bottom: '16px', right: '16px' }}>
                <Fab
                  sx={{
                    backgroundColor: draculaTheme.purple,
                    '&:hover': {
                      backgroundColor: draculaTheme.pink
                    }
                  }}
                  aria-label="add"
                  onClick={handleOpen}
                  disabled={!canSendMessage}
                >
                  <AddIcon />
                </Fab>
              </span>
            </Tooltip>
          )}
          
          <Dialog
            fullScreen={fullScreen}
            open={open}
            onClose={handleClose}
            PaperProps={{
              style: {
                position: 'absolute',
                bottom: 0,
                right: 80,
                maxWidth: fullScreen ? '100%' : '60%',
                width: '100%',
                borderRadius: 5,
                backgroundColor: draculaTheme.background,
                color: draculaTheme.foreground,
                border: 'none'
              }
            }}
          >
            <Box sx={{ p: 2 }}>
              <Grid container alignItems="center">
                <Grid item xs={11.5}>
                  <TextField
                    autoFocus
                    margin="dense"
                    label="Your Message"
                    type="text"
                    fullWidth
                    variant="standard"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey && canSendMessage) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    sx={{
                      '& .MuiInputBase-input': {
                        color: draculaTheme.foreground,
                      },
                      '& .MuiInputLabel-root': {
                        color: draculaTheme.comment,
                      },
                      '& .MuiInput-underline:before': {
                        borderBottomColor: draculaTheme.comment,
                      },
                      '& .MuiInput-underline:hover:not(.Mui-disabled):before': {
                        borderBottomColor: draculaTheme.purple,
                      },
                      '& .MuiInput-underline:after': {
                        borderBottomColor: draculaTheme.purple,
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={0.5}>
                  <IconButton
                    sx={{ color: draculaTheme.purple }}
                    onClick={handleSendMessage}
                    disabled={!message.trim() || !canSendMessage}
                  >
                    <SendIcon />
                  </IconButton>
                </Grid>
              </Grid>
            </Box>
          </Dialog>
        </>
      )}

      {/* Mobile message input - only for most recent conversation and not completed */}
      {isMobile && conversationId === mostRecentConversation && progress < 100 && (
        <>
          {/* Collapsed Button (shown when input is hidden) */}
          {!mobileInputExpanded && !isProcessingUserMessage && (
            <Zoom in={!mobileInputExpanded}>
              <Tooltip title={canSendMessage ? "Send a message" : "Please wait for bot response"}>
                <span style={{ position: 'fixed', bottom: '16px', right: '16px' }}>
                  <Fab
                    sx={{
                      backgroundColor: draculaTheme.purple,
                      '&:hover': {
                        backgroundColor: draculaTheme.pink
                      }
                    }}
                    aria-label="message"
                    onClick={toggleMobileInput}
                    disabled={!canSendMessage}
                  >
                    <MessageIcon />
                  </Fab>
                </span>
              </Tooltip>
            </Zoom>
          )}
          
          {/* Processing indicator (shown when analyzing message) */}
          {isProcessingUserMessage && (
            <Fab
              sx={{
                position: 'fixed', 
                bottom: '16px', 
                right: '16px',
                backgroundColor: draculaTheme.purple
              }}
              disabled
              aria-label="processing"
            >
              <CircularProgress size={24} color="inherit" />
            </Fab>
          )}
          
          {/* Expanded input box */}
          <Collapse in={mobileInputExpanded} timeout="auto">
            <Box
              sx={{
                p: 2,
                position: 'fixed',
                display: 'flex',
                flexDirection: 'column',
                bottom: 0,
                left: 0,
                right: 0,
                width: '100%',
                backgroundColor: draculaTheme.background,
                color: draculaTheme.foreground,
                borderTop: `1px solid ${draculaTheme.comment}`,
                zIndex: 999,
                border: 'none'
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="subtitle1">Send a message</Typography>
                <IconButton 
                  size="small" 
                  onClick={handleCloseMobileInput}
                  sx={{ color: draculaTheme.foreground }}
                >
                  <CloseIcon />
                </IconButton>
              </Box>
              
              <TextField
                autoFocus
                margin="dense"
                placeholder="Your message..."
                multiline
                rows={2}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                variant="outlined"
                InputProps={{
                  style: { 
                    color: draculaTheme.foreground, 
                    borderColor: draculaTheme.comment 
                  }
                }}
                sx={{ 
                  mb: 1,
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                      borderColor: draculaTheme.comment,
                      border: 'none'
                    },
                    '&:hover fieldset': {
                      borderColor: draculaTheme.purple,
                      border: 'none'
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: draculaTheme.purple,
                      border: 'none'
                    },
                  }
                }}
              />
              
              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button 
                  variant="contained" 
                  endIcon={<SendIcon />}
                  onClick={handleSendMessage}
                  disabled={!message.trim() || !canSendMessage}
                  sx={{ 
                    backgroundColor: draculaTheme.purple,
                    '&:hover': {
                      backgroundColor: draculaTheme.pink
                    }
                  }}
                >
                  Send
                </Button>
              </Box>
            </Box>
          </Collapse>
        </>
      )}
      
      {/* Improved Scroll to Bottom Button */}
      {userHasScrolled && (
        <Zoom in={userHasScrolled}>
          <Fab
            size="medium"
            color="primary"
            sx={{
              position: 'fixed',
              bottom: '80px',
              right: '20px',
              backgroundColor: draculaTheme.purple,
              '&:hover': {
                backgroundColor: draculaTheme.pink
              },
              zIndex: 1000, // Higher z-index to ensure visibility
            }}
            onClick={() => {
              setUserHasScrolled(false);
            }}
            aria-label="scroll to bottom"
          >
            <ArrowDownward />
          </Fab>
        </Zoom>
      )}
      
      {/* User message status - shows processing information */}
      {isProcessingUserMessage && (
        <Box 
          sx={{
            position: 'fixed',
            bottom: canSendMessage ? '70px' : '16px',
            left: '20px',
            backgroundColor: 'rgba(40, 42, 54, 0.9)',
            color: draculaTheme.foreground,
            padding: '8px 16px',
            borderRadius: '20px',
            zIndex: 10,
            boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            border: 'none'
          }}
        >
          <CircularProgress size={16} sx={{ color: draculaTheme.purple }} />
          <Typography variant="caption">Waiting for AI response...</Typography>
        </Box>
      )}
    </div>
  );
}

export default ConversationDetails;