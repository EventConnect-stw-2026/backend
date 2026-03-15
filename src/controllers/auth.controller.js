// Endpoint para actualizar perfil del usuario autenticado
async function updateProfile(req, res) {
  try {
    const userId = req.user?.sub;
    if (!userId) {
      return res.status(401).json({ message: 'No autenticado' });
    }
    const {
      name,
      username,
      avatarUrl,
      bio,
      location,
      interests,
      passwordChange
    } = req.body;

    const updateFields = {
      name,
      username,
      avatarUrl,
      bio,
      location,
      interests
    };

    // Actualizar contraseña si se solicita
    if (passwordChange && passwordChange.currentPassword && passwordChange.newPassword) {
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'Usuario no encontrado' });
      }
      const isValidPassword = await bcrypt.compare(passwordChange.currentPassword, user.passwordHash);
      if (!isValidPassword) {
        return res.status(401).json({ message: 'Contraseña actual incorrecta' });
      }
      updateFields.passwordHash = await bcrypt.hash(passwordChange.newPassword, 10);
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updateFields, { new: true });
    if (!updatedUser) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    return res.status(200).json({
      message: 'Perfil actualizado correctamente',
      user: {
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        username: updatedUser.username,
        avatarUrl: updatedUser.avatarUrl,
        bio: updatedUser.bio,
        location: updatedUser.location,
        interests: updatedUser.interests || []
      }
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error al actualizar perfil' });
  }
}
// Endpoint para obtener perfil del usuario autenticado
async function getProfile(req, res) {
  try {
    const userId = req.user?.sub;
    if (!userId) {
      return res.status(401).json({ message: 'No autenticado' });
    }
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    return res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      username: user.username,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      location: user.location,
      interests: user.interests || []
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error al obtener perfil' });
  }
}
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

function generateToken(user, expiresIn = '15m') {
  return jwt.sign(
    {
      sub: user._id,
      email: user.email,
      role: user.role
    },
    process.env.JWT_SECRET,
    { expiresIn }
  );
}

function generateRefreshToken(user) {
  return jwt.sign(
    {
      sub: user._id,
      email: user.email,
      role: user.role
    },
    process.env.JWT_REFRESH_SECRET,
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

    const accessToken = generateToken(user);
    const refreshToken = generateRefreshToken(user);

    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000 // 15 min
    });
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 días
    });

    return res.status(201).json({
      message: 'Usuario registrado correctamente',
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

    const accessToken = generateToken(user);
    const refreshToken = generateRefreshToken(user);

    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000 // 15 min
    });
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 días
    });

    return res.status(200).json({
      message: 'Login correcto',
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

    const accessToken = generateToken(user);
    const refreshToken = generateRefreshToken(user);

    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000 // 15 min
    });
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 días
    });

    return res.status(200).json({
      message: 'Autenticación exitosa',
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

// Endpoint para renovar access token
async function refreshToken(req, res) {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({ message: 'Refresh token no proporcionado' });
    }
    let payload;
    try {
      payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch (err) {
      return res.status(401).json({ message: 'Refresh token inválido o expirado' });
    }
    const user = await User.findById(payload.sub);
    if (!user) {
      return res.status(401).json({ message: 'Usuario no encontrado' });
    }
    const accessToken = generateToken(user);
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000
    });
    return res.status(200).json({ message: 'Access token renovado' });
  } catch (error) {
    return res.status(500).json({ message: 'Error al renovar token' });
  }
}

// Endpoint para logout
async function logout(req, res) {
  res.clearCookie('accessToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  });
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  });
  return res.status(200).json({ message: 'Logout exitoso' });
}

module.exports = {
  register,
  login,
  loginWithGoogle,
  refreshToken,
  logout,
  getProfile,
  updateProfile
};