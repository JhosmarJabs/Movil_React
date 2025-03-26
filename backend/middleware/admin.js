const admin = (req, res, next) => {
    // Verificar que haya un usuario (asumiendo que el middleware auth ya se ejecutó)
    if (!req.usuario) {
        return res.status(401).json({ message: 'Autenticación requerida.' });
    }

    // Verificar si el usuario es administrador
    if (req.usuario.role !== 'admin') {
        return res.status(403).json({ 
            message: 'Acceso denegado. Se requieren privilegios de administrador.' 
        });
    }

    // Si es administrador, continuar
    next();
};

module.exports = admin;