const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

function generateToken(user) {
  return jwt.sign(
    {
      sub: user._id,
      email: user.email,
      role: user.role
    },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

async function register(req, res, next) {
  try {
    const { name, username, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        message: 'Ya existe un usuario con ese correo'
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      username,
      email,
      passwordHash,
      role: 'user',
      isBlocked: false
    });

    const token = generateToken(user);

    return res.status(201).json({
      message: 'Usuario registrado correctamente',
      token,
      user: {
        _id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
        isBlocked: user.isBlocked,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
        location: user.location,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });
  } catch (error) {
    console.error("REGISTER ERROR:");
    console.error(error);
    console.error(error.stack);
    return res.status(500).json({ message: 'Error en el servidor' });
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        message: 'Este correo no está registrado. Por favor, regístrate primero'
      });
    }

    if (user.isBlocked) {
      return res.status(403).json({
        message: 'Usuario bloqueado'
      });
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({
        message: 'Contraseña incorrecta'
      });
    }

    const token = generateToken(user);

    return res.status(200).json({
      message: 'Login correcto',
      token,
      user: {
        _id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
        isBlocked: user.isBlocked,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
        location: user.location,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });
  } catch (error) {
    console.error("LOGIN ERROR:");
    console.error(error);
    console.error(error.stack);
    return res.status(500).json({ message: 'Error en el servidor' });

  }
}

async function loginWithGoogle(req, res, next) {
  try {
    const { token, isRegistering } = req.body;

    if (!token) {
      return res.status(400).json({ message: 'Token de Google requerido' });
    }

    // Verificar token de Google
    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    const { email, name, picture } = payload;

    // Buscar usuario existente
    let user = await User.findOne({ email });

    // Si no existe y es REGISTRO, crear
    if (!user && isRegistering) {
      const username = email.split('@')[0] + Math.random().toString(36).slice(2, 9);
      user = await User.create({
        name,
        username,
        email,
        passwordHash: 'google-oauth',
        role: 'user',
        isBlocked: false,
        avatarUrl: picture || ''
      });
    }

    // Si no existe y es LOGIN, error
    if (!user && !isRegistering) {
      return res.status(401).json({ 
        message: 'Esta cuenta no existe. Por favor, regístrate primero' 
      });
    }

    if (user.isBlocked) {
      return res.status(403).json({ message: 'Usuario bloqueado' });
    }

    const jwtToken = generateToken(user);

    return res.status(200).json({
      message: 'Autenticación exitosa',
      token: jwtToken,
      user: {
        _id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
        isBlocked: user.isBlocked,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
        location: user.location,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });
  } catch (error) {
    console.error('GOOGLE LOGIN ERROR:', error);
    return res.status(401).json({ message: 'Token de Google inválido o expirado' });
  }
}

module.exports = {
  register,
  login,
  loginWithGoogle
};