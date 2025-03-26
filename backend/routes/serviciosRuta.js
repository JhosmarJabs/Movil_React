const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Servicio = require('../models/servicios');
const multer = require('multer');
const path = require('path');

// Configuración de multer para subida de imágenes
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, 'uploads/servicios/');
    },
    filename: function(req, file, cb) {
        cb(null, `servicio-${Date.now()}${path.extname(file.originalname)}`);
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // límite de 5MB
    fileFilter: (req, file, cb) => {
        // Verificar tipos de archivo aceptados
        const filetypes = /jpeg|jpg|png|webp/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Solo se permiten archivos de imagen (jpeg, jpg, png, webp)'));
        }
    }
});

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

// Obtener todos los servicios
router.get('/', async (req, res) => {
    try {
        const servicios = await Servicio.find();
        res.status(200).json(servicios);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener servicios', error: error.message });
    }
});

// Obtener un servicio por ID
router.get('/:id', async (req, res) => {
    try {
        const servicio = await Servicio.findById(req.params.id);
        if (!servicio) {
            return res.status(404).json({ mensaje: 'Servicio no encontrado.' });
        }
        res.status(200).json(servicio);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener servicio', error: error.message });
    }
});

// Crear un nuevo servicio (solo administradores)
router.post('/', verificarToken, esAdmin, upload.single('imagen'), async (req, res) => {
    try {
        const servicioData = req.body;
        
        // Si hay una imagen subida, guardar la ruta
        if (req.file) {
            servicioData.imagen = `/uploads/servicios/${req.file.filename}`;
        }
        
        // Procesar listItems si viene como string en formato JSON
        if (servicioData.listItems && typeof servicioData.listItems === 'string') {
            try {
                servicioData.listItems = JSON.parse(servicioData.listItems);
            } catch (e) {
                return res.status(400).json({ mensaje: 'Formato inválido para listItems' });
            }
        }
        
        const nuevoServicio = new Servicio(servicioData);
        await nuevoServicio.save();
        
        res.status(201).json({
            mensaje: 'Servicio creado exitosamente',
            servicio: nuevoServicio
        });
    } catch (error) {
        res.status(400).json({ mensaje: 'Error al crear servicio', error: error.message });
    }
});

// Actualizar un servicio (solo administradores)
router.put('/:id', verificarToken, esAdmin, upload.single('imagen'), async (req, res) => {
    try {
        const servicioData = req.body;
        
        // Si hay una imagen subida, actualizar la ruta
        if (req.file) {
            servicioData.imagen = `/uploads/servicios/${req.file.filename}`;
        }
        
        // Procesar listItems si viene como string en formato JSON
        if (servicioData.listItems && typeof servicioData.listItems === 'string') {
            try {
                servicioData.listItems = JSON.parse(servicioData.listItems);
            } catch (e) {
                return res.status(400).json({ mensaje: 'Formato inválido para listItems' });
            }
        }
        
        const servicioActualizado = await Servicio.findByIdAndUpdate(
            req.params.id,
            { $set: servicioData },
            { new: true }
        );
        
        if (!servicioActualizado) {
            return res.status(404).json({ mensaje: 'Servicio no encontrado.' });
        }
        
        res.status(200).json({
            mensaje: 'Servicio actualizado exitosamente',
            servicio: servicioActualizado
        });
    } catch (error) {
        res.status(400).json({ mensaje: 'Error al actualizar servicio', error: error.message });
    }
});

// Eliminar un servicio (solo administradores)
router.delete('/:id', verificarToken, esAdmin, async (req, res) => {
    try {
        const servicioEliminado = await Servicio.findByIdAndDelete(req.params.id);
        
        if (!servicioEliminado) {
            return res.status(404).json({ mensaje: 'Servicio no encontrado.' });
        }
        
        res.status(200).json({ mensaje: 'Servicio eliminado exitosamente.' });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al eliminar servicio', error: error.message });
    }
});

module.exports = router;