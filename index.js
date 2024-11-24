import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import bodyParser from 'body-parser';
import http from 'http';
import { Server } from 'socket.io';
import moment from 'moment';
import connectDB from './db.js';
import dotenv from 'dotenv';
import serverless from 'serverless-http';

// Cargar las variables de entorno desde el archivo .env
dotenv.config();


// Importar las rutas
import clienteRoutes from './routes/clienteRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import Reserva from './models/reserva.js'; // Modelo de reservas
import Mesa from './models/mesa.js'; // Modelo de mesas


const app = express();
const server = http.createServer(app);
const io = new Server(server);
let socketsConnected = new Set();

// Obtener __dirname de manera compatible con ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware para parsear datos
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Middleware para ficheros estaticos
app.use(express.static(path.join(__dirname, './public'), {
  setHeaders: (res, path) => {
    if (path.endsWith('.js')) {
      res.type('application/javascript');
    };
  }
}));

// Configurar Pug como motor de vistas
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, './views'));

// Conectar a la base de datos
connectDB();

// Definir rutas
app.use('/api/cliente', clienteRoutes);
app.use('/api/admin', adminRoutes);


// Ruta principal
app.get('/', (req, res) => {
  res.render('home'); // Renderiza la vista 'home.pug'
});

app.get('/login', (req, res) => {
  res.render('login'); // Renderiza la vista 'login.pug'
});

// Ruta para manejar el inicio de sesión
app.post('/login', (req, res) => {
  const { username, password } = req.body; // Extraemos username y password del cuerpo de la solicitud

  // Simular autenticación
  if (username === 'admin' && password === 'adminpass') { // Verificamos si son las credenciales del admin
    res.redirect('/api/admin'); // Redirigimos al panel de administración
  } else {
    res.send('Credenciales incorrectas'); // Si las credenciales son incorrectas, enviamos un mensaje
  }
});

app.get('/interfazCliente', async (req, res) => {
  try {
    const reservas = await Reserva.find();
    res.render('interfazCliente', { reservas });
  } catch (error) {
    console.error('Error al cargar la interfaz del cliente:', error);
    res.status(500).send('Error interno del servidor');
  }
});

app.get('/chat', (req, res) => {
  res.render('chat'); // Renderiza la vista 'chat.pug'
});


// Ruta para el panel de administración
app.get('/api/admin', async (req, res) => {
  try {
    // Consultar reservas y mesas desde MongoDB
    const reservas = await Reserva.find();
    const mesas = await Mesa.find();

    res.render('adminPanel', {
      reservas,
      mesas,
    });
  } catch (error) {
    console.error('Error al cargar los datos desde MongoDB:', error);
    res.status(500).send('Error interno del servidor');
  }
});

// Ruta para el panel del cliente
app.get('/api/cliente', async (req, res) => {
  try {
    // Consultar reservas desde MongoDB
    const reservas = await Reserva.find();

    res.render('interfazCliente', {
      reservas,
    });
  } catch (error) {
    console.error('Error al cargar las reservas desde MongoDB:', error);
    res.status(500).send('Error interno del servidor');
  }
});

// Manejo de conexiones WebSocket
io.on('connection', onConnected);

function onConnected(socket) {
  console.log('Socket connected:', socket.id);
  socketsConnected.add(socket.id);
  io.emit('clients-total', socketsConnected.size);

  socket.on('disconnect', () => {
    console.log('Socket disconnected:', socket.id);
    socketsConnected.delete(socket.id);
    io.emit('clients-total', socketsConnected.size);
  });

  socket.on('message', (data) => {
    socket.broadcast.emit('chat-message', data);
  });

  socket.on('feedback', (data) => {
    socket.broadcast.emit('feedback', data);
  });
};

const PORT = process.env.PORT || 8000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});


export default serverless(app);