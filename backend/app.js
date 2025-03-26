const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000", // Usa la variable de entorno o un valor por defecto
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
}));

// Servir archivos estáticos
app.use('/uploads', express.static(__dirname + '/uploads'));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Conexión a MongoDB (con manejo de errores mejorado)
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Conectado a MongoDB');
    } catch (err) {
        console.error('Error conectando a MongoDB:', err.message);
        // No terminamos el proceso, permitimos que la aplicación siga funcionando
        // aunque la BD falle (para debug)
    }
};

// Iniciar conexión a MongoDB
connectDB();

// Importar rutas
const verificarSesionRuta = require('./routes/verify-session');
const loginRuta = require('./routes/loginRuta');
const usuarioRuta = require('./routes/usuarioRuta');
const productosRutas = require('./routes/productosRutas');
const serviciosRuta = require('./routes/serviciosRuta');
const contactoRuta = require('./routes/contactoRuta');
const adminRuta = require('./routes/adminRuta');
const pedidosRuta = require('./routes/pedidosRuta');
const carritoRuta = require('./routes/carritoRuta');
const politicasRuta = require('./routes/politicasRuta');
const testimoniosRutas = require('./routes/testimoniosRutas');

// Middleware para manejo de errores global
app.use((err, req, res, next) => {
    console.error('Error en la aplicación:', err.stack);
    res.status(500).json({
        mensaje: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? err.message : 'Ocurrió un error en el servidor'
    });
});

// Ruta de estado (health check)
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'API funcionando correctamente' });
});

// Usar rutas
app.use('/verify-session', verificarSesionRuta);
app.use('/login', loginRuta);
app.use('/usuarios', usuarioRuta);
app.use('/productos', productosRutas);
app.use('/servicios', serviciosRuta);
app.use('/contacto', contactoRuta);
app.use('/admin', adminRuta);
app.use('/pedidos', pedidosRuta);
app.use('/carrito', carritoRuta);
app.use('/politicas', politicasRuta);
app.use('/testimonios', testimoniosRutas);

// Ruta raíz
app.get('/', (req, res) => {
    res.send('API funcionando correctamente');
});

// Crear estructura de carpetas para uploads si no existe
const fs = require('fs');
const path = require('path');

try {
    const directorios = [
        './uploads',
        './uploads/productos',
        './uploads/servicios'
    ];

    directorios.forEach(dir => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
            console.log(`Directorio creado: ${dir}`);
        }
    });
} catch (error) {
    console.error('Error al crear directorios de uploads:', error);
}

module.exports = app;