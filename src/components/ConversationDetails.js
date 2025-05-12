import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Avatar,
  Button,
  Chip,
  useTheme,
  Divider,
  useMediaQuery,
  Fab,
  Dialog,
  TextField,
  IconButton,
  Grid,
  CircularProgress,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Collapse,
  Zoom,
  Tooltip,
  LinearProgress
} from '@mui/material';
import {
  VolumeUp as VolumeUpIcon,
  Add as AddIcon,
  Send as SendIcon,
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  Close as CloseIcon,
  Message as MessageIcon,
  ArrowDownward
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
  let cleanedTitle = title.replace(/^\s*\[(ITA|ENG)\]\s*/i, '');
  cleanedTitle = cleanedTitle.replace(/\s-\s\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2}.*$/, '');
  if (cleanedTitle.match(/^brainstorming-.*-\d+$/i)) {
    const match = cleanedTitle.match(/^brainstorming-(.*?)-\d+$/i);
    if (match && match[1]) {
      cleanedTitle = match[1].replace(/_/g, ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    }
  }
  const brainstormingMatch = cleanedTitle.match(/^Brainstorming (?:su|on) (.*)$/i);
  if (brainstormingMatch && brainstormingMatch[1]) {
    cleanedTitle = brainstormingMatch[1];
  }
  return cleanedTitle;
};

// Main Component
function ConversationDetails({ conversationId, mostRecentConversation }) {
  // Stati principali
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
  const [isGeneratingPersonalities, setIsGeneratingPersonalities] = useState(false);
  const [shouldExpandPersonalities, setShouldExpandPersonalities] = useState(false);
  
  // Stati UI
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
  const [lastMessageId, setLastMessageId] = useState(null);
  
  // Stati per gestire i messaggi in attesa dell'utente
  const [pendingUserMessage, setPendingUserMessage] = useState("");
  const [isUserMessageProcessing, setIsUserMessageProcessing] = useState(false);
  
  // References
  const messagesEndRef = useRef(null);
  const lastMessageRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const isInitialRender = useRef(true);
  const isInitialLoad = useRef(true);
  // Refs aggiuntivi per tracciare lo stato di scroll
  const lastRenderedMessageId = useRef(null);
  const isAtBottomRef = useRef(true);
  const scrollTimeout = useRef(null);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  
  const DEBUG = true;
  const debug = (text) => {
    if (DEBUG) {
      console.log(`[ConversationDetails] ${text}`);
    }
  };
  
  const isActiveConversation = conversationId === mostRecentConversation;
  useEffect(() => {
    loadVoices();
  }, []);

  useEffect(() => {
    if (rawTitle) {
      const cleaned = cleanTitle(rawTitle);
      debug(`Raw title: ${rawTitle}, Cleaned title: ${cleaned}`);
      setFormattedTitle(cleaned);
    }
  }, [rawTitle]);
  
  useEffect(() => {
    if (messages.length > 0) {
      const aiMessages = messages.filter(msg => msg.speaker === 'AI1' || msg.speaker === 'AI2');
      debug(`AI Messages: ${aiMessages.length} of expected ${CONVERSATION_LENGTH * 2}`);
      const calculatedProgress = Math.min(100, Math.round((aiMessages.length / (CONVERSATION_LENGTH * 2)) * 100));
      debug(`Progress calculation: ${aiMessages.length} messages out of ${CONVERSATION_LENGTH * 2} = ${calculatedProgress}%`);
      setProgress(calculatedProgress);
    } else {
      setProgress(0);
    }
  }, [messages]);
  
  const hasDuplicateUserMessages = (msgList) => {
    if (!msgList || msgList.length < 2) return false;
    const userMessages = msgList.filter(msg => msg.speaker === 'User');
    const messageCounts = {};
    for (const msg of userMessages) {
      const content = msg.message.trim();
      messageCounts[content] = (messageCounts[content] || 0) + 1;
      if (messageCounts[content] > 1) return true;
    }
    return false;
  };
  
  useEffect(() => {
    debug(`Conversation changed to: ${conversationId}, most recent: ${mostRecentConversation}`);
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
    
    // Reset stati relativi ai messaggi utente
    setIsProcessingUserMessage(false);
    setIsUserMessageProcessing(false);
    setPendingUserMessage("");
    
    // Abilita il pulsante di invio solo se è la conversazione più recente e non completata
    setCanSendMessage(isActiveConversation && progress < 70);

    setMobileInputExpanded(false);
    setProgress(0);
    setTopic("");
    setLastMessageId(null);
    isInitialRender.current = true;
    isInitialLoad.current = true;
    // Reset dei nuovi refs aggiunti
    lastRenderedMessageId.current = null;
    isAtBottomRef.current = true;
    setIsGeneratingPersonalities(false);
    setShouldExpandPersonalities(false);
    
    if (!conversationId) return;
    
    loadConversationData();
    
    let intervalId;
    if (isActiveConversation) {
      debug("Setting up polling for most recent conversation");
      intervalId = setInterval(() => {
        if (isActiveConversation) {
          fetchMessages();
        }
      }, 3000);
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId);
      if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
    };
  }, [conversationId, mostRecentConversation]);
  
  const loadConversationData = async () => {
    if (!conversationId) return;
    setIsLoading(true);
    try {
      debug(`Loading conversation data for ID: ${conversationId}`);
      const detailsResponse = await fetch(`${API_BASE_URL}/api/conversations/${conversationId}`);
      if (detailsResponse.ok) {
        const detailsData = await detailsResponse.json();
        if (detailsData) {
          debug(`Conversation details: ${JSON.stringify(detailsData)}`);
          if (detailsData.title) setRawTitle(detailsData.title);
          if (detailsData.topic) setTopic(detailsData.topic);
        }
      }
      
      try {
        const summaryResponse = await fetch(`${API_BASE_URL}/api/conversations/${conversationId}/summary`);
        if (summaryResponse.ok) {
          const summaryData = await summaryResponse.json();
          debug(`Summary data received: ${JSON.stringify(summaryData)}`);
          if (summaryData && Object.keys(summaryData).length > 0) {
            setSummary(summaryData);
            if (summaryData.title) setRawTitle(summaryData.title);
            if (summaryData.topic) setTopic(summaryData.topic);
            if (summaryData.haiku) setHaiku(summaryData.haiku);
          } else {
            debug("Empty summary data received");
          }
        } else {
          debug(`Summary fetch failed with status: ${summaryResponse.status}`);
        }
      } catch (summaryError) {
        console.error('Error fetching summary:', summaryError);
      }
      
      try {
        setIsGeneratingPersonalities(true);
        const personalitiesResponse = await fetch(`${API_BASE_URL}/api/conversations/${conversationId}/personalities`);
        if (personalitiesResponse.ok) {
          const personalitiesData = await personalitiesResponse.json();
          if (personalitiesData && (personalitiesData.AI1 || personalitiesData.AI2)) {
            debug("Bot personalities loaded successfully");
            setBotPersonalities(personalitiesData);
            setShouldExpandPersonalities(true);
            setIsGeneratingPersonalities(false);
          } else {
            debug("Bot personalities not yet available, setting up polling");
            setIsGeneratingPersonalities(true);
          }
        } else {
          debug(`Failed to load personalities: ${personalitiesResponse.status}`);
          setIsGeneratingPersonalities(true);
        }
      } catch (personalitiesError) {
        console.error('Error fetching bot personalities:', personalitiesError);
        setIsGeneratingPersonalities(false);
      }
      await fetchMessages();
    } catch (error) {
      console.error('Error loading conversation data:', error);
      setError('Failed to load conversation data');
    } finally {
      setIsLoading(false);
    }
  };
  
  const fetchMessages = async () => {
    if (!conversationId) return;
    try {
      debug(`Fetching messages for conversation ID: ${conversationId}`);
      const response = await fetch(`${API_BASE_URL}/api/conversations/${conversationId}/messages`);
      if (!response.ok) throw new Error(`Network error: ${response.status}`);
      
      const data = await response.json();
      debug(`Received ${data.length} messages from server`);
      
      const pendingMsgTrimmed = pendingUserMessage ? pendingUserMessage.trim() : "";
      
      // Controlla se ci sono messaggi di sistema che indicano un messaggio utente rifiutato
      // o se il messaggio è stato approvato
      if (isUserMessageProcessing && pendingMsgTrimmed) {
        // Cerca se il messaggio è stato approvato
        const messageApproved = data.some(
          msg => msg.speaker === 'User' && msg.message.trim() === pendingMsgTrimmed
        );
        
        // Cerca se c'è un messaggio di sistema che indica rifiuto
        const systemMessages = data.filter(msg => msg.speaker === 'System');
        const hasRecentSystemMessage = systemMessages.length > 0;
        
        // Verifica se un messaggio di sistema è stato aggiunto dopo che abbiamo inviato il messaggio utente
        let hasNewSystemMessage = false;
        if (hasRecentSystemMessage) {
          const lastSystemMsg = systemMessages[systemMessages.length - 1];
          const systemMsgIndex = data.findIndex(m => m.id === lastSystemMsg.id);
          const userMsgIndex = data.findIndex(m => m.speaker === 'User' && m.message.trim() === pendingMsgTrimmed);
          
          // Se il messaggio di sistema è stato aggiunto dopo il nostro messaggio utente
          if (userMsgIndex !== -1 && systemMsgIndex > userMsgIndex) {
            hasNewSystemMessage = true;
          }
        }
        
        // CORREZIONE: Gestione corretta della sequenza di messaggi
        // Verificare se abbiamo una sequenza completa dopo l'approvazione del messaggio
        if (messageApproved) {
          const userMsgIndex = data.findIndex(msg => 
            msg.speaker === 'User' && msg.message.trim() === pendingMsgTrimmed
          );
          
          if (userMsgIndex !== -1) {
            const hasAI1Response = userMsgIndex < data.length - 1 && 
                                  data[userMsgIndex + 1].speaker === 'AI1';
                                  
            const hasAI2Response = userMsgIndex < data.length - 2 && 
                                  data[userMsgIndex + 1].speaker === 'AI1' && 
                                  data[userMsgIndex + 2].speaker === 'AI2';
            
            // Se abbiamo una sequenza completa o un messaggio di sistema di rifiuto
            if (hasAI2Response || hasNewSystemMessage) {
              debug(`Message processing complete or rejected. Resetting states.`);
              setIsUserMessageProcessing(false);
              setPendingUserMessage("");
              setIsProcessingUserMessage(false);
              
              // Reset canSendMessage solo se è una conversazione attiva e non completata
              setCanSendMessage(isActiveConversation && progress < 70);
            }
          }
        }
      }
      
      // Filtra i messaggi di sistema (non vogliamo mostrarli nella chat)
      let filteredMessages = data.filter(msg => msg.speaker !== 'System');
      
      // Gestisci duplicati se necessario
      if (hasDuplicateUserMessages(filteredMessages)) {
        debug("FOUND DUPLICATE USER MESSAGES! Filtering...");
        const uniqueMessages = [];
        const seenUserMessages = new Set();
        for (const msg of filteredMessages) {
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
        filteredMessages = uniqueMessages;
        debug(`Filtered ${data.length - filteredMessages.length} duplicate messages`);
      }
      
      // IMPORTANTE: Non bloccare la visualizzazione dei messaggi
      setMessages(filteredMessages);
      
      const newLastMessageId = filteredMessages.length > 0 ? filteredMessages[filteredMessages.length - 1].id : null;
      setLastMessageId(newLastMessageId);
      isInitialRender.current = false;
      
      setLastUpdated(new Date());
      updateApplicationState(data); // Passiamo i dati originali per gestire anche i messaggi di sistema
      
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };
  
  const updateApplicationState = (messagesList) => {
    debug(`Updating state. isUserMessageProcessing: ${isUserMessageProcessing}, pendingUserMessage: "${pendingUserMessage}", activeConv: ${isActiveConversation}, progress: ${progress}, numMessages: ${messagesList.length}`);
  
    // Caso di lista messaggi vuota
    if (!messagesList || messagesList.length === 0) {
      if (isUserMessageProcessing && pendingUserMessage) {
        debug("No messages from server, but user message pending. AI1 typing, send disabled.");
        setCanSendMessage(false);
        setShowAI1Typing(true);
        setShowAI2Typing(false);
      } else {
        debug("No messages from server, no user message pending. Indicators off, send enabled IF active and not complete.");
        setCanSendMessage(isActiveConversation && progress < 70);
        setIsProcessingUserMessage(false);
        setShowAI1Typing(false);
        setShowAI2Typing(false);
      }
      return;
    }
  
    // Trova l'ultimo messaggio non di sistema
    const nonSystemMessages = messagesList.filter(msg => msg.speaker !== 'System');
    const lastNonSystemMessage = nonSystemMessages.length > 0 ? nonSystemMessages[nonSystemMessages.length - 1] : null;
    const lastMessage = messagesList[messagesList.length - 1];
    
    // Controlla se l'ultimo messaggio è un messaggio di sistema (rifiuto)
    if (lastMessage.speaker === 'System' && isUserMessageProcessing) {
      debug("Last message is System while processing user message - message was rejected");
      // Messaggio utente rifiutato, reimposta tutti gli stati
      setIsUserMessageProcessing(false);
      setPendingUserMessage("");
      setIsProcessingUserMessage(false);
      setCanSendMessage(isActiveConversation && progress < 70);
      
      // Mantieni gli indicatori di digitazione come erano prima del messaggio utente
      if (lastNonSystemMessage) {
        if (lastNonSystemMessage.speaker === 'AI2') {
          if (isActiveConversation && progress < 100) {
            setShowAI1Typing(true);
            setShowAI2Typing(false);
          } else {
            setShowAI1Typing(false);
            setShowAI2Typing(false);
          }
        } else if (lastNonSystemMessage.speaker === 'AI1') {
          setShowAI1Typing(false);
          setShowAI2Typing(true);
        } else {
          setShowAI1Typing(false);
          setShowAI2Typing(false);
        }
      }
      return;
    }
    
    // CORREZIONE: Migliore gestione del flusso di conversazione
    // Gestisci il flusso di conversazione quando un messaggio utente è in elaborazione
    if (isUserMessageProcessing && pendingUserMessage) {
      const pendingMsgTrimmed = pendingUserMessage.trim();
      debug(`Processing pending user message: "${pendingMsgTrimmed}"`);
      
      // Durante l'elaborazione, l'utente non può inviare altri messaggi
      setCanSendMessage(false);
  
      // Verifica se il messaggio è stato approvato cercandolo nei messaggi
      const userMessages = nonSystemMessages.filter(msg => msg.speaker === 'User');
      const lastUserMessage = userMessages.length > 0 ? userMessages[userMessages.length - 1] : null;
      
      const messageApproved = lastUserMessage && lastUserMessage.message.trim() === pendingMsgTrimmed;
  
      if (messageApproved) {
        debug("User message was approved and is now in the conversation");
        
        // Trova l'indice del messaggio utente approvato
        const userMsgIndex = nonSystemMessages.findIndex(msg => 
          msg.speaker === 'User' && msg.message.trim() === pendingMsgTrimmed
        );
        
        // Importante: controllare se ci sono risposte dopo il messaggio utente
        if (userMsgIndex !== -1) {
          const hasAI1Response = userMsgIndex < nonSystemMessages.length - 1 && 
                                nonSystemMessages[userMsgIndex + 1].speaker === 'AI1';
                                
          const hasAI2Response = userMsgIndex < nonSystemMessages.length - 2 && 
                                nonSystemMessages[userMsgIndex + 1].speaker === 'AI1' && 
                                nonSystemMessages[userMsgIndex + 2].speaker === 'AI2';
          
          if (hasAI2Response) {
            // Sequenza completa - User, AI1, AI2
            debug("Complete sequence User->AI1->AI2. User can send again.");
            setIsUserMessageProcessing(false);
            setPendingUserMessage("");
            setIsProcessingUserMessage(false);
            setCanSendMessage(isActiveConversation && progress < 70);
            
            // Prepara per il prossimo ciclo
            if (isActiveConversation && progress < 100) {
              setShowAI1Typing(true);
              setShowAI2Typing(false);
            } else {
              setShowAI1Typing(false);
              setShowAI2Typing(false);
            }
          } else if (hasAI1Response) {
            // Solo risposta AI1, aspettiamo AI2
            debug("AI1 responded, waiting for AI2");
            setShowAI1Typing(false);
            setShowAI2Typing(true);
          } else {
            // Messaggio utente approvato, aspettiamo AI1
            debug("User message approved, waiting for AI1");
            setShowAI1Typing(true);
            setShowAI2Typing(false);
          }
        }
      } else {
        // Il messaggio non è ancora stato approvato o elaborato
        debug("User message not found in conversation yet");
        setShowAI1Typing(true);
        setShowAI2Typing(false);
      }
    } else {
      // Nessun messaggio utente in elaborazione, flusso normale
      debug("Normal conversation flow (no pending user message)");
      setCanSendMessage(isActiveConversation && progress < 70);
      
      if (lastNonSystemMessage) {
        if (lastNonSystemMessage.speaker === 'AI2') {
          // Dopo AI2, l'utente può inviare e AI1 si prepara per il prossimo turno
          debug("Last message is from AI2, user can send, AI1 preparing for next");
          if (isActiveConversation && progress < 100) {
            setShowAI1Typing(true);
            setShowAI2Typing(false);
          } else {
            setShowAI1Typing(false);
            setShowAI2Typing(false);
          }
        } else if (lastNonSystemMessage.speaker === 'AI1') {
          // Dopo AI1, aspettiamo AI2
          debug("Last message is from AI1, waiting for AI2");
          setShowAI1Typing(false);
          setShowAI2Typing(true);
        } else if (lastNonSystemMessage.speaker === 'User') {
          // Se l'ultimo messaggio è dell'utente
          debug("Last message is from User, waiting for AI1");
          setShowAI1Typing(true);
          setShowAI2Typing(false);
        }
      }
    }
  };
  
  const sendMessage = async (userMsg) => {
    try {
      debug(`Sending message to server: "${userMsg}"`);
      const response = await fetch(`${API_BASE_URL}/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg, speaker: 'User' })
      });
      if (!response.ok) throw new Error(`Failed to send message: ${response.status}`);
      debug("Message sent successfully to server");
      return true;
    } catch (error) {
      console.error('Error sending message:', error);
      setError(`Failed to send message: ${error.message}`);
      return false;
    }
  };
  
  const handleSendMessage = async () => {
    const userMsgTrimmed = message.trim();
    if (!userMsgTrimmed || !conversationId || !canSendMessage) {
      debug(`Message send aborted - conditions not met. Msg: "${userMsgTrimmed}", canSend: ${canSendMessage}`);
      return;
    }
    
    try {
      // Disabilita l'invio di messaggi durante l'elaborazione
      setCanSendMessage(false);
      
      // Salva il messaggio in attesa e imposta gli stati
      setIsUserMessageProcessing(true);
      setPendingUserMessage(userMsgTrimmed);
      setIsProcessingUserMessage(true);

      // Pulisci l'input e chiudi dialoghi
      setMessage("");
      setOpen(false);
      setMobileInputExpanded(false);
      
      // IMPORTANTE: NON cambiare gli indicatori di digitazione
      // Lascia che la conversazione continui il suo flusso naturale
      debug("User sent message. Not changing typing indicators to preserve conversation flow.");
      
      // Invia il messaggio al server
      const success = await sendMessage(userMsgTrimmed);
      
      if (success) {
        // Aspetta che fetchMessages recuperi il messaggio dal server SE è stato approvato
        fetchMessages();
        
        // Imposta un timeout per verificare se il messaggio è stato elaborato
        setTimeout(() => {
          if (isUserMessageProcessing) {
            debug("Checking message status after timeout");
            fetchMessages();
          }
        }, 5000); // 5 secondi per dare tempo al backend di processare
      } else {
        // Se l'invio fallisce, ripristina tutti gli stati
        setCanSendMessage(isActiveConversation && progress < 70);
        setIsProcessingUserMessage(false);
        setIsUserMessageProcessing(false);
        setPendingUserMessage("");
      }
    } catch (error) {
      console.error('Error in send message flow:', error);
      setError(`Failed to send message: ${error.message}`);
      
      // Ripristina tutti gli stati in caso di errore
      setCanSendMessage(isActiveConversation && progress < 70);
      setIsProcessingUserMessage(false);
      setIsUserMessageProcessing(false);
      setPendingUserMessage("");
    }
  };
  
  // Funzione per scorrere fino in fondo al container dei messaggi
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Auto-scroll to bottom per nuovi messaggi - IMPLEMENTAZIONE CORRETTA
  useEffect(() => {
    // Non fare scroll se non ci sono messaggi visibili
    if (!showMessages || !messagesContainerRef.current || messages.length === 0) return;

    const lastMsg = messages[messages.length - 1];
    const currentLastId = lastMsg ? lastMsg.id : null;

    // Determina se è effettivamente arrivato un nuovo messaggio
    const hasNewMessage = currentLastId !== lastRenderedMessageId.current;

    debug(`Check for auto-scroll: hasNewMessage=${hasNewMessage}, isInitialLoad=${isInitialLoad.current}, isAtBottom=${isAtBottomRef.current}`);

    // Condizioni per lo scroll:
    // 1. È il caricamento iniziale OPPURE
    // 2. È arrivato un nuovo messaggio E l'utente non ha scrollato manualmente
    if (isInitialLoad.current || (hasNewMessage && isAtBottomRef.current)) {
      scrollToBottom();
      lastRenderedMessageId.current = currentLastId;
      isInitialLoad.current = false;
      // Mantenere coerenza negli stati
      if (userHasScrolled) setUserHasScrolled(false);
      isAtBottomRef.current = true;
    }
  }, [messages, showMessages]);
  
  // Rilevamento dello scroll manuale con debounce
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container || !showMessages) return;
    
    const handleScroll = () => {
      // Debounce per evitare troppe chiamate durante lo scroll
      if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
      
      scrollTimeout.current = setTimeout(() => {
        const { scrollTop, scrollHeight, clientHeight } = container;
        const isNearBottom = scrollHeight - scrollTop - clientHeight < 50;

        debug(`Scroll detected: scrollTop=${scrollTop}, scrollHeight=${scrollHeight}, clientHeight=${clientHeight}, isNearBottom=${isNearBottom}`);

        // Aggiorna prima il ref, poi lo stato se necessario
        isAtBottomRef.current = isNearBottom;
        
        // Aggiorna lo stato solo se è davvero cambiato
        if (userHasScrolled !== !isNearBottom) {
          debug(`Updating userHasScrolled from ${userHasScrolled} to ${!isNearBottom}`);
          setUserHasScrolled(!isNearBottom);
        }
      }, 150);
    };
    
    container.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      container.removeEventListener('scroll', handleScroll);
      if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
    };
  }, [showMessages, userHasScrolled]);
  
  useEffect(() => {
    if (isGeneratingPersonalities && conversationId) {
      const pollInterval = setInterval(async () => {
        debug("Polling for bot personalities...");
        try {
          const personalitiesResponse = await fetch(`${API_BASE_URL}/api/conversations/${conversationId}/personalities`);
          if (personalitiesResponse.ok) {
            const personalitiesData = await personalitiesResponse.json();
            if (personalitiesData && (personalitiesData.AI1 || personalitiesData.AI2)) {
              debug("Bot personalities now available!");
              setBotPersonalities(personalitiesData);
              setShouldExpandPersonalities(true);
              setIsGeneratingPersonalities(false);
            }
          }
        } catch (error) {
          console.error("Error polling bot personalities:", error);
        }
      }, 3000);
      return () => clearInterval(pollInterval);
    }
  }, [isGeneratingPersonalities, conversationId]);

  // Auto-clear typing indicators e ripristino stati bloccati
  useEffect(() => {
    let timeoutId;
    let safetyTimerId;
    
    // Auto-clear per indicatori di digitazione
    if (showAI1Typing || showAI2Typing) {
      timeoutId = setTimeout(() => {
        // Auto-clear solo se non stiamo elaborando un messaggio utente specifico
        if (!isProcessingUserMessage) { 
            debug("Auto-clearing typing indicators after timeout (not processing user message).");
            setShowAI1Typing(false);
            setShowAI2Typing(false);
        } else {
            debug("Typing indicator timeout, but still processing user message. Not clearing.");
        }
      }, 30000); // 30 secondi massimo attesa
    }
    
    // Timer di sicurezza per sbloccare lo stato se un messaggio utente resta bloccato
    if (isUserMessageProcessing) {
      safetyTimerId = setTimeout(() => {
        debug("Safety timer triggered: Force reset message processing state");
        setIsUserMessageProcessing(false);
        setPendingUserMessage("");
        setIsProcessingUserMessage(false);
        setCanSendMessage(isActiveConversation && progress < 70);
        setShowAI1Typing(false);
        setShowAI2Typing(false);
      }, 30000); // 30 secondi di timeout di sicurezza
    }
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (safetyTimerId) clearTimeout(safetyTimerId);
    };
  }, [showAI1Typing, showAI2Typing, isProcessingUserMessage, isUserMessageProcessing, isActiveConversation, progress]);

  const handleToggleMessages = () => {
    setShowMessages(!showMessages);
    if (showHaiku) setShowHaiku(false);
    if (!showMessages) {
      setUserHasScrolled(false);
      isInitialRender.current = true;
      isInitialLoad.current = true;
      lastRenderedMessageId.current = null;
      isAtBottomRef.current = true;
    }
  };
  
  const handleShowHaikuInline = () => {
    setShowHaiku(!showHaiku);
    if (showMessages) setShowMessages(false);
  };
  
  const handleRefresh = () => {
    loadConversationData();
  };
  
  const speakSummary = () => {
    if (window.speechSynthesis.speaking) {
      // Ferma la sintesi vocale se è già in corso
      window.speechSynthesis.cancel();
      return;
    }
    
    // Ottieni il testo del sommario
    const textToSpeak = summary.summary;
    
    // Determina la lingua in base al contenuto e altri fattori
    const isItalian = determinaLinguaItaliana();
    const langCode = isItalian ? 'it-IT' : 'en-US';
    
    // Rileva se stiamo utilizzando macOS o iOS
    const isAppleDevice = /iPhone|iPad|iPod|Mac|Macintosh/i.test(navigator.userAgent);
    const isMacOS = /Mac|Macintosh/i.test(navigator.userAgent);
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    
    console.log(`Sintesi vocale: piattaforma rilevata - isAppleDevice: ${isAppleDevice}, isMacOS: ${isMacOS}, isIOS: ${isIOS}`);
    
    if (isAppleDevice) {
      // Approccio ottimizzato per dispositivi Apple (sia iOS che macOS)
      console.log(`Utilizzo approccio ottimizzato per ${isMacOS ? 'macOS' : 'iOS'}`);
      
      // Nota: non abbiamo bisogno di sbloccare l'AudioContext in un'applicazione React
      // poiché gli eventi utente già sbloccano l'audio
      
      // Crea l'utterance con il testo completo
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.lang = langCode;
      
      // Ottieni tutte le voci disponibili
      const voices = speechSynthesis.getVoices();
      
      if (voices.length > 0) {
        console.log("Voci disponibili:", voices.map(v => `${v.name} (${v.lang})`));
        
        // Trova la migliore voce italiana per dispositivi Apple
        let bestVoice = null;
        
        if (isItalian) {
          // Nomi delle voci di alta qualità su dispositivi Apple
          const premiumVoiceNames = ['Luca', 'Alice', 'Italian', 'Italiano', 'it-IT'];
          
          // Prima cerchiamo voci che contengono nomi specifici e sono in italiano
          for (const name of premiumVoiceNames) {
            bestVoice = voices.find(v => 
              v.lang.startsWith('it') && 
              v.name.includes(name)
            );
            
            if (bestVoice) {
              console.log(`Trovata voce premium: ${bestVoice.name} (${bestVoice.lang})`);
              break;
            }
          }
          
          // Se non troviamo voci premium, cerchiamo voci di sistema Apple in italiano
          if (!bestVoice) {
            bestVoice = voices.find(v => 
              v.lang.startsWith('it') && 
              (v.name.includes('Apple') || v.localService === true)
            );
            
            if (bestVoice) {
              console.log(`Trovata voce Apple: ${bestVoice.name} (${bestVoice.lang})`);
            }
          }
          
          // Se ancora non troviamo, usiamo qualsiasi voce italiana
          if (!bestVoice) {
            bestVoice = voices.find(v => v.lang.startsWith('it'));
            
            if (bestVoice) {
              console.log(`Trovata voce italiana generica: ${bestVoice.name} (${bestVoice.lang})`);
            }
          }
        } else {
          // Per l'inglese, cerchiamo voci di alta qualità
          bestVoice = voices.find(v => 
            v.lang.startsWith('en') && 
            (v.name.includes('Samantha') || v.name.includes('Alex') || v.name.includes('Daniel'))
          );
          
          if (!bestVoice) {
            bestVoice = voices.find(v => 
              v.lang.startsWith('en') && 
              (v.name.includes('Apple') || v.localService === true)
            );
          }
          
          if (!bestVoice) {
            bestVoice = voices.find(v => v.lang.startsWith('en'));
          }
        }
        
        // Imposta la voce trovata
        if (bestVoice) {
          console.log(`Usando voce: ${bestVoice.name} (${bestVoice.lang})`);
          utterance.voice = bestVoice;
        } else {
          console.warn(`Nessuna voce ${isItalian ? 'italiana' : 'inglese'} trovata`);
        }
      } else {
        console.warn("Nessuna voce disponibile!");
      }
      
      // Parametri ottimizzati per dispositivi Apple
      utterance.rate = isMacOS ? 0.95 : 1.0;  // Leggermente più lento su macOS
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      
      // Gestisci gli eventi
      utterance.onstart = () => {
        console.log(`Sintesi vocale avviata su ${isMacOS ? 'macOS' : 'iOS'}`);
      };
      
      utterance.onend = () => {
        console.log(`Sintesi vocale completata su ${isMacOS ? 'macOS' : 'iOS'}`);
      };
      
      utterance.onerror = (e) => {
        console.error(`Errore sintesi vocale su ${isMacOS ? 'macOS' : 'iOS'}:`, e);
      };
      
      // Avvia la sintesi vocale
      try {
        window.speechSynthesis.cancel(); // Cancella eventuali sintesi in corso
        window.speechSynthesis.speak(utterance);
      } catch (e) {
        console.error(`Errore durante l'avvio della sintesi vocale su ${isMacOS ? 'macOS' : 'iOS'}:`, e);
      }
    } else {
      // Approccio standard per altri dispositivi
      console.log("Utilizzo approccio standard per dispositivi non-Apple");
      
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.lang = langCode;
      
      // Cerca di trovare una voce adatta
      const voices = speechSynthesis.getVoices();
      
      if (voices.length > 0) {
        // Filtra le voci in base alla lingua
        const langVoices = voices.filter(v => v.lang.startsWith(isItalian ? 'it' : 'en'));
        
        // Cerca una voce di alta qualità
        let preferredVoice = langVoices.find(v => 
          v.name.includes('Neural') || 
          v.name.includes('Premium') || 
          v.name.includes('Enhanced') ||
          v.name.includes('Google')
        );
        
        // Se non trova una voce premium, usa la prima nella lingua corretta
        if (!preferredVoice && langVoices.length > 0) {
          preferredVoice = langVoices[0];
        }
        
        if (preferredVoice) {
          console.log(`Utilizzo voce: ${preferredVoice.name} (${preferredVoice.lang})`);
          utterance.voice = preferredVoice;
        }
      }
      
      // Parametri standard
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      
      try {
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
      } catch (e) {
        console.error("Errore durante l'avvio della sintesi vocale standard:", e);
      }
    }
  };
  
  const determinaLinguaItaliana = () => {
    // Utilizziamo il titolo raw non manipolato per trovare indicatori linguistici
    if (rawTitle) {
      // Cerca indicatori diretti di lingua italiana nel titolo
      if (rawTitle.includes('[ITA]') || 
          rawTitle.includes('Brainstorming su') || 
          (rawTitle.includes('brainstorming-') && !rawTitle.includes('brainstorming-on'))) {
        return true;
      }
    }
    
    // Controlla l'ID della conversazione per indicatori linguistici
    if (conversationId && typeof conversationId === 'string') {
      if (conversationId.includes('[ITA]') || conversationId.includes('Brainstorming su')) {
        return true;
      }
    }
    
    // Controlla il topic
    if (topic && typeof topic === 'string') {
      // Parole comuni in topic italiani
      const italianTopicWords = [
        'sostenibile', 'sviluppo', 'energia', 'ambiente', 'cultura', 
        'intelligenza', 'artificiale', 'digitale', 'educazione', 'italiana',
        'memoria', 'oblio', 'eredità', 'storia'
      ];
      
      const topicLower = topic.toLowerCase();
      for (const word of italianTopicWords) {
        if (topicLower.includes(word)) {
          return true;
        }
      }
    }
    
    // Analisi euristica del testo del sommario per determinare la lingua
    if (summary && summary.summary) {
      const text = summary.summary.toLowerCase();
      
      // Conta le occorrenze di parole comuni italiane vs inglesi
      const italianWords = ['il', 'la', 'di', 'che', 'è', 'sono', 'come', 'un', 'per', 'si', 'non', 'ma', 'ed', 'anche', 'più'];
      const englishWords = ['the', 'of', 'and', 'to', 'is', 'in', 'that', 'was', 'for', 'it', 'not', 'but', 'also', 'with', 'more'];
      
      let italianCount = 0;
      let englishCount = 0;
      
      italianWords.forEach(word => {
        // Usa una regex che trova solo parole complete (non parti di parole)
        const regex = new RegExp(`\\b${word}\\b`, 'g');
        const matches = text.match(regex);
        if (matches) italianCount += matches.length;
      });
      
      englishWords.forEach(word => {
        const regex = new RegExp(`\\b${word}\\b`, 'g');
        const matches = text.match(regex);
        if (matches) englishCount += matches.length;
      });
      
      console.log(`Analisi linguistica: parole italiane: ${italianCount}, parole inglesi: ${englishCount}`);
      
      // Se ci sono significativamente più parole italiane che inglesi, è probabilmente italiano
      if (italianCount > englishCount * 1.2) {
        return true;
      }
      
      // Se ci sono significativamente più parole inglesi che italiane, è probabilmente inglese
      if (englishCount > italianCount * 1.2) {
        return false;
      }
    }
    
    // Cerca nella lista degli hashtag (se disponibile)
    if (summary && summary.hashtags) {
      let hashtags = [];
      
      // Supporta sia array che stringa di hashtag
      if (Array.isArray(summary.hashtags)) {
        hashtags = summary.hashtags;
      } else if (typeof summary.hashtags === 'string') {
        hashtags = summary.hashtags.split(',');
      }
      
      // Controlla se gli hashtag contengono parole italiane
      for (const tag of hashtags) {
        const cleanTag = tag.trim().toLowerCase().replace('#', '');
        if (['tecnologia', 'cultura', 'arte', 'sostenibilità', 'scienza', 
             'innovazione', 'futuro', 'memoria', 'oblio', 'intelligenza'].includes(cleanTag)) {
          return true;
        }
      }
    }
    
    // Se non abbiamo informazioni sufficienti, di default usiamo l'italiano come richiesto
    return true;
  };
  
  // Funzione per caricare le voci disponibili all'avvio
  const loadVoices = () => {
    if (typeof speechSynthesis === 'undefined') {
      console.error("Web Speech API non supportata in questo browser");
      return;
    }
    
    // Rileva se stiamo utilizzando dispositivi Apple
    const isAppleDevice = /iPhone|iPad|iPod|Mac|Macintosh/i.test(navigator.userAgent);
    const isMacOS = /Mac|Macintosh/i.test(navigator.userAgent);
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    
    // Funzione per gestire le voci quando sono disponibili
    const handleVoicesChanged = () => {
      const voices = speechSynthesis.getVoices();
      console.log(`Sintesi vocale: ${voices.length} voci disponibili`);
      
      if (voices.length === 0) {
        console.warn("Nessuna voce disponibile!");
        return;
      }
      
      // Log più dettagliato per dispositivi Apple
      if (isAppleDevice) {
        console.log(`Dispositivo Apple rilevato: ${isMacOS ? 'macOS' : 'iOS'}`);
        
        // Filtra le voci italiane
        const italianVoices = voices.filter(voice => voice.lang.startsWith('it'));
        
        // Filtra le voci di sistema vs voci di rete
        const localVoices = voices.filter(voice => voice.localService === true);
        const remoteVoices = voices.filter(voice => voice.localService === false);
        
        console.log(`Voci italiane: ${italianVoices.length}`);
        console.log(`Voci di sistema: ${localVoices.length}`);
        console.log(`Voci di rete: ${remoteVoices.length}`);
        
        // Su macOS, verifica voci premium disponibili
        if (isMacOS) {
          const premiumVoiceNames = ['Luca', 'Alice', 'Italian', 'Italiano'];
          const premiumVoices = voices.filter(voice => 
            voice.lang.startsWith('it') && 
            premiumVoiceNames.some(name => voice.name.includes(name))
          );
          
          if (premiumVoices.length > 0) {
            console.log("Voci italiane premium disponibili su macOS:");
            premiumVoices.forEach(voice => {
              console.log(`- ${voice.name} (${voice.lang}, locale: ${voice.localService})`);
            });
          } else {
            console.warn("Nessuna voce italiana premium trovata su macOS");
          }
        }
      }
      
      // Mostra lista completa delle voci in modalità sviluppo
      if (process.env.NODE_ENV === 'development' || isAppleDevice) {
        console.group('Lista completa voci');
        voices.forEach(voice => {
          console.log(`${voice.name} (${voice.lang}) - Default: ${voice.default}, Locale: ${voice.localService}`);
        });
        console.groupEnd();
      }
      
      // Suggerimento per macOS se non ci sono voci italiane
      if (isMacOS && voices.filter(voice => voice.lang.startsWith('it')).length === 0) {
        console.warn("IMPORTANTE: Su macOS potrebbe essere necessario installare voci italiane da Preferenze di Sistema > Accessibilità > Contenuti vocali > Voce di sistema");
      }
    };
    
    // Verifica se l'evento onvoiceschanged è supportato
    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = handleVoicesChanged;
    } else {
      // Prova subito, potrebbero essere già disponibili
      const voices = speechSynthesis.getVoices();
      if (voices && voices.length > 0) {
        handleVoicesChanged();
      } else {
        // Ultima risorsa: riprova dopo un breve ritardo
        setTimeout(handleVoicesChanged, 100);
        
        // Su Safari/macOS, potrebbe servire un timeout più lungo
        if (isAppleDevice) {
          setTimeout(handleVoicesChanged, 1000);
        }
      }
    }
    
    // Forza il primo caricamento
    speechSynthesis.getVoices();
    
    // Su macOS, potremmo avere bisogno di forzare il caricamento multiplo
    if (isMacOS) {
      setTimeout(() => { 
        const voices = speechSynthesis.getVoices();
        if (voices && voices.length > 0) {
          handleVoicesChanged();
        }
      }, 500);
    }
  };

  const toggleMobileInput = () => setMobileInputExpanded(!mobileInputExpanded);
  const handleCloseMobileInput = () => setMobileInputExpanded(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
  
  const renderMessageBubble = (msg, index) => {
    const isLastMessage = index === messages.length - 1;
    
    // Non mostrare messaggi di sistema
    if (msg.speaker === 'System') {
      return null;
    }
    
    // CORREZIONE: Questo è il blocco problematico che impedisce la visualizzazione dei messaggi
    // Logica semplificata per mostrare correttamente i messaggi degli utenti e dei bot
    if (msg.speaker === 'User') {
      // Se il messaggio utente è duplicato (abbiamo già un sistema di filtro duplicati)
      // o se è in pending e non è stato ancora elaborato, lo nascondiamo
      const isPendingMessage = isUserMessageProcessing && 
                              pendingUserMessage &&
                              msg.message.trim() === pendingUserMessage.trim() &&
                              index === messages.length - 1;
      
      if (isPendingMessage) {
        // Solo il messaggio utente in attesa viene nascosto, ma non blocchiamo gli altri
        return null;
      }
    }
  
    // Il resto della funzione rimane invariato
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
      backgroundColor = 'rgba(67, 108, 76, 0.5)';
      avatarColor = '#757575';
      foregroundColor = '#f8f8f2';
      floatDirection = 'right';
    }
  
    return (
      <Box
        key={msg.id || `msg-${index}-${msg.timestamp}`}
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
          width: 'fit-content',
        }}
      >
        <Box sx={{display: 'flex', alignItems: 'flex-start', gap: 1}}>
          <Avatar
            sx={{
              backgroundColor: avatarColor,
              color: draculaTheme.background,
              width: 30, height: 30, fontSize: '0.9rem'
            }}
          >
            {msg.speaker === 'User' ? <PersonIcon sx={{fontSize: '1rem'}} /> : msg.speaker}
          </Avatar>
          <Box>
            <ReactMarkdown>{msg.message}</ReactMarkdown>
          </Box>
        </Box>
        {msg.timestamp && (
          <Typography variant="caption" sx={{ opacity: 0.7, display: 'block', textAlign: 'right', fontSize: '0.7rem', mt: 0.5 }}>
            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Typography>
        )}
      </Box>
    );
  };
  
  const renderBotPersonalities = () => {
    const hasPersonalities = botPersonalities.AI1 || botPersonalities.AI2;
    if (!hasPersonalities && !isGeneratingPersonalities) return null;
    return (
      <Box sx={{ mb: 3 }}>
        <Accordion 
          defaultExpanded={shouldExpandPersonalities}
          onChange={(_, expanded) => { if (expanded && shouldExpandPersonalities) setShouldExpandPersonalities(false); }}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="bot-personalities-content"
            id="bot-personalities-header"
            sx={{ color: draculaTheme.foreground }}
          >
            <Typography variant="h6">
              Bot Personalities
              {isGeneratingPersonalities && (
                <Box component="span" sx={{ ml: 2, display: 'inline-flex', alignItems: 'center' }}>
                  <CircularProgress size={16} sx={{ mr: 1 }} />
                  <Typography variant="caption">Generating personalities...</Typography>
                </Box>
              )}
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            {hasPersonalities ? (
              <Grid container spacing={2}>
                {botPersonalities.AI1 && (
                  <Grid item xs={12} md={6}>
                    <Paper elevation={2} sx={{ p: 2, bgcolor: 'rgba(68,71,90,0.5)', height: '100%', color: draculaTheme.foreground }}>
                      <Typography variant="h6" sx={{ color: draculaTheme.purple, fontWeight: 'bold', mb: 1 }}>AI1</Typography>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>Personality:</Typography>
                      <Typography variant="body2" sx={{ mb: 2 }}>{botPersonalities.AI1.prompt}</Typography>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>Background:</Typography>
                      <Typography variant="body2">{botPersonalities.AI1.description}</Typography>
                    </Paper>
                  </Grid>
                )}
                {botPersonalities.AI2 && (
                  <Grid item xs={12} md={6}>
                    <Paper elevation={2} sx={{ p: 2, bgcolor: 'rgba(98,114,164,0.5)', height: '100%', color: draculaTheme.foreground }}>
                      <Typography variant="h6" sx={{ color: draculaTheme.pink, fontWeight: 'bold', mb: 1 }}>AI2</Typography>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>Personality:</Typography>
                      <Typography variant="body2" sx={{ mb: 2 }}>{botPersonalities.AI2.prompt}</Typography>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>Background:</Typography>
                      <Typography variant="body2">{botPersonalities.AI2.description}</Typography>
                    </Paper>
                  </Grid>
                )}
              </Grid>
            ) : (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <CircularProgress size={30} />
                <Typography variant="body1" sx={{ mt: 2 }}>Personalità dei bot in fase di generazione...</Typography>
                <Typography variant="caption" sx={{ display: 'block', mt: 1, color: draculaTheme.comment }}>Questo processo potrebbe richiedere alcuni secondi.</Typography>
              </Box>
            )}
          </AccordionDetails>
        </Accordion>
      </Box>
    );
  };

  const containerStyle = {
    backgroundColor: draculaTheme.background,
    color: draculaTheme.foreground,
    minHeight: '100vh',
    position: 'relative',
    padding: '10px',
    border: 'none',
    outline: 'none'
  };

  return (
    <div style={containerStyle}>
      <style>{animationKeyframes}</style>
      
      {isLoading && <CircularProgress sx={{ position: 'absolute', top: 10, right: 10, zIndex: 9999 }} />}
      
      {error && <Typography color="error" sx={{ mt: 2, mb: 2 }}>{error}</Typography>}
      
      <Box sx={{ 
        position: 'sticky', top: 0, zIndex: 10, backgroundColor: draculaTheme.background,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '10px 0', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
      }}>
        <Typography variant={isMobile ? "h5" : "h4"} sx={{ color: draculaTheme.foreground }}>{formattedTitle}</Typography>
        {!isMobile && (
          <Box>
            <Typography variant="caption" sx={{ mr: 1, color: draculaTheme.comment }}>Updated: {lastUpdated.toLocaleTimeString()}</Typography>
            <IconButton onClick={handleRefresh} disabled={isLoading} sx={{ color: draculaTheme.foreground }}><RefreshIcon /></IconButton>
          </Box>
        )}
      </Box>
     
      <Box sx={{ overflow: 'auto', position: 'relative' }}>
        {isActiveConversation && (
          <Box sx={{ flexGrow:1, overflow: 'auto', width: '100%', mt: 1, mb: 1 }}>
            <Typography variant="caption" display="block" sx={{ mb: 1, color: draculaTheme.comment }}>Conversation progress: {progress}%</Typography>
            <LinearProgress 
              variant="determinate" value={progress} 
              sx={{ height: 8, borderRadius: 2, backgroundColor: 'rgba(40, 42, 54, 0.5)', '& .MuiLinearProgress-bar': { backgroundColor: draculaTheme.purple }}} 
            /> 
          </Box>
        )}
        <Divider sx={{ marginTop: '10px', marginBottom: '20px', backgroundColor: draculaTheme.comment }} />
        {renderBotPersonalities()}
        {summary && summary.summary && (
          <Accordion 
            defaultExpanded={showSummary}
            sx={{ backgroundColor: 'rgba(40, 42, 54, 0.3)', color: draculaTheme.foreground, boxShadow: 'none', '&:before': { display: 'none' }, mb: 3 }}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon sx={{ color: draculaTheme.foreground }} />}
              sx={{ padding: '0 8px', '& .MuiAccordionSummary-content': { display: 'flex', alignItems: 'center', gap: 1 }}}
            >
              <Typography variant="h5" sx={{ color: draculaTheme.foreground }}>Summary</Typography>
              <IconButton onClick={(e) => { e.stopPropagation(); speakSummary(); }} sx={{ color: draculaTheme.foreground }}><VolumeUpIcon /></IconButton>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ color: draculaTheme.foreground, padding: '0 12px 12px' }}>
                <ReactMarkdown>{summary.summary}</ReactMarkdown>
                {summary.hashtags && (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '10px' }}>
                    {summary.hashtags.split(',').map((hashtag) => (
                      <Chip key={hashtag.trim()} label={hashtag.trim()} variant="outlined" size="small" style={{ color: draculaTheme.foreground, borderColor: draculaTheme.comment }}/>
                    ))}
                  </Box>
                )}
              </Box>
            </AccordionDetails>
          </Accordion>
        )}
      </Box>

      {(summary && summary.summary) || haiku ? (
        <Box sx={{ display: 'flex', justifyContent: 'flex-start', gap: 4, mt: 4, mb: 4 }}>
          {summary && summary.summary && (
            <Button
              variant="contained" onClick={handleToggleMessages}
              sx={{ backgroundColor: showMessages ? draculaTheme.pink : draculaTheme.purple, '&:hover': { backgroundColor: showMessages ? draculaTheme.pink : draculaTheme.purple, opacity: 0.8 }}}
            >{showMessages ? 'Hide Messages' : 'Show Messages'}</Button>
          )}
          {haiku && (
            <Button
              variant="contained" onClick={handleShowHaikuInline}
              sx={{ backgroundColor: showHaiku ? draculaTheme.pink : draculaTheme.purple, '&:hover': { backgroundColor: showHaiku ? draculaTheme.pink : draculaTheme.purple, opacity: 0.8 }}}
            >{showHaiku ? 'Hide Haiku' : 'Show Haiku'}</Button>
          )}
        </Box>
      ) : null}

      {showHaiku && haiku && (
        <Paper elevation={3} sx={{ p: 3, mb: 4, backgroundColor: 'rgba(40, 42, 54, 0.5)', color: draculaTheme.foreground, borderLeft: `4px solid ${draculaTheme.orange}`, fontStyle: 'italic', lineHeight: 2 }}>
          <Typography variant="body1" component="div" sx={{ whiteSpace: 'pre-line' }}>{haiku}</Typography>
        </Paper>
      )}

      {showMessages && (
        <Box 
          ref={messagesContainerRef} className="hide-scrollbar"
          sx={{ 
            // Usiamo un'altezza molto grande che simula il comportamento senza maxHeight
            // ma mantiene la funzionalità di overflow e scrolling del container
            maxHeight: { xs: '60vh', sm: '70vh', md: '75vh' }, 
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
              {messages.map((msg, i) => renderMessageBubble(msg, i))}
              {showAI1Typing && isActiveConversation && progress < 100 && <AI1TypingIndicator />}
              {showAI2Typing && isActiveConversation && progress < 100 && <AI2TypingIndicator />}
            </>
          ) : (
            <Typography variant="body1" sx={{ textAlign: 'center', my: 4, color: draculaTheme.comment }}>
              {isLoading ? 'Loading messages...' : 'No messages found for this conversation.'}
            </Typography>
          )}
          <div ref={messagesEndRef} style={{ clear: 'both', height: '1px' }} />
        </Box>
      )}

      {!isMobile && isActiveConversation && progress < 100 && (
        <>
          {isProcessingUserMessage ? (
            <Fab sx={{ position: 'fixed', bottom: '16px', right: '16px', backgroundColor: draculaTheme.purple }} disabled aria-label="processing">
              <CircularProgress size={24} color="inherit" />
            </Fab>
          ) : (
            <Tooltip title={canSendMessage ? "Send a message" : "Please wait for AI response"}>
              <span style={{ position: 'fixed', bottom: '16px', right: '16px' }}>
                <Fab
                  sx={{ backgroundColor: draculaTheme.purple, '&:hover': { backgroundColor: draculaTheme.pink }}}
                  aria-label="add" onClick={handleOpen} disabled={!canSendMessage}
                ><AddIcon /></Fab>
              </span>
            </Tooltip>
          )}
          
          <Dialog
            fullScreen={fullScreen} open={open} onClose={handleClose}
            PaperProps={{ style: {
                position: 'absolute', bottom: 0, right: 80,
                maxWidth: fullScreen ? '100%' : '60%', width: '100%',
                borderRadius: 5, backgroundColor: draculaTheme.background, color: draculaTheme.foreground, border: 'none'
            }}}
          >
            <Box sx={{ p: 2 }}>
              <Grid container alignItems="center">
                <Grid item xs={11.5}>
                  <TextField
                    autoFocus margin="dense" label="Your Message" type="text" fullWidth variant="standard" value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={(e) => { if (e.key === 'Enter' && !e.shiftKey && canSendMessage && message.trim()) { e.preventDefault(); handleSendMessage(); }}}
                    sx={{
                      '& .MuiInputBase-input': { color: draculaTheme.foreground },
                      '& .MuiInputLabel-root': { color: draculaTheme.comment },
                      '& .MuiInput-underline:before': { borderBottomColor: draculaTheme.comment },
                      '& .MuiInput-underline:hover:not(.Mui-disabled):before': { borderBottomColor: draculaTheme.purple },
                      '& .MuiInput-underline:after': { borderBottomColor: draculaTheme.purple }
                    }}
                  />
                </Grid>
                <Grid item xs={0.5}>
                  <IconButton sx={{ color: draculaTheme.purple }} onClick={handleSendMessage} disabled={!message.trim() || !canSendMessage}><SendIcon /></IconButton>
                </Grid>
              </Grid>
            </Box>
          </Dialog>
        </>
      )}

      {isMobile && isActiveConversation && progress < 100 && (
        <>
          {!mobileInputExpanded && !isProcessingUserMessage && (
            <Zoom in={!mobileInputExpanded && !isProcessingUserMessage}>
              <Tooltip title={canSendMessage ? "Send a message" : "Please wait for AI response"}>
                <span style={{ position: 'fixed', bottom: '16px', right: '16px' }}>
                  <Fab
                    sx={{ backgroundColor: draculaTheme.purple, '&:hover': { backgroundColor: draculaTheme.pink }}}
                    aria-label="message" onClick={toggleMobileInput} disabled={!canSendMessage}
                  ><MessageIcon /></Fab>
                </span>
              </Tooltip>
            </Zoom>
          )}
          
          {isProcessingUserMessage && (
            <Fab sx={{ position: 'fixed', bottom: '16px', right: '16px', backgroundColor: draculaTheme.purple }} disabled aria-label="processing">
              <CircularProgress size={24} color="inherit" />
            </Fab>
          )}
          
          <Collapse in={mobileInputExpanded} timeout="auto" unmountOnExit>
            <Box
              sx={{
                p: 2, position: 'fixed', display: 'flex', flexDirection: 'column',
                bottom: 0, left: 0, right: 0, width: '100%',
                backgroundColor: draculaTheme.background, color: draculaTheme.foreground,
                borderTop: `1px solid ${draculaTheme.comment}`, zIndex: 999, border: 'none'
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, alignItems: 'center' }}>
                <Typography variant="subtitle1">Send a message</Typography>
                <IconButton size="small" onClick={handleCloseMobileInput} sx={{ color: draculaTheme.foreground }}><CloseIcon /></IconButton>
              </Box>
              
              <TextField
                autoFocus margin="dense" placeholder="Your message..." multiline rows={2} value={message}
                onChange={(e) => setMessage(e.target.value)} variant="outlined" fullWidth
                InputProps={{ style: { color: draculaTheme.foreground, borderColor: draculaTheme.comment }}}
                sx={{ 
                  mb: 1,
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': { borderColor: draculaTheme.comment, border: 'none' },
                    '&:hover fieldset': { borderColor: draculaTheme.purple, border: 'none' },
                    '&.Mui-focused fieldset': { borderColor: draculaTheme.purple, border: 'none' },
                  }
                }}
              />
              
              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button 
                  variant="contained" endIcon={<SendIcon />} onClick={handleSendMessage}
                  disabled={!message.trim() || !canSendMessage}
                  sx={{ backgroundColor: draculaTheme.purple, '&:hover': { backgroundColor: draculaTheme.pink }}}
                >Send</Button>
              </Box>
            </Box>
          </Collapse>
        </>
      )}
      
      {/* Pulsante "Scroll to Bottom" - IMPLEMENTAZIONE MIGLIORATA */}
      {userHasScrolled && showMessages && (
        <Zoom in={userHasScrolled}>
          <Fab
            size="medium"
            sx={{
              position: 'fixed',
              bottom: isMobile ? (mobileInputExpanded ? '150px' : '80px') : '80px',
              right: '20px',
              backgroundColor: draculaTheme.purple,
              color: draculaTheme.foreground,
              '&:hover': { backgroundColor: draculaTheme.pink },
              zIndex: 1000,
            }}
            onClick={() => { 
              scrollToBottom();
              // Fondamentale: reset degli stati di scroll
              setUserHasScrolled(false);
              isAtBottomRef.current = true;
            }}
            aria-label="scroll to bottom"
          ><ArrowDownward /></Fab>
        </Zoom>
      )}
      
      {/* Messaggio di stato durante l'elaborazione del messaggio utente */}
      {isUserMessageProcessing && (
        <Box 
          sx={{
            position: 'fixed',
            bottom: (isMobile && mobileInputExpanded) ? '130px' : (canSendMessage ? '70px' : '16px'),
            left: '50%', transform: 'translateX(-50%)',
            backgroundColor: 'rgba(40, 42, 54, 0.9)', color: draculaTheme.foreground,
            padding: '8px 16px', borderRadius: '20px', zIndex: 1001,
            boxShadow: '0 2px 10px rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', gap: 1,
            border: 'none'
          }}
        >
          <CircularProgress size={16} sx={{ color: draculaTheme.purple }} />
          <Typography variant="caption">User message is getting processed...</Typography>
        </Box>
      )}
    </div>
  );
}

export default ConversationDetails;