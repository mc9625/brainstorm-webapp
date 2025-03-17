//////////////////////////////////////////
// server.js with configuration
//////////////////////////////////////////

const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const ENABLE_LOGS = false;

// Configura l'app Express
const app = express();

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  next();
});

// Safe logger function
function log(...args) {
  if (ENABLE_LOGS) {
    console.log(...args);
  }
}

app.use(cors());
app.use(express.json());

// Configurazione in uno specifico file di configurazione
const config = {
  db: {
    user: 'dbuser',
    host: 'aibook.nuvolaproject.cloud',
    database: 'brainstorm_db',
    password: 'mc9625',
    port: 5432,
  },
  server: {
    port: process.env.PORT || 5001
  }
};

// Configura la connessione a PostgreSQL
const pool = new Pool(config.db);

// Log initialization
console.log(`Connecting to PostgreSQL: ${config.db.host}:${config.db.port}`);
console.log(`Using database: ${config.db.database}`);

// Esempio: pageSize di default
const pageSize = 20;

// 1. Restituisce la lista di conversazioni con paginazione
app.get('/api/conversations', async (req, res) => {
  try {
    const { limit, lastLoaded } = req.query;
    const realLimit = limit ? parseInt(limit) : pageSize;
    
    let queryText, queryParams;
    if (lastLoaded) {
      queryText = `
        SELECT id, title, topic, timestamp
        FROM conversations
        WHERE timestamp < $1
        ORDER BY timestamp DESC
        LIMIT $2
      `;
      queryParams = [lastLoaded, realLimit];
    } else {
      queryText = `
        SELECT id, title, topic, timestamp
        FROM conversations
        ORDER BY timestamp DESC
        LIMIT $1
      `;
      queryParams = [realLimit];
    }

    const result = await pool.query(queryText, queryParams);
    
    let conversations = result.rows;
    let hasMore = false;
    let nextLastLoaded = null;

    if (conversations.length > 0) {
      nextLastLoaded = conversations[conversations.length - 1].timestamp;
      hasMore = conversations.length >= realLimit;
    }

    res.json({
      conversations,
      hasMore,
      nextLastLoaded
    });
  } catch (err) {
    if (ENABLE_LOGS) console.error('Error fetching conversations:', err);
    res.status(500).json({ error: 'Errore durante la query al database' });
  }
});

// 2. Restituisce i dettagli di una conversazione specifica
app.get('/api/conversations/:conversationId', async (req, res) => {
  const { conversationId } = req.params;
  try {
    const queryText = `
      SELECT id, title, topic, timestamp
      FROM conversations
      WHERE id = $1
    `;
    const result = await pool.query(queryText, [conversationId]);
    
    if (result.rows.length > 0) {
      res.json(result.rows[0]);
    } else {
      res.status(404).json({ error: 'Conversazione non trovata' });
    }
  } catch (error) {
    if (ENABLE_LOGS) console.error(`Error fetching conversation ${conversationId}:`, error);
    res.status(500).json({ error: 'Errore nel recupero della conversazione' });
  }
});

// 3. Restituisce i messaggi di una conversazione specifica (GET endpoint)
app.get('/api/conversations/:conversationId/messages', async (req, res) => {
  const { conversationId } = req.params;
  const { after_id } = req.query; // Optional parameter to fetch only messages after a certain ID
  
  try {
    log(`Fetching messages for conversation ID: ${conversationId}${after_id ? ` after ID ${after_id}` : ''}`);
    
    let queryText, queryParams;
    
    if (after_id) {
      // If after_id is provided, fetch only newer messages
      queryText = `
        SELECT id, speaker, message, timestamp
        FROM messages
        WHERE conversation_id = $1 AND id > $2
        ORDER BY timestamp ASC
      `;
      queryParams = [conversationId, after_id];
    } else {
      // Otherwise fetch all messages for this conversation
      queryText = `
        SELECT id, speaker, message, timestamp
        FROM messages
        WHERE conversation_id = $1
        ORDER BY timestamp ASC
      `;
      queryParams = [conversationId];
    }
    
    const result = await pool.query(queryText, queryParams);
    log(`Found ${result.rows.length} message(s) for conversation ${conversationId}`);
    
    res.json(result.rows);
  } catch (error) {
    console.error(`Error fetching messages for conversation ${conversationId}:`, error);
    res.status(500).json({ error: 'Errore nel recupero dei messaggi', details: error.message });
  }
});

// 4. Inserisce un nuovo messaggio nella conversazione (POST endpoint)
app.post('/api/conversations/:conversationId/messages', async (req, res) => {
  const { conversationId } = req.params;
  const { message, speaker } = req.body;

  try {
    log(`Adding new message to conversation ${conversationId} from ${speaker}: ${message.substring(0, 30)}${message.length > 30 ? '...' : ''}`);
    
    const queryText = `
      INSERT INTO messages (conversation_id, speaker, message)
      VALUES ($1, $2, $3)
      RETURNING id, timestamp
    `;
    
    const result = await pool.query(queryText, [conversationId, speaker, message]);
    log(`Message added successfully. ID: ${result.rows[0].id}`);
    
    // Return the newly inserted message data
    res.json(result.rows[0]);
  } catch (error) {
    console.error(`Error adding message to conversation ${conversationId}:`, error);
    res.status(500).json({ error: 'Errore nell\'inserimento del messaggio', details: error.message });
  }
});

// 5. Restituisce il summary di una conversazione
app.get('/api/conversations/:conversationId/summary', async (req, res) => {
  const { conversationId } = req.params;
  try {
    const queryText = `
      SELECT topic, summary, hashtags, title, haiku
      FROM summary
      WHERE conversation_id = $1
      LIMIT 1
    `;
    const result = await pool.query(queryText, [conversationId]);
    if (result.rows.length > 0) {
      res.json(result.rows[0]);
    } else {
      res.json({}); // nessun summary trovato
    }
  } catch (error) {
    if (ENABLE_LOGS) console.error(`Error fetching summary for conversation ${conversationId}:`, error);
    res.status(500).json({ error: 'Errore nel recupero del summary' });
  }
});

// 6. Restituisce contatori globali
app.get('/api/counters', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT total_conversations, total_messages
      FROM counters
    `);
    if (result.rows.length > 0) {
      res.json(result.rows[0]);
    } else {
      res.json({ totalConversations: 0, totalMessages: 0 });
    }
  } catch (err) {
    if (ENABLE_LOGS) console.error('Error fetching counters:', err);
    res.status(500).json({ error: 'Errore nella query dei contatori' });
  }
});

// 7. Restituisce le personalità dei bot per una conversazione
app.get('/api/conversations/:conversationId/personalities', async (req, res) => {
    const { conversationId } = req.params;
    try {
      log(`Fetching bot personalities for conversation ID: ${conversationId}`);
      
      const queryText = `
        SELECT bot_number, prompt, description
        FROM bot_personalities
        WHERE conversation_id = $1
        ORDER BY bot_number ASC
      `;
      
      const result = await pool.query(queryText, [conversationId]);
      log(`Found ${result.rows.length} bot personalities for conversation ${conversationId}`);
      
      if (result.rows.length > 0) {
        // Format the response as a more user-friendly object
        const personalities = {
          AI1: result.rows.find(row => row.bot_number === 1) || null,
          AI2: result.rows.find(row => row.bot_number === 2) || null
        };
        res.json(personalities);
      } else {
        res.json({});
      }
    } catch (error) {
      console.error(`Error fetching bot personalities for conversation ${conversationId}:`, error);
      res.status(500).json({ error: 'Errore nel recupero delle personalità dei bot', details: error.message });
    }
  });
  
// Debug endpoint to check the most recent conversations
app.get('/api/debug/conversations', async (req, res) => {
  try {
    log('Running debug query for conversations');
    
    // Get the 20 most recent conversations
    const result = await pool.query(`
      SELECT id, title, topic, timestamp
      FROM conversations
      ORDER BY timestamp DESC
      LIMIT 20
    `);
    
    // Get total count of conversations
    const countResult = await pool.query(`
      SELECT COUNT(*) as total
      FROM conversations
    `);
    
    // Return detailed information
    res.json({
      total: parseInt(countResult.rows[0].total),
      recentConversations: result.rows,
      serverTime: new Date().toISOString(),
      serverTimeLocal: new Date().toLocaleString()
    });
  } catch (err) {
    console.error('Error in debug endpoint:', err);
    res.status(500).json({ error: 'Debug query error', details: err.message });
  }
});

// Debug endpoint to check database tables
app.get('/api/debug/tables', async (req, res) => {
  try {
    log('Checking database tables');
    
    // Check which tables exist
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    const tablesResult = await pool.query(tablesQuery);
    
    // Get count of rows in each table
    const tables = tablesResult.rows.map(row => row.table_name);
    const counts = {};
    
    for (const table of tables) {
      const countQuery = `SELECT COUNT(*) as count FROM "${table}"`;
      try {
        const countResult = await pool.query(countQuery);
        counts[table] = parseInt(countResult.rows[0].count);
      } catch (e) {
        counts[table] = `Error: ${e.message}`;
      }
    }
    
    // Return detailed information
    res.json({
      tables,
      rowCounts: counts,
      serverTime: new Date().toISOString()
    });
  } catch (err) {
    console.error('Error in tables debug endpoint:', err);
    res.status(500).json({ error: 'Debug tables error', details: err.message });
  }
});

// Avvia il server
const PORT = config.server.port;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT} and listening on all network interfaces`);
  console.log(`API accessible locally at http://nuvolaproject.mooo.com:${PORT}/api`);
  console.log(`API accessible on the network at http://[your-ip]:${PORT}/api`);
});