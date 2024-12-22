const http = require('http');
const socketIo = require('socket.io');
const mysql = require('mysql2');
const fs = require('fs');
const path = require('path');

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'chat_db'
});

db.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
    return;
  }
  console.log('Connected to MySQL');
});

const server = http.createServer((req, res) => {
  if (req.url === '/') {
    fs.readFile(path.join(__dirname, 'public', 'index.html'), (err, content) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Error loading page');
      } else {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(content);
      }
    });
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('404 Not Found');
  }
});

const io = socketIo(server);

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);
///////
/*
socket.on('offer', (offer) => {
    socket.broadcast.emit('offer', offer);
  });

  socket.on('answer', (answer) => {
    socket.broadcast.emit('answer', answer);
  });

  socket.on('candidate', (candidate) => {
    socket.broadcast.emit('candidate', candidate);
  });
*/
  // Fetch messages with username and send to new user
  db.query('SELECT * FROM messages ORDER BY timestamp ASC', (err, results) => {
    if (err) {
      console.error('Error fetching messages:', err);
      return;
    }

    results.forEach((row) => {
      socket.emit('chat message', { name: row.name, message: row.message });
    });
  });

  // Listen to chat message events and save messages with username
  socket.on('chat message', ({ name, message }) => {
    db.query('INSERT INTO messages (name, message) VALUES (?, ?)', [name, message], (err) => {
      if (err) {
        console.error('Error saving message:', err);
        return;
      }

      io.emit('chat message', { name, message });
    });
  });

////
  socket.on('disconnect', () => {
    console.log('A user disconnected:', socket.id);
  });
});

server.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});
