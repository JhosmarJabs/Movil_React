const express = require('express');
const jwt = require('jsonwebtoken');
const Usuario = require('../models/usuarios');
require('dotenv').config();

const router = express.Router();
const SECRET_KEY = process.env.JWT_SECRET || 'clave_secreta';

// Ruta para verificar si la sesión está activa
router.get('/', async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.json({ loggedIn: false });
    }

    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        const user = await Usuario.findById(decoded.id).select('-password');
        
        if (!user) {
            return res.json({ loggedIn: false });
        }
        
        if (user.status !== 'active') {
            return res.json({ 
                loggedIn: false, 
                message: 'Cuenta de usuario inactiva o suspendida.' 
            });
        }
        
        res.json({ 
            loggedIn: true, 
            user: {
                id: user._id,
                name: user.name,
                surname: user.surname,
                email: user.email,
                role: user.role,
                status: user.status
            }
        });
    } catch (error) {
        res.json({ loggedIn: false });
    }
});

module.exports = router;