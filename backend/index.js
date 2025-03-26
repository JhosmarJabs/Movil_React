// index.js - Punto de entrada para Vercel
const express = require('express');

// Crear una aplicación Express mínima
const app = express();

// Middleware básico
app.use(express.json());

// Ruta de salud para verificar que la aplicación está funcionando
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    message: 'API funcionando correctamente',
    timestamp: new Date().toISOString()
  });
});

// Ruta principal
app.get('/', (req, res) => {
  res.status(200).send('Servidor funcionando correctamente');
});

// Manejar cualquier error
app.use((err, req, res, next) => {
  console.error('Error en la aplicación:', err);
  res.status(500).json({
    mensaje: 'Error interno del servidor',
    error: process.env.NODE_ENV === 'production' ? 'Error interno' : err.message
  });
});

// Para desarrollo local
if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Servidor ejecutándose en el puerto ${PORT}`);
  });
}

// Exportar para Vercel
module.exports = app;