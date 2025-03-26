const Usuario = require('../models/usuarios');
const bcrypt = require('bcryptjs');

exports.register = async (req, res) => {
    try {
        // Verificar si el correo ya existe
        const existeUsuario = await Usuario.findOne({ email: req.body.email });
        if (existeUsuario) return res.status(400).json({ message: "El correo ya está registrado" });

        // Crear nuevo usuario con rol predeterminado "cliente"
        const nuevoUsuario = new Usuario({
            nombre: req.body.nombre,
            apellido: req.body.apellido,
            telefono: req.body.telefono,
            email: req.body.email,
            password: await bcrypt.hash(req.body.password, 10), // Hashear la contraseña
            role: 'cliente' // Se asigna automáticamente el rol "cliente"
        });

        await nuevoUsuario.save();
        res.status(201).json({ message: "Registro exitoso, ahora puedes iniciar sesión" });
    } catch (error) {
        res.status(500).json({ message: "Error en el registro", error });
    }
};

exports.login = async (req, res) => {
    const { email, password } = req.body;

    try {
        const usuario = await Usuario.findOne({ email });
        if (!usuario) return res.status(400).json({ message: "Usuario no encontrado" });

        const esValido = await bcrypt.compare(password, usuario.password);
        if (!esValido) return res.status(400).json({ message: "Contraseña incorrecta" });

        // Guardar sesión
        req.session.userId = usuario._id;
        req.session.role = usuario.role;

        // Redirigir según el rol
        res.json({
            message: "Login exitoso",
            role: usuario.role
        });
    } catch (error) {
        res.status(500).json({ message: "Error en el servidor" });
    }
};


