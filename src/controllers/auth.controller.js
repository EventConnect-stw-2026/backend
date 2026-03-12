const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

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
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        message: 'Credenciales incorrectas'
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
        message: 'Credenciales incorrectas'
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
  }
}

module.exports = {
  register,
  login
};