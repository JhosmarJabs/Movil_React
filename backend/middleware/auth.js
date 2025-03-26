const jwt = require('jsonwebtoken');
require('dotenv').config();

const SECRET_KEY = process.env.JWT_SECRET || 'clave_secreta';

const auth = (req, res, next) => {
    // Obtener el token del header
    const token = req.header('Authorization')?.split(' ')[1];
    
    // Verificar si no hay token
    if (!token) {
        return res.status(401).json({ 
            message: 'Acceso denegado. No se proporcionó token de autenticación.' 
        });
    }

    try {
        // Verificar el token
        const decoded = jwt.verify(token, SECRET_KEY);
        
        // Añadir el usuario al objeto de solicitud
        req.usuario = decoded;
        
        // Continuar con la siguiente función middleware
        next();
    } catch (error) {
        res.status(401).json({ message: 'Token inválido o expirado.' });
    }
};

module.exports = auth;