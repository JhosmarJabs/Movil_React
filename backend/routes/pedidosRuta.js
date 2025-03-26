const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Pedidos = require('../models/pedidos');
const Productos = require('../models/productos');
const Carrito = require('../models/carrito');

// Middleware para verificar token JWT
const verificarToken = (req, res, next) => {
    const token = req.header('Authorization')?.split(' ')[1];
    if (!token) return res.status(401).json({ mensaje: 'Acceso denegado.' });

    try {
        const verificado = jwt.verify(token, process.env.JWT_SECRET);
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

// Generar número de pedido único
const generarNumeroPedido = async () => {
    const fecha = new Date();
    const año = fecha.getFullYear().toString().substr(-2);
    const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
    const prefijo = `P${año}${mes}`;
    
    // Buscar el último pedido con este prefijo
    const ultimoPedido = await Pedidos.findOne(
        { numero_pedido: new RegExp(`^${prefijo}`) },
        {},
        { sort: { 'numero_pedido': -1 } }
    );
    
    let contador = 1;
    if (ultimoPedido) {
        const numActual = parseInt(ultimoPedido.numero_pedido.substr(5));
        contador = isNaN(numActual) ? 1 : numActual + 1;
    }
    
    return `${prefijo}${contador.toString().padStart(4, '0')}`;
};

// Obtener todos los pedidos (admin)
router.get('/admin', verificarToken, esAdmin, async (req, res) => {
    try {
        const { estado, fechaInicio, fechaFin, page = 1, limit = 10 } = req.query;
        
        // Construir filtro
        const filtro = {};
        if (estado) filtro.estado = estado;
        
        // Filtro por rango de fechas
        if (fechaInicio || fechaFin) {
            filtro.fecha_pedido = {};
            if (fechaInicio) filtro.fecha_pedido.$gte = new Date(fechaInicio);
            if (fechaFin) filtro.fecha_pedido.$lte = new Date(fechaFin);
        }
        
        // Paginación
        const skip = (page - 1) * limit;
        
        const pedidos = await Pedidos.find(filtro)
            .sort({ fecha_pedido: -1 })
            .skip(skip)
            .limit(Number(limit))
            .populate('usuario_id', 'name email');
            
        // Contar total de documentos para la paginación
        const total = await Pedidos.countDocuments(filtro);
        
        res.status(200).json({
            data: pedidos,
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener pedidos', error: error.message });
    }
});

// Obtener pedidos del usuario autenticado
router.get('/mis-pedidos', verificarToken, async (req, res) => {
    try {
        const pedidos = await Pedidos.find({ usuario_id: req.usuario._id })
            .sort({ fecha_pedido: -1 });
            
        res.status(200).json(pedidos);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener pedidos', error: error.message });
    }
});

// Obtener un pedido específico
router.get('/:id', verificarToken, async (req, res) => {
    try {
        const pedido = await Pedidos.findById(req.params.id)
            .populate('items.producto_id');
            
        if (!pedido) {
            return res.status(404).json({ mensaje: 'Pedido no encontrado.' });
        }
        
        // Verificar si el pedido pertenece al usuario o es administrador
        if (pedido.usuario_id.toString() !== req.usuario._id && req.usuario.role !== 'admin') {
            return res.status(403).json({ mensaje: 'No tiene permiso para ver este pedido.' });
        }
        
        res.status(200).json(pedido);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener pedido', error: error.message });
    }
});

// Crear un nuevo pedido
router.post('/', verificarToken, async (req, res) => {
    try {
        // Obtener datos del pedido
        const { direccion_envio, metodo_pago, items } = req.body;
        
        // Validar datos requeridos
        if (!direccion_envio || !metodo_pago || !items || !items.length) {
            return res.status(400).json({ mensaje: 'Datos de pedido incompletos.' });
        }
        
        // Verificar stock y calcular totales
        let subtotal = 0;
        const itemsProcesados = [];
        
        for (const item of items) {
            const producto = await Productos.findById(item.producto_id);
            
            if (!producto) {
                return res.status(404).json({ mensaje: `Producto ${item.producto_id} no encontrado.` });
            }
            
            if (producto.stock < item.cantidad) {
                return res.status(400).json({ 
                    mensaje: `Stock insuficiente para ${producto.title}. Disponible: ${producto.stock}` 
                });
            }
            
            // Calcular precio con descuento
            const precioUnitario = producto.price;
            const descuento = producto.discount / 100 * precioUnitario;
            const precioFinal = precioUnitario - descuento;
            
            // Subtotal del item
            const subtotalItem = precioFinal * item.cantidad;
            
            itemsProcesados.push({
                producto_id: producto._id,
                cantidad: item.cantidad,
                precio_unitario: precioUnitario,
                descuento: descuento,
                subtotal: subtotalItem
            });
            
            subtotal += subtotalItem;
            
            // Actualizar stock del producto
            await Productos.findByIdAndUpdate(producto._id, {
                $inc: { stock: -item.cantidad }
            });
        }
        
        // Calcular impuestos y envío
        const impuestos = subtotal * 0.16; // 16% IVA
        const envio = subtotal > 1000 ? 0 : 150; // Envío gratis para compras mayores a $1000
        const total = subtotal + impuestos + envio;
        
        // Generar número de pedido único
        const numeroPedido = await generarNumeroPedido();
        
        // Crear el pedido
        const nuevoPedido = new Pedidos({
            usuario_id: req.usuario._id,
            numero_pedido: numeroPedido,
            items: itemsProcesados,
            subtotal,
            impuestos,
            envio,
            total,
            direccion_envio,
            metodo_pago,
            estado: metodo_pago === 'efectivo' ? 'pendiente' : 'pagado'
        });
        
        await nuevoPedido.save();
        
        // Limpiar el carrito del usuario
        await Carrito.findOneAndUpdate(
            { usuario_id: req.usuario._id },
            { $set: { items: [], fecha_actualizacion: Date.now(), estado: 'convertido' } }
        );
        
        res.status(201).json({
            mensaje: 'Pedido creado exitosamente',
            pedido: nuevoPedido
        });
    } catch (error) {
        res.status(400).json({ mensaje: 'Error al crear pedido', error: error.message });
    }
});

// Cancelar un pedido
router.put('/:id/cancelar', verificarToken, async (req, res) => {
    try {
        const pedido = await Pedidos.findById(req.params.id);
        
        if (!pedido) {
            return res.status(404).json({ mensaje: 'Pedido no encontrado.' });
        }
        
        // Verificar si el pedido pertenece al usuario o es administrador
        if (pedido.usuario_id.toString() !== req.usuario._id && req.usuario.role !== 'admin') {
            return res.status(403).json({ mensaje: 'No tiene permiso para cancelar este pedido.' });
        }
        
        // Verificar si el pedido puede ser cancelado
        if (!['pendiente', 'pagado'].includes(pedido.estado)) {
            return res.status(400).json({ 
                mensaje: `No se puede cancelar un pedido en estado ${pedido.estado}.`
            });
        }
        
        // Actualizar estado del pedido
        pedido.estado = 'cancelado';
        pedido.fecha_actualización = Date.now();
        
        // Devolver stock a los productos
        for (const item of pedido.items) {
            await Productos.findByIdAndUpdate(item.producto_id, {
                $inc: { stock: item.cantidad }
            });
        }
        
        await pedido.save();
        
        res.status(200).json({
            mensaje: 'Pedido cancelado exitosamente',
            pedido
        });
    } catch (error) {
        res.status(400).json({ mensaje: 'Error al cancelar pedido', error: error.message });
    }
});

module.exports = router;