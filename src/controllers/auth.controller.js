const crypto = require('crypto');
const { sendEmail } = require('../utils/email');
const logger = require('../utils/logger');

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
      role: user.role,
      isBlocked: user.isBlocked,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      location: user.location,
      interests: user.interests || [],
      attendedEvents: user.attendedEvents || [],
      savedEvents: user.savedEvents || []
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
    logger.error('REGISTER ERROR', { error });
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
    logger.error('LOGIN ERROR', { error });
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
    logger.error('GOOGLE LOGIN ERROR', { error });
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

// Endpoint para solicitar recuperación de contraseña
async function requestPasswordReset(req, res) {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      // CORREO NO REGISTRADO
      return res.status(404).json({
        message: 'Este correo no está registrado en EventConnect'
      });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expires = Date.now() + 60 * 60 * 1000;

    user.resetPasswordToken = token;
    user.resetPasswordExpires = new Date(expires);
    await user.save();

        const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

    await sendEmail({
      to: user.email,
      subject: '🔐 Recupera tu contraseña - EventConnect',
      html: `
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 20px; text-align: center; }
            .header h1 { font-size: 28px; margin-bottom: 5px; }
            .header p { font-size: 14px; opacity: 0.9; }
            .content { padding: 40px 30px; }
            .content h2 { color: #333; font-size: 20px; margin-bottom: 20px; }
            .content p { color: #666; font-size: 15px; line-height: 1.6; margin-bottom: 20px; }
            .button-wrapper { text-align: center; margin: 30px 0; }
            .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; transition: transform 0.2s, box-shadow 0.2s; }
            .button:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4); }
            .code-box { background: #f8f9fa; border-left: 4px solid #667eea; padding: 15px 20px; margin: 20px 0; border-radius: 4px; font-family: 'Courier New', monospace; word-break: break-all; color: #333; font-size: 12px; }
            .warning { background: #fff3cd; border: 1px solid #ffc107; border-radius: 6px; padding: 15px; margin: 20px 0; color: #856404; font-size: 13px; line-height: 1.5; }
            .footer { background: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e0e0e0; }
            .footer p { color: #999; font-size: 12px; margin: 5px 0; }
            .logo { font-size: 24px; font-weight: bold; color: white; margin-bottom: 10px; }
            .divider { height: 1px; background: #e0e0e0; margin: 30px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <!-- Header -->
            <div class="header">
              <div class="logo">🎯 EventConnect</div>
              <h1>Recupera tu contraseña</h1>
              <p>Solicitud de restablecimiento seguro</p>
            </div>

            <!-- Contenido -->
            <div class="content">
              <h2>Hola ${user.name || user.username},</h2>
              
              <p>Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en <strong>EventConnect</strong>.</p>
              
              <p>Si fuiste tú quien realizó esta solicitud, haz clic en el botón de abajo para crear una nueva contraseña:</p>

              <div class="button-wrapper">
                <a href="${resetUrl}" class="button"><span style="color: white;">🔓 Restablecer contraseña</span></a>
              </div>

              <p style="text-align: center; color: #999; font-size: 13px;">O copia y pega este enlace en tu navegador:</p>
              <div class="code-box">${resetUrl}</div>

              <div class="divider"></div>

              <div class="warning">
                <strong>⚠️ Importante:</strong> Este enlace expirará en <strong>1 hora</strong>. Si no realizaste esta solicitud, no hagas clic en el enlace y tu contraseña seguirá siendo segura.
              </div>

              <p style="color: #888; font-size: 13px;">
                Si tienes problemas para restablecer tu contraseña, contacta con nuestro equipo de soporte.
              </p>
            </div>

            <!-- Footer -->
            <div class="footer">
              <p><strong>EventConnect</strong> - Conecta con tu ciudad</p>
              <p>© 2026 EventConnect. Todos los derechos reservados.</p>
              <p style="margin-top: 10px; font-size: 11px;">
                Este es un correo automatizado, por favor no respondas a esta dirección.
              </p>
            </div>
          </div>
        </body>
        </html>
      `
    });

    // CORREO EXISTE → OK
    return res.status(200).json({
      message: 'Hemos enviado un enlace de recuperación a tu correo'
    });
  } catch (error) {
    logger.error('REQUEST PASSWORD RESET ERROR', { error });
    return res.status(500).json({ message: 'Error al solicitar recuperación de contraseña' });
  }
}

// Endpoint para restablecer contraseña usando token
async function resetPassword(req, res) {
  try {
    const { token, password } = req.body;

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Token inválido o expirado' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    user.passwordHash = passwordHash;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;

    await user.save();

    return res.status(200).json({ message: 'Contraseña restablecida correctamente' });
  } catch (error) {
    logger.error('RESET PASSWORD ERROR', { error });
    return res.status(500).json({ message: 'Error al restablecer contraseña' });
  }
}


// Endpoint para obtener historial de eventos asistidos (últimos 20, populados)
async function getHistory(req, res) {
  try {
    const userId = req.user?.sub;
    if (!userId) return res.status(401).json({ message: 'No autenticado' });

    const user = await User.findById(userId)
      .populate({
        path: 'attendedEvents',
        model: 'Event',
        options: { strictPopulate: false }
      });

    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

    // Los últimos 20, del más reciente al más antiguo
    const history = [...(user.attendedEvents || [])]
      .reverse()
      .slice(0, 20);

    return res.status(200).json({ success: true, data: history });
  } catch (error) {
    logger.error('GET HISTORY ERROR', { error });
    return res.status(500).json({ message: 'Error al obtener historial' });
  }
}

// Endpoint para obtener eventos a los que el usuario va a asistir (futuros)
async function getAttending(req, res) {
  try {
    const userId = req.user?.sub;
    if (!userId) return res.status(401).json({ message: 'No autenticado' });

    const user = await User.findById(userId)
      .populate({
        path: 'attendedEvents',
        model: 'Event',
        options: { strictPopulate: false }
      });

    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

    const now = new Date();
    // Solo eventos futuros o sin fecha (permanentes)
    const attending = (user.attendedEvents || []).filter(
      (e) => !e.startDate || new Date(e.startDate) >= now
    );

    return res.status(200).json({ success: true, data: attending });
  } catch (error) {
    logger.error('GET ATTENDING ERROR', { error });
    return res.status(500).json({ message: 'Error al obtener eventos de asistencia' });
  }
}


// Mapa de intereses (inglés) a categorías de eventos (español)
const INTERESTS_MAP = {
  'sports':        'Deporte',
  'music':         'Música',
  'culture':       'Teatro y Artes Escénicas',
  'gastronomy':    'Gastronomía',
  'education':     'Formación',
  'family':        'Ocio y Juegos',
  'wellness':      'Aire Libre y Excursiones',
  'solidarity':    'Medio Ambiente y Naturaleza',
  'art':           'Artes plásticas',
  'technology':    'Conferencias y Congresos',
  'languages':     'Idiomas',
  'development':   'Desarrollo personal',
};
 
// Endpoint para obtener recomendaciones personalizadas
// Combina categorías de eventos asistidos (peso 2) e intereses del perfil (peso 1)
async function getRecommendations(req, res) {
  try {
    const userId = req.user?.sub;
    if (!userId) return res.status(401).json({ message: 'No autenticado' });
 
    const limit = parseInt(req.query.limit) || 10;
    const Event = require('../models/Event');
 
    // 1. Obtener usuario con eventos populados
    const user = await User.findById(userId).populate({
      path: 'attendedEvents',
      model: 'Event',
      options: { strictPopulate: false }
    });
 
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });
 
    const myEvents   = user.attendedEvents ?? [];
    const myInterests = user.interests ?? [];
 
    // Si no tiene ni eventos ni intereses → sin recomendaciones
    if (myEvents.length === 0 && myInterests.length === 0) {
      return res.status(200).json({ success: true, data: [], message: 'Sin datos para recomendar' });
    }
 
    // 2. Construir mapa de pesos por categoría
    // Categorías de eventos asistidos → peso 2 (preferencia demostrada)
    // Categorías de intereses         → peso 1 (preferencia declarada)
    const weightMap = new Map();
 
    // Peso 2: eventos asistidos (los más recientes primero → más relevantes)
    [...myEvents].reverse().forEach(e => {
      if (!e.category) return;
      weightMap.set(e.category, (weightMap.get(e.category) ?? 0) + 2);
    });
 
    // Peso 1: intereses del perfil mapeados a categorías
    myInterests.forEach(interest => {
      const cat = INTERESTS_MAP[interest];
      if (!cat) return;
      weightMap.set(cat, (weightMap.get(cat) ?? 0) + 1);
    });
 
    if (weightMap.size === 0) {
      return res.status(200).json({ success: true, data: [] });
    }
 
    // 3. Ordenar categorías por peso descendente y limitar
    const MAX_CATS   = Math.min(weightMap.size, Math.floor(limit / 2));
    const totalWeight = [...weightMap.values()].reduce((a, b) => a + b, 0);
 
    const sortedCats = [...weightMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, MAX_CATS);
 
    // 4. Calcular slots por categoría proporcionales al peso
    // round(peso_cat / peso_total * limit), mínimo 1
    const slots = sortedCats.map(([cat, weight]) => ({
      cat,
      weight,
      slots: Math.max(1, Math.round((weight / totalWeight) * limit))
    }));
 
    // 5. IDs a excluir (eventos ya asistidos)
    const myIds = myEvents.map(e => e._id);
    const now   = new Date();
 
    // 6. Query por categoría con los slots calculados
    const byCategory = await Promise.all(
      slots.map(({ cat, slots: n }) =>
        Event.find({
          status:   'active',
          category: cat,
          _id:      { $nin: myIds },
          $or: [{ startDate: { $gte: now } }, { startDate: null }]
        })
          .sort({ startDate: 1 })
          .limit(n)
      )
    );
 
    // 7. Intercalar resultados para que no salgan todos de la misma categoría seguidos
    const interleaved = [];
    const maxLen = Math.max(...byCategory.map(arr => arr.length));
    for (let i = 0; i < maxLen; i++) {
      for (const arr of byCategory) {
        if (arr[i]) interleaved.push(arr[i]);
      }
    }
 
    const result = interleaved.slice(0, limit);
 
    return res.status(200).json({
      success: true,
      count:   result.length,
      data:    result,
      categories: slots.map(s => ({ category: s.cat, weight: s.weight, slots: s.slots }))
    });
 
  } catch (error) {
    logger.error('GET RECOMMENDATIONS ERROR', { error });
    return res.status(500).json({ message: 'Error al obtener recomendaciones' });
  }
}

module.exports = {
  register,
  login,
  loginWithGoogle,
  refreshToken,
  logout,
  getProfile,
  updateProfile,
  requestPasswordReset,
  resetPassword,
  getHistory,
  getAttending,
  getRecommendations
};