const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Testimonio = require('../models/testimonios');

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

// Obtener todos los testimonios (público)
router.get('/', async (req, res) => {
    try {
        const { limit = 10, verificado } = req.query;
        
        let filtro = {};
        
        // Si se especifica el parámetro verificado, filtramos por testimonios verificados
        if (verificado === 'true') {
            filtro.verificado = true;
        }
        
        const testimonios = await Testimonio.find(filtro)
            .populate('usuario_id', 'name surname email')
            .populate('producto_id', 'title image')
            .sort({ fecha: -1 })
            .limit(Number(limit));
        
        res.status(200).json(testimonios);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener testimonios', error: error.message });
    }
});

// Obtener testimonios destacados (mejores valoraciones)
router.get('/destacados', async (req, res) => {
    try {
        const { limit = 3 } = req.query;
        
        const testimonios = await Testimonio.find({ verificado: true })
            .populate('usuario_id', 'name surname email')
            .populate('producto_id', 'title image')
            .sort({ estrellas: -1, fecha: -1 })
            .limit(Number(limit));
        
        res.status(200).json(testimonios);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener testimonios destacados', error: error.message });
    }
});

// Obtener testimonios por producto
router.get('/producto/:productoId', async (req, res) => {
    try {
        const testimonios = await Testimonio.find({ 
            producto_id: req.params.productoId,
            verificado: true
        })
        .populate('usuario_id', 'name surname')
        .sort({ fecha: -1 });
        
        res.status(200).json(testimonios);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener testimonios del producto', error: error.message });
    }
});

// Obtener un testimonio específico por ID
router.get('/:id', async (req, res) => {
    try {
        const testimonio = await Testimonio.findById(req.params.id)
            .populate('usuario_id', 'name surname email')
            .populate('producto_id', 'title image');
        
        if (!testimonio) {
            return res.status(404).json({ mensaje: 'Testimonio no encontrado.' });
        }
        
        res.status(200).json(testimonio);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener testimonio', error: error.message });
    }
});

// =========== RUTAS PROTEGIDAS (USUARIOS) ===========

// Crear un nuevo testimonio (usuario autenticado)
router.post('/', verificarToken, async (req, res) => {
    try {
        const { producto_id, puesto, comentario, estrellas } = req.body;
        
        // Crear el nuevo testimonio asociado al usuario autenticado
        const nuevoTestimonio = new Testimonio({
            usuario_id: req.usuario.id,
            producto_id,
            puesto,
            comentario,
            estrellas
        });
        
        await nuevoTestimonio.save();
        
        res.status(201).json({
            mensaje: 'Testimonio creado exitosamente. Será revisado antes de publicarse.',
            testimonio: nuevoTestimonio
        });
    } catch (error) {
        res.status(400).json({ mensaje: 'Error al crear testimonio', error: error.message });
    }
});

// Actualizar mi testimonio (solo el propio usuario)
router.put('/:id', verificarToken, async (req, res) => {
    try {
        // Buscar el testimonio
        const testimonio = await Testimonio.findById(req.params.id);
        
        if (!testimonio) {
            return res.status(404).json({ mensaje: 'Testimonio no encontrado.' });
        }
        
        // Verificar que el testimonio pertenece al usuario
        if (testimonio.usuario_id.toString() !== req.usuario.id) {
            return res.status(403).json({ mensaje: 'No autorizado para modificar este testimonio.' });
        }
        
        // Si se modifica, se marca como no verificado nuevamente
        const testimonioActualizado = await Testimonio.findByIdAndUpdate(
            req.params.id,
            { 
                ...req.body,
                verificado: false,  // Requiere nueva verificación
                fecha: Date.now()   // Actualizar fecha
            },
            { new: true }
        );
        
        res.status(200).json({
            mensaje: 'Testimonio actualizado exitosamente. Será revisado antes de publicarse nuevamente.',
            testimonio: testimonioActualizado
        });
    } catch (error) {
        res.status(400).json({ mensaje: 'Error al actualizar testimonio', error: error.message });
    }
});

// Eliminar mi testimonio (solo el propio usuario)
router.delete('/:id', verificarToken, async (req, res) => {
    try {
        // Buscar el testimonio
        const testimonio = await Testimonio.findById(req.params.id);
        
        if (!testimonio) {
            return res.status(404).json({ mensaje: 'Testimonio no encontrado.' });
        }
        
        // Verificar que el testimonio pertenece al usuario o es admin
        if (testimonio.usuario_id.toString() !== req.usuario.id && req.usuario.role !== 'admin') {
            return res.status(403).json({ mensaje: 'No autorizado para eliminar este testimonio.' });
        }
        
        await Testimonio.findByIdAndDelete(req.params.id);
        
        res.status(200).json({ mensaje: 'Testimonio eliminado exitosamente.' });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al eliminar testimonio', error: error.message });
    }
});

// =========== RUTAS PROTEGIDAS (ADMINS) ===========

// Obtener todos los testimonios (incluyendo no verificados) para administración
router.get('/admin/todos', verificarToken, esAdmin, async (req, res) => {
    try {
        const testimonios = await Testimonio.find()
            .populate('usuario_id', 'name surname email')
            .populate('producto_id', 'title image')
            .sort({ fecha: -1 });
            
        res.status(200).json(testimonios);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener testimonios', error: error.message });
    }
});

// Verificar/aprobar un testimonio (solo admins)
router.put('/admin/verificar/:id', verificarToken, esAdmin, async (req, res) => {
    try {
        const testimonioActualizado = await Testimonio.findByIdAndUpdate(
            req.params.id,
            { verificado: true },
            { new: true }
        );
        
        if (!testimonioActualizado) {
            return res.status(404).json({ mensaje: 'Testimonio no encontrado.' });
        }
        
        res.status(200).json({
            mensaje: 'Testimonio verificado exitosamente.',
            testimonio: testimonioActualizado
        });
    } catch (error) {
        res.status(400).json({ mensaje: 'Error al verificar testimonio', error: error.message });
    }
});

module.exports = router;