const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Politicas = require('../models/politicas');

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

// Obtener todas las políticas (público)
router.get('/', async (req, res) => {
    try {
        const politicas = await Politicas.find();
        res.status(200).json(politicas);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener políticas', error: error.message });
    }
});

// Obtener política por ID (público)
router.get('/:id', async (req, res) => {
    try {
        const politica = await Politicas.findById(req.params.id);
        if (!politica) {
            return res.status(404).json({ mensaje: 'Política no encontrada.' });
        }
        res.status(200).json(politica);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener política', error: error.message });
    }
});

// Obtener políticas de clientes (público)
router.get('/tipo/cliente', async (req, res) => {
    try {
        const politicas = await Politicas.find({}, 'clientPolicies');
        res.status(200).json(politicas);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener políticas de clientes', error: error.message });
    }
});

// Obtener políticas de la empresa (público)
router.get('/tipo/empresa', async (req, res) => {
    try {
        const politicas = await Politicas.find({}, 'companyPolicies');
        res.status(200).json(politicas);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener políticas de la empresa', error: error.message });
    }
});

// Obtener políticas de privacidad (público)
router.get('/tipo/privacidad', async (req, res) => {
    try {
        const politicas = await Politicas.find({}, 'privacyPolicies');
        res.status(200).json(politicas);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener políticas de privacidad', error: error.message });
    }
});

// =========== RUTAS PROTEGIDAS (ADMINS) ===========

// Crear nueva política (solo admins)
router.post('/', verificarToken, esAdmin, async (req, res) => {
    try {
        const nuevaPolitica = new Politicas(req.body);
        await nuevaPolitica.save();
        
        res.status(201).json({
            mensaje: 'Política creada exitosamente',
            politica: nuevaPolitica
        });
    } catch (error) {
        res.status(400).json({ mensaje: 'Error al crear política', error: error.message });
    }
});

// Actualizar política (solo admins)
router.put('/:id', verificarToken, esAdmin, async (req, res) => {
    try {
        const politicaActualizada = await Politicas.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true }
        );
        
        if (!politicaActualizada) {
            return res.status(404).json({ mensaje: 'Política no encontrada.' });
        }
        
        res.status(200).json({
            mensaje: 'Política actualizada exitosamente',
            politica: politicaActualizada
        });
    } catch (error) {
        res.status(400).json({ mensaje: 'Error al actualizar política', error: error.message });
    }
});

// Eliminar política (solo admins)
router.delete('/:id', verificarToken, esAdmin, async (req, res) => {
    try {
        const politicaEliminada = await Politicas.findByIdAndDelete(req.params.id);
        
        if (!politicaEliminada) {
            return res.status(404).json({ mensaje: 'Política no encontrada.' });
        }
        
        res.status(200).json({ mensaje: 'Política eliminada exitosamente.' });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al eliminar política', error: error.message });
    }
});

// Actualizar política de cliente específica (solo admins)
router.put('/cliente/:id', verificarToken, esAdmin, async (req, res) => {
    try {
        const { clientPolicies } = req.body;
        
        if (!clientPolicies) {
            return res.status(400).json({ mensaje: 'Se requiere información de políticas de cliente.' });
        }
        
        const politicaActualizada = await Politicas.findByIdAndUpdate(
            req.params.id,
            { $set: { clientPolicies } },
            { new: true }
        );
        
        if (!politicaActualizada) {
            return res.status(404).json({ mensaje: 'Política no encontrada.' });
        }
        
        res.status(200).json({
            mensaje: 'Políticas de cliente actualizadas exitosamente',
            politica: politicaActualizada
        });
    } catch (error) {
        res.status(400).json({ mensaje: 'Error al actualizar políticas de cliente', error: error.message });
    }
});

// Actualizar política de empresa específica (solo admins)
router.put('/empresa/:id', verificarToken, esAdmin, async (req, res) => {
    try {
        const { companyPolicies } = req.body;
        
        if (!companyPolicies) {
            return res.status(400).json({ mensaje: 'Se requiere información de políticas de empresa.' });
        }
        
        const politicaActualizada = await Politicas.findByIdAndUpdate(
            req.params.id,
            { $set: { companyPolicies } },
            { new: true }
        );
        
        if (!politicaActualizada) {
            return res.status(404).json({ mensaje: 'Política no encontrada.' });
        }
        
        res.status(200).json({
            mensaje: 'Políticas de empresa actualizadas exitosamente',
            politica: politicaActualizada
        });
    } catch (error) {
        res.status(400).json({ mensaje: 'Error al actualizar políticas de empresa', error: error.message });
    }
});

// Actualizar política de privacidad específica (solo admins)
router.put('/privacidad/:id', verificarToken, esAdmin, async (req, res) => {
    try {
        const { privacyPolicies } = req.body;
        
        if (!privacyPolicies) {
            return res.status(400).json({ mensaje: 'Se requiere información de políticas de privacidad.' });
        }
        
        const politicaActualizada = await Politicas.findByIdAndUpdate(
            req.params.id,
            { $set: { privacyPolicies } },
            { new: true }
        );
        
        if (!politicaActualizada) {
            return res.status(404).json({ mensaje: 'Política no encontrada.' });
        }
        
        res.status(200).json({
            mensaje: 'Políticas de privacidad actualizadas exitosamente',
            politica: politicaActualizada
        });
    } catch (error) {
        res.status(400).json({ mensaje: 'Error al actualizar políticas de privacidad', error: error.message });
    }
});

module.exports = router;