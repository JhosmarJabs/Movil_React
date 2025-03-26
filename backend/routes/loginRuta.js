const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const router = express.Router();
const Usuario = require('../models/usuarios');
require('dotenv').config();

const SECRET_KEY = process.env.JWT_SECRET || 'clave_secreta';

// Ruta para iniciar sesión
router.post('/', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: "Email y contraseña son requeridos." });
    }

    try {
        // Buscar el usuario por email
        const user = await Usuario.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'Credenciales inválidas.' });
        }

        // Verificar estado del usuario
        if (user.status !== 'active') {
            return res.status(403).json({ message: 'Su cuenta está inactiva o suspendida.' });
        }

        // Verificar contraseña
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Credenciales inválidas.' });
        }

        // Generar token JWT
        const token = jwt.sign(
            {
                id: user._id,
                name: user.name,
                surname: user.surname,
                role: user.role
            },
            SECRET_KEY,
            { expiresIn: '24h' }
        );        

        // Respuesta exitosa
        res.status(200).json({
            message: 'Inicio de sesión exitoso',
            token,
            user: {
                id: user._id,
                name: user.name,
                surname: user.surname,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error("Error en el servidor:", error);
        res.status(500).json({ message: 'Error en el servidor', error: error.message });
    }
});

// Cerrar sesión (opcional, ya que JWT se maneja del lado del cliente)
router.post('/logout', (req, res) => {
    // En JWT, el cierre de sesión se maneja generalmente en el cliente eliminando el token
    res.status(200).json({ mensaje: 'Sesión cerrada exitosamente' });
});

module.exports = router;
