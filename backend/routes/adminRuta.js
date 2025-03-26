const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

// Importar todos los modelos necesarios para el panel de administración
const Usuario = require('../models/usuarios');
const Producto = require('../models/productos');
const Servicio = require('../models/servicios');
const Testimonio = require('../models/testimonios');
const Pedido = require('../models/pedidos');
const Carrito = require('../models/carrito');
const HistorialBaja = require('../models/historial_bajas');
const Beneficio = require('../models/beneficios');
const Caracteristica = require('../models/caracteristicas');
const Ventaja = require('../models/ventajas');
const Contacto = require('../models/contactos');
const Cronologia = require('../models/cronologia');
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

// Ruta para verificar permisos de administrador
router.get('/dashboard', verificarToken, esAdmin, async (req, res) => {
    try {
        // Obtener usuario completo desde la base de datos
        const usuario = await Usuario.findById(req.usuario.id).select('-password');

        if (!usuario) {
            return res.status(404).json({ mensaje: 'Usuario no encontrado.' });
        }

        // Obtener conteos de los diferentes modelos
        const conteoUsuarios = await Usuario.countDocuments();
        const conteoProductos = await Producto.countDocuments();
        const conteoServicios = await Servicio.countDocuments();
        const conteoPedidos = await Pedido.countDocuments();

        // Últimos usuarios registrados
        const ultimosUsuarios = await Usuario.find()
            .sort({ date: -1 })
            .limit(5)
            .select('-password');

        res.status(200).json({
            success: true,
            message: 'Acceso al panel de administración permitido',
            user: usuario,
            stats: {
                usuarios: conteoUsuarios,
                productos: conteoProductos,
                servicios: conteoServicios,
                pedidos: conteoPedidos
            },
            ultimosUsuarios
        });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error en el servidor', error: error.message });
    }
});

// Rutas para gestionar usuarios desde el panel de administración
router.get('/usuarios', verificarToken, esAdmin, async (req, res) => {
    try {
        const usuarios = await Usuario.find().select('-password');
        res.status(200).json(usuarios);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener usuarios', error: error.message });
    }
});

router.put('/usuarios/:id', verificarToken, esAdmin, async (req, res) => {
    try {
        // Si se envía una contraseña, hashearla
        if (req.body.password) {
            const salt = await bcrypt.genSalt(10);
            req.body.password = await bcrypt.hash(req.body.password, salt);
        }

        const usuarioActualizado = await Usuario.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true }
        ).select('-password');

        if (!usuarioActualizado) {
            return res.status(404).json({ mensaje: 'Usuario no encontrado.' });
        }

        res.status(200).json({
            mensaje: 'Usuario actualizado exitosamente',
            usuario: usuarioActualizado
        });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al actualizar usuario', error: error.message });
    }
});

router.delete('/usuarios/:id', verificarToken, esAdmin, async (req, res) => {
    try {
        const usuarioEliminado = await Usuario.findByIdAndDelete(req.params.id);
        
        if (!usuarioEliminado) {
            return res.status(404).json({ mensaje: 'Usuario no encontrado.' });
        }

        res.status(200).json({ mensaje: 'Usuario eliminado exitosamente.' });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al eliminar usuario', error: error.message });
    }
});

// Rutas para gestionar pedidos desde el panel de administración
router.get('/pedidos', verificarToken, esAdmin, async (req, res) => {
    try {
        const pedidos = await Pedido.find()
            .sort({ fecha_pedido: -1 })
            .populate('usuario_id', 'name email');
            
        res.status(200).json(pedidos);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener pedidos', error: error.message });
    }
});

router.get('/pedidos/:id', verificarToken, esAdmin, async (req, res) => {
    try {
        const pedido = await Pedido.findById(req.params.id)
            .populate('usuario_id', 'name email phone')
            .populate('items.producto_id');
            
        if (!pedido) {
            return res.status(404).json({ mensaje: 'Pedido no encontrado.' });
        }
        
        res.status(200).json(pedido);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener pedido', error: error.message });
    }
});

router.put('/pedidos/:id/estado', verificarToken, esAdmin, async (req, res) => {
    try {
        const { estado } = req.body;
        
        if (!['pendiente', 'pagado', 'enviado', 'entregado', 'cancelado'].includes(estado)) {
            return res.status(400).json({ mensaje: 'Estado de pedido inválido.' });
        }
        
        const pedidoActualizado = await Pedido.findByIdAndUpdate(
            req.params.id,
            { 
                $set: { 
                    estado,
                    fecha_actualización: Date.now()
                } 
            },
            { new: true }
        );
        
        if (!pedidoActualizado) {
            return res.status(404).json({ mensaje: 'Pedido no encontrado.' });
        }
        
        res.status(200).json({
            mensaje: 'Estado de pedido actualizado exitosamente',
            pedido: pedidoActualizado
        });
    } catch (error) {
        res.status(400).json({ mensaje: 'Error al actualizar estado de pedido', error: error.message });
    }
});

// Rutas para gestionar beneficios
router.get('/beneficios', verificarToken, esAdmin, async (req, res) => {
    try {
        const beneficios = await Beneficio.find();
        res.status(200).json(beneficios);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener beneficios', error: error.message });
    }
});

router.post('/beneficios', verificarToken, esAdmin, async (req, res) => {
    try {
        const nuevoBeneficio = new Beneficio(req.body);
        await nuevoBeneficio.save();
        
        res.status(201).json({
            mensaje: 'Beneficio creado exitosamente',
            beneficio: nuevoBeneficio
        });
    } catch (error) {
        res.status(400).json({ mensaje: 'Error al crear beneficio', error: error.message });
    }
});

router.put('/beneficios/:id', verificarToken, esAdmin, async (req, res) => {
    try {
        const beneficioActualizado = await Beneficio.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true }
        );
        
        if (!beneficioActualizado) {
            return res.status(404).json({ mensaje: 'Beneficio no encontrado.' });
        }
        
        res.status(200).json({
            mensaje: 'Beneficio actualizado exitosamente',
            beneficio: beneficioActualizado
        });
    } catch (error) {
        res.status(400).json({ mensaje: 'Error al actualizar beneficio', error: error.message });
    }
});

router.delete('/beneficios/:id', verificarToken, esAdmin, async (req, res) => {
    try {
        const beneficioEliminado = await Beneficio.findByIdAndDelete(req.params.id);
        
        if (!beneficioEliminado) {
            return res.status(404).json({ mensaje: 'Beneficio no encontrado.' });
        }
        
        // Registrar en historial de bajas
        try {
            const registroBaja = new HistorialBaja({
                coleccion: 'beneficios',
                documento_id: req.params.id,
                datos: beneficioEliminado,
                motivo: req.body.motivo || 'Eliminación por administrador',
                usuario_id: req.usuario.id
            });
            
            await registroBaja.save();
        } catch (error) {
            console.error('Error al registrar baja:', error);
        }
        
        res.status(200).json({ mensaje: 'Beneficio eliminado exitosamente.' });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al eliminar beneficio', error: error.message });
    }
});

module.exports = router;