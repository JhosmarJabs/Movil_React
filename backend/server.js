const app = require('./app');

// Solo configurar HTTP normal para Vercel
const PORT = process.env.PORT || 5000;

// Verificar si estamos en producción (Vercel)
if (process.env.NODE_ENV === 'production') {
  // Para Vercel: exportar directamente la aplicación Express
  module.exports = app;
} else {
  // Para desarrollo local: configurar servidor HTTP, socket.io y MQTT
  const http = require('http');
  const socketIo = require('socket.io');
  const mqtt = require('mqtt');
  
  const server = http.createServer(app);

  // Inicializar WebSockets
  const io = socketIo(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  io.on('connection', (socket) => {
    console.log('Cliente conectado a WebSockets');

    socket.on('mensaje', (data) => {
      console.log('Mensaje recibido:', data);
    });

    socket.on('disconnect', () => {
      console.log('Cliente desconectado');
    });
  });

  // Configurar conexión a MQTT (si usas IoT con MQTT)
  try {
    const mqttClient = mqtt.connect('mqtt://broker.hivemq.com'); // Cambia por tu broker MQTT

    mqttClient.on('connect', () => {
      console.log('Conectado a MQTT');
      mqttClient.subscribe('iot/datos');
    });

    mqttClient.on('message', (topic, message) => {
      console.log(`Mensaje MQTT recibido: ${message.toString()}`);
      io.emit('datos-iot', message.toString()); // Enviar datos a WebSockets
    });
  } catch (error) {
    console.error('Error al conectar con MQTT:', error);
  }

  // Iniciar servidor local
  server.listen(PORT, () => {
    console.log(`
    ============================================
    🚀  Servidor ejecutándose en el puerto ${PORT}
    📅  ${new Date().toLocaleString()}
    ============================================
    `);
  });

  // Manejo de errores
  server.on('error', (error) => {
    console.error('Error en el servidor:', error);
  });
}