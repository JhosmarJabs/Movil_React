const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Carrito = require('../models/carrito');
const Productos = require('../models/productos');

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

// Obtener el carrito del usuario
router.get('/', verificarToken, async (req, res) => {
    try {
        let carrito = await Carrito.findOne({ 
            usuario_id: req.usuario.id,
            estado: 'activo'
        }).populate('items.producto_id');
        
        // Si no existe el carrito, crear uno nuevo
        if (!carrito) {
            carrito = new Carrito({
                usuario_id: req.usuario.id,
                items: []
            });
            
            await carrito.save();
        }
        
        res.status(200).json(carrito);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener carrito', error: error.message });
    }
});

// Agregar producto al carrito
router.post('/agregar', verificarToken, async (req, res) => {
    try {
        const { producto_id, cantidad = 1 } = req.body;
        
        // Validar producto y stock
        const producto = await Productos.findById(producto_id);
        if (!producto) {
            return res.status(404).json({ mensaje: 'Producto no encontrado.' });
        }
        
        if (producto.stock < cantidad) {
            return res.status(400).json({ 
                mensaje: `Stock insuficiente. Solo hay ${producto.stock} unidades disponibles.` 
            });
        }
        
        // Buscar el carrito activo del usuario
        let carrito = await Carrito.findOne({ 
            usuario_id: req.usuario.id,
            estado: 'activo'
        });
        
        // Si no existe el carrito, crear uno nuevo
        if (!carrito) {
            carrito = new Carrito({
                usuario_id: req.usuario.id,
                items: []
            });
        }
        
        // Verificar si el producto ya está en el carrito
        const itemIndex = carrito.items.findIndex(
            item => item.producto_id.toString() === producto_id
        );
        
        if (itemIndex > -1) {
            // Si el producto ya está en el carrito, actualizar cantidad
            carrito.items[itemIndex].cantidad += cantidad;
        } else {
            // Si es un producto nuevo, agregarlo al carrito
            carrito.items.push({
                producto_id,
                cantidad,
                precio_unitario: producto.price,
                descuento: producto.discount
            });
        }
        
        // Actualizar fecha de modificación
        carrito.fecha_actualizacion = Date.now();
        
        await carrito.save();
        
        // Retornar carrito actualizado con información de productos
        const carritoActualizado = await Carrito.findById(carrito._id)
            .populate('items.producto_id');
        
        res.status(200).json({
            mensaje: 'Producto agregado al carrito exitosamente',
            carrito: carritoActualizado
        });
    } catch (error) {
        res.status(400).json({ mensaje: 'Error al agregar producto al carrito', error: error.message });
    }
});

// Actualizar cantidad de producto en el carrito
router.put('/actualizar', verificarToken, async (req, res) => {
    try {
        const { producto_id, cantidad } = req.body;
        
        if (!producto_id || !cantidad) {
            return res.status(400).json({ mensaje: 'ID de producto y cantidad son requeridos.' });
        }
        
        if (cantidad < 1) {
            return res.status(400).json({ mensaje: 'La cantidad debe ser al menos 1.' });
        }
        
        // Validar stock disponible
        const producto = await Productos.findById(producto_id);
        if (!producto) {
            return res.status(404).json({ mensaje: 'Producto no encontrado.' });
        }
        
        if (producto.stock < cantidad) {
            return res.status(400).json({ 
                mensaje: `Stock insuficiente. Solo hay ${producto.stock} unidades disponibles.` 
            });
        }
        
        // Buscar y actualizar el carrito
        const carrito = await Carrito.findOne({ 
            usuario_id: req.usuario.id,
            estado: 'activo'
        });
        
        if (!carrito) {
            return res.status(404).json({ mensaje: 'Carrito no encontrado.' });
        }
        
        // Buscar el ítem en el carrito
        const itemIndex = carrito.items.findIndex(
            item => item.producto_id.toString() === producto_id
        );
        
        if (itemIndex === -1) {
            return res.status(404).json({ mensaje: 'Producto no encontrado en el carrito.' });
        }
        
        // Actualizar cantidad
        carrito.items[itemIndex].cantidad = cantidad;
        carrito.fecha_actualizacion = Date.now();
        
        await carrito.save();
        
        // Retornar carrito actualizado con información de productos
        const carritoActualizado = await Carrito.findById(carrito._id)
            .populate('items.producto_id');
        
        res.status(200).json({
            mensaje: 'Carrito actualizado exitosamente',
            carrito: carritoActualizado
        });
    } catch (error) {
        res.status(400).json({ mensaje: 'Error al actualizar carrito', error: error.message });
    }
});

// Eliminar producto del carrito
router.delete('/eliminar/:producto_id', verificarToken, async (req, res) => {
    try {
        const { producto_id } = req.params;
        
        // Buscar el carrito
        const carrito = await Carrito.findOne({ 
            usuario_id: req.usuario.id,
            estado: 'activo'
        });
        
        if (!carrito) {
            return res.status(404).json({ mensaje: 'Carrito no encontrado.' });
        }
        
        // Filtrar el producto del carrito
        const itemIndex = carrito.items.findIndex(
            item => item.producto_id.toString() === producto_id
        );
        
        if (itemIndex === -1) {
            return res.status(404).json({ mensaje: 'Producto no encontrado en el carrito.' });
        }
        
        // Eliminar producto
        carrito.items.splice(itemIndex, 1);
        carrito.fecha_actualizacion = Date.now();
        
        await carrito.save();
        
        // Retornar carrito actualizado
        const carritoActualizado = await Carrito.findById(carrito._id)
            .populate('items.producto_id');
        
        res.status(200).json({
            mensaje: 'Producto eliminado del carrito exitosamente',
            carrito: carritoActualizado
        });
    } catch (error) {
        res.status(400).json({ mensaje: 'Error al eliminar producto del carrito', error: error.message });
    }
});

// Vaciar carrito
router.delete('/vaciar', verificarToken, async (req, res) => {
    try {
        // Buscar el carrito
        const carrito = await Carrito.findOne({ 
            usuario_id: req.usuario.id,
            estado: 'activo'
        });
        
        if (!carrito) {
            return res.status(404).json({ mensaje: 'Carrito no encontrado.' });
        }
        
        // Vaciar items
        carrito.items = [];
        carrito.fecha_actualizacion = Date.now();
        
        await carrito.save();
        
        res.status(200).json({
            mensaje: 'Carrito vaciado exitosamente',
            carrito
        });
    } catch (error) {
        res.status(400).json({ mensaje: 'Error al vaciar carrito', error: error.message });
    }
});

module.exports = router;