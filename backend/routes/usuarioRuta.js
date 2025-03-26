const bcrypt = require('bcrypt');
const express = require('express');
const router = express.Router();
const Usuario = require('../models/usuarios');


// Ruta para registrar un usuario
router.post('/registro', async (req, res) => {
    const { name, surname, phone, email, password, role, status } = req.body;

    try {
        if (!name || !surname || !phone || !email || !password || !role) {
            return res.status(400).json({ message: "Todos los campos son obligatorios" });
        }

        const existingUser = await Usuario.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "El correo ya está registrado" });
        }

        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const newUser = new Usuario({
            name,
            surname,
            phone,
            email,
            password: hashedPassword,
            role,
            status: status || 'active'
        });

        await newUser.save();
        
        res.json({ 
            message: 'Usuario registrado con éxito',
            redirect: role === 'admin' ? '/admin/dashboard' : '/privado/dashboard' // Redirección basada en el rol
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Obtener todos los usuarios
router.get('/u', async (req, res) => {
    try {
        const usuarios = await Usuario.find();
        res.json(usuarios);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Obtener un usuario por ID
router.get('/:id', async (req, res) => {
    try {
        const usuario = await Usuario.findById(req.params.id);
        if (!usuario) return res.status(404).json({ message: 'Usuario no encontrado' });
        res.json(usuario);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Actualizar un usuario
router.put('/:id', async (req, res) => {
    try {
        const usuarioActualizado = await Usuario.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(usuarioActualizado);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Eliminar un usuario
router.delete('/:id', async (req, res) => {
    try {
        await Usuario.findByIdAndDelete(req.params.id);
        res.json({ message: 'Usuario eliminado correctamente' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
