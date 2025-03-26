const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Producto = require('../models/productos');
const multer = require('multer');
const path = require('path');

// Configuración de multer para subida de imágenes
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        // Corregido la ruta para eliminar los backticks incorrectos
        cb(null, 'uploads/productos/');
    },
    filename: function(req, file, cb) {
        cb(null, `producto-${Date.now()}${path.extname(file.originalname)}`);
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

// Obtener todos los productos
router.get('/', async (req, res) => {
    try {
        // Parámetros para filtrado y paginación
        const { categoria, marca, precioMin, precioMax, page = 1, limit = 10, sort } = req.query;
        
        // Construir el objeto de filtro
        const filtro = {};
        if (categoria) filtro.category = categoria;
        if (marca) filtro.brand = marca;
        
        // Filtro de precio
        if (precioMin || precioMax) {
            filtro.price = {};
            if (precioMin) filtro.price.$gte = Number(precioMin);
            if (precioMax) filtro.price.$lte = Number(precioMax);
        }
        
        // Opciones de ordenamiento
        const opcionesSort = {};
        if (sort) {
            const [campo, orden] = sort.split(':');
            opcionesSort[campo] = orden === 'desc' ? -1 : 1;
        } else {
            opcionesSort.price = 1; // Orden predeterminado por precio ascendente
        }
        
        // Ejecutar la consulta con paginación
        const skip = (page - 1) * limit;
        
        const productos = await Producto.find(filtro)
            .sort(opcionesSort)
            .skip(skip)
            .limit(Number(limit));
            
        // Contar total de documentos para la paginación
        const total = await Producto.countDocuments(filtro);
        
        res.status(200).json({
            data: productos,
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener productos', error: error.message });
    }
});

// Obtener un producto por ID
router.get('/:id', async (req, res) => {
    try {
        const producto = await Producto.findById(req.params.id);
        if (!producto) {
            return res.status(404).json({ mensaje: 'Producto no encontrado.' });
        }
        res.status(200).json(producto);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener producto', error: error.message });
    }
});

// Crear un nuevo producto (solo administradores)
router.post('/', verificarToken, esAdmin, upload.single('image'), async (req, res) => {
    try {
        const productoData = req.body;
        
        // Si hay una imagen subida, guardar la ruta
        if (req.file) {
            productoData.image = `/uploads/productos/${req.file.filename}`;
        }
        
        // Convertir campos numéricos
        if (productoData.price) productoData.price = Number(productoData.price);
        if (productoData.rating) productoData.rating = Number(productoData.rating);
        if (productoData.reviews) productoData.reviews = Number(productoData.reviews);
        if (productoData.discount) productoData.discount = Number(productoData.discount);
        if (productoData.stock) productoData.stock = Number(productoData.stock);
        
        // Convertir features de string a array si viene como string
        if (productoData.features && typeof productoData.features === 'string') {
            productoData.features = productoData.features.split(',').map(item => item.trim());
        }
        
        const nuevoProducto = new Producto(productoData);
        await nuevoProducto.save();
        
        res.status(201).json({
            mensaje: 'Producto creado exitosamente',
            producto: nuevoProducto
        });
    } catch (error) {
        console.error('Error al crear producto:', error);
        res.status(400).json({ mensaje: 'Error al crear producto', error: error.message });
    }
});

// Actualizar un producto (solo administradores)
router.put('/:id', verificarToken, esAdmin, upload.single('image'), async (req, res) => {
    try {
        const productoData = req.body;
        
        // Si hay una imagen subida, actualizar la ruta
        if (req.file) {
            productoData.image = `/uploads/productos/${req.file.filename}`;
        } else if (req.body.imageUrl) {
            // Si no hay una nueva imagen pero se envía una URL existente, mantenerla
            productoData.image = req.body.imageUrl;
        }
        
        // Convertir campos numéricos
        if (productoData.price) productoData.price = Number(productoData.price);
        if (productoData.rating) productoData.rating = Number(productoData.rating);
        if (productoData.reviews) productoData.reviews = Number(productoData.reviews);
        if (productoData.discount) productoData.discount = Number(productoData.discount);
        if (productoData.stock) productoData.stock = Number(productoData.stock);
        
        // Convertir features de string a array si viene como string
        if (productoData.features && typeof productoData.features === 'string') {
            productoData.features = productoData.features.split(',').map(item => item.trim());
        }
        
        // Eliminar imageUrl si existe para no guardarla en la base de datos
        if (productoData.imageUrl) {
            delete productoData.imageUrl;
        }
        
        const productoActualizado = await Producto.findByIdAndUpdate(
            req.params.id,
            { $set: productoData },
            { new: true }
        );
        
        if (!productoActualizado) {
            return res.status(404).json({ mensaje: 'Producto no encontrado.' });
        }
        
        res.status(200).json({
            mensaje: 'Producto actualizado exitosamente',
            producto: productoActualizado
        });
    } catch (error) {
        console.error('Error al actualizar producto:', error);
        res.status(500).json({ mensaje: 'Error al actualizar producto', error: error.message });
    }
});

// Eliminar un producto (solo administradores)
router.delete('/:id', verificarToken, esAdmin, async (req, res) => {
    try {
        const productoEliminado = await Producto.findByIdAndDelete(req.params.id);
        
        if (!productoEliminado) {
            return res.status(404).json({ mensaje: 'Producto no encontrado.' });
        }
        
        res.status(200).json({ mensaje: 'Producto eliminado exitosamente.' });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al eliminar producto', error: error.message });
    }
});

module.exports = router;