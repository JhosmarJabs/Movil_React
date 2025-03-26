const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Contacto = require('../models/contactos');
const RedSocial = require('../models/redes_sociales');

// Middleware para verificar token JWT
const verificarToken = (req, res, next) => {
    const token = req.header('Authorization')?.split(' ')[1];
    if (!token) return res.status(401).json({ mensaje: 'Acceso denegado.' });

    try {
        const verificado = jwt.verify(token, process.env.JWT_SECRET || 'clave_secreta');
        req.usuario = verificado;
        next();
    } catch (error) {
        res.status(401).json({ mensaje: 'Token inválido.' });
    }
};

// Middleware para verificar si es administrador
const esAdmin = (req, res, next) => {
    if (req.usuario.role !== 'admin') {
        return res.status(403).json({ mensaje: 'Acceso denegado. Se requiere rol de administrador.' });
    }
    next();
};

// =========== RUTAS PÚBLICAS ===========

// Ruta específica para obtener redes sociales (público)
router.get('/redes-sociales', async (req, res) => {
    try {
        const redesSociales = await RedSocial.find();
        res.status(200).json(redesSociales);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener redes sociales', error: error.message });
    }
});

// Obtener información de contacto pública
router.get('/info', async (req, res) => {
    try {
        const contactosInfo = await Contacto.find();
        res.status(200).json(contactosInfo);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener información de contacto', error: error.message });
    }
});

// Obtener todos los contactos (público)
router.get('/', async (req, res) => {
    try {
        const contactos = await Contacto.find();
        res.status(200).json(contactos);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener contactos', error: error.message });
    }
});

// Crear un nuevo contacto (formulario de contacto público)
router.post('/', async (req, res) => {
    try {
        // Aquí puedes implementar validación de datos o captcha si es necesario
        
        const nuevoContacto = new Contacto(req.body);
        await nuevoContacto.save();
        
        res.status(201).json({
            mensaje: 'Mensaje de contacto enviado exitosamente',
            contacto: nuevoContacto
        });
    } catch (error) {
        res.status(400).json({ mensaje: 'Error al enviar mensaje de contacto', error: error.message });
    }
});

// Obtener un contacto por ID (público)
router.get('/:id', async (req, res) => {
    try {
        const contacto = await Contacto.findById(req.params.id);
        if (!contacto) {
            return res.status(404).json({ mensaje: 'Contacto no encontrado.' });
        }
        res.status(200).json(contacto);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener contacto', error: error.message });
    }
});

// =========== RUTAS PROTEGIDAS (ADMINS) ===========

// Crear una nueva red social (solo admins)
router.post('/redes-sociales', verificarToken, esAdmin, async (req, res) => {
    try {
        const nuevaRedSocial = new RedSocial(req.body);
        await nuevaRedSocial.save();
        
        res.status(201).json({
            mensaje: 'Red social creada exitosamente',
            redSocial: nuevaRedSocial
        });
    } catch (error) {
        res.status(400).json({ mensaje: 'Error al crear red social', error: error.message });
    }
});

// Actualizar una red social (solo admins)
router.put('/redes-sociales/:id', verificarToken, esAdmin, async (req, res) => {
    try {
        const redSocialActualizada = await RedSocial.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true }
        );
        
        if (!redSocialActualizada) {
            return res.status(404).json({ mensaje: 'Red social no encontrada.' });
        }
        
        res.status(200).json({
            mensaje: 'Red social actualizada exitosamente',
            redSocial: redSocialActualizada
        });
    } catch (error) {
        res.status(400).json({ mensaje: 'Error al actualizar red social', error: error.message });
    }
});

// Eliminar una red social (solo admins)
router.delete('/redes-sociales/:id', verificarToken, esAdmin, async (req, res) => {
    try {
        const redSocialEliminada = await RedSocial.findByIdAndDelete(req.params.id);
        
        if (!redSocialEliminada) {
            return res.status(404).json({ mensaje: 'Red social no encontrada.' });
        }
        
        res.status(200).json({ mensaje: 'Red social eliminada exitosamente.' });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al eliminar red social', error: error.message });
    }
});

// Actualizar un contacto (solo admins)
router.put('/:id', verificarToken, esAdmin, async (req, res) => {
    try {
        const contactoActualizado = await Contacto.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true }
        );
        
        if (!contactoActualizado) {
            return res.status(404).json({ mensaje: 'Contacto no encontrado.' });
        }
        
        res.status(200).json({
            mensaje: 'Información de contacto actualizada exitosamente',
            contacto: contactoActualizado
        });
    } catch (error) {
        res.status(400).json({ mensaje: 'Error al actualizar contacto', error: error.message });
    }
});

// Eliminar un contacto (solo admins)
router.delete('/:id', verificarToken, esAdmin, async (req, res) => {
    try {
        const contactoEliminado = await Contacto.findByIdAndDelete(req.params.id);
        
        if (!contactoEliminado) {
            return res.status(404).json({ mensaje: 'Contacto no encontrado.' });
        }
        
        res.status(200).json({ mensaje: 'Contacto eliminado exitosamente.' });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al eliminar contacto', error: error.message });
    }
});

module.exports = router;