const crypto = require('crypto');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');

const User = require('../models/User');
const { sendEmail } = require('../utils/email');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

function getCookieOptions(maxAge) {
  const isProduction = process.env.NODE_ENV === 'production';

  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge
  };
}

function getClearCookieOptions() {
  const isProduction = process.env.NODE_ENV === 'production';

  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax'
  };
}

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

function setAuthCookies(res, accessToken, refreshToken) {
  res.cookie(
    'accessToken',
    accessToken,
    getCookieOptions(15 * 60 * 1000)
  );

  res.cookie(
    'refreshToken',
    refreshToken,
    getCookieOptions(7 * 24 * 60 * 60 * 1000)
  );
}

function buildUserResponse(user) {
  return {
    _id: user._id,
    name: user.name,
    username: user.username,
    email: user.email,
    role: user.role,
    isBlocked: user.isBlocked,
    avatarUrl: user.avatarUrl,
    bio: user.bio,
    location: user.location,
    interests: user.interests || [],
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
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

    setAuthCookies(res, accessToken, refreshToken);

    return res.status(201).json({
      message: 'Usuario registrado correctamente',
      user: buildUserResponse(user)
    });
  } catch (error) {
    console.error('REGISTER ERROR:');
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

    setAuthCookies(res, accessToken, refreshToken);

    return res.status(200).json({
      message: 'Login correcto',
      user: buildUserResponse(user)
    });
  } catch (error) {
    console.error('LOGIN ERROR:');
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

    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    const { email, name, picture } = payload;

    let user = await User.findOne({ email });

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

    setAuthCookies(res, accessToken, refreshToken);

    return res.status(200).json({
      message: 'Autenticación exitosa',
      user: buildUserResponse(user)
    });
  } catch (error) {
    console.error('GOOGLE LOGIN ERROR:', error);
    return res.status(401).json({ message: 'Token de Google inválido o expirado' });
  }
}

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

    if (user.isBlocked) {
      return res.status(403).json({ message: 'Usuario bloqueado' });
    }

    const accessToken = generateToken(user);

    res.cookie(
      'accessToken',
      accessToken,
      getCookieOptions(15 * 60 * 1000)
    );

    return res.status(200).json({ message: 'Access token renovado' });
  } catch (error) {
    console.error('REFRESH TOKEN ERROR:', error);
    return res.status(500).json({ message: 'Error al renovar token' });
  }
}

async function logout(req, res) {
  res.clearCookie('accessToken', getClearCookieOptions());
  res.clearCookie('refreshToken', getClearCookieOptions());

  return res.status(200).json({ message: 'Logout exitoso' });
}

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
    console.error('GET PROFILE ERROR:', error);
    return res.status(500).json({ message: 'Error al obtener perfil' });
  }
}

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

    if (passwordChange && passwordChange.currentPassword && passwordChange.newPassword) {
      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).json({ message: 'Usuario no encontrado' });
      }

      const isValidPassword = await bcrypt.compare(
        passwordChange.currentPassword,
        user.passwordHash
      );

      if (!isValidPassword) {
        return res.status(401).json({ message: 'Contraseña actual incorrecta' });
      }

      updateFields.passwordHash = await bcrypt.hash(passwordChange.newPassword, 10);
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateFields,
      { new: true }
    );

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
    console.error('UPDATE PROFILE ERROR:', error);
    return res.status(500).json({ message: 'Error al actualizar perfil' });
  }
}

async function requestPasswordReset(req, res) {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
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
            <div class="header">
              <div class="logo">🎯 EventConnect</div>
              <h1>Recupera tu contraseña</h1>
              <p>Solicitud de restablecimiento seguro</p>
            </div>

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

    return res.status(200).json({
      message: 'Hemos enviado un enlace de recuperación a tu correo'
    });
  } catch (error) {
    console.error('REQUEST PASSWORD RESET ERROR:', error);
    return res.status(500).json({ message: 'Error al solicitar recuperación de contraseña' });
  }
}

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
    console.error('RESET PASSWORD ERROR:', error);
    return res.status(500).json({ message: 'Error al restablecer contraseña' });
  }
}

async function getHistory(req, res) {
  try {
    const userId = req.user?.sub;

    if (!userId) {
      return res.status(401).json({ message: 'No autenticado' });
    }

    const user = await User.findById(userId).populate({
      path: 'attendedEvents',
      model: 'Event',
      options: { strictPopulate: false }
    });

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const history = [...(user.attendedEvents || [])]
      .reverse()
      .slice(0, 20);

    return res.status(200).json({
      success: true,
      data: history
    });
  } catch (error) {
    console.error('GET HISTORY ERROR:', error);
    return res.status(500).json({ message: 'Error al obtener historial' });
  }
}

async function getAttending(req, res) {
  try {
    const userId = req.user?.sub;

    if (!userId) {
      return res.status(401).json({ message: 'No autenticado' });
    }

    const user = await User.findById(userId).populate({
      path: 'attendedEvents',
      model: 'Event',
      options: { strictPopulate: false }
    });

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const now = new Date();

    const attending = (user.attendedEvents || []).filter(
      (event) => !event.startDate || new Date(event.startDate) >= now
    );

    return res.status(200).json({
      success: true,
      data: attending
    });
  } catch (error) {
    console.error('GET ATTENDING ERROR:', error);
    return res.status(500).json({ message: 'Error al obtener eventos de asistencia' });
  }
}

const INTERESTS_MAP = {
  sports: 'Deporte',
  music: 'Música',
  culture: 'Teatro y Artes Escénicas',
  gastronomy: 'Gastronomía',
  education: 'Formación',
  family: 'Ocio y Juegos',
  wellness: 'Aire Libre y Excursiones',
  solidarity: 'Medio Ambiente y Naturaleza',
  art: 'Artes plásticas',
  technology: 'Conferencias y Congresos',
  languages: 'Idiomas',
  development: 'Desarrollo personal'
};

async function getRecommendations(req, res) {
  try {
    const userId = req.user?.sub;

    if (!userId) {
      return res.status(401).json({ message: 'No autenticado' });
    }

    const limit = parseInt(req.query.limit) || 10;
    const Event = require('../models/Event');

    const user = await User.findById(userId).populate({
      path: 'attendedEvents',
      model: 'Event',
      options: { strictPopulate: false }
    });

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const myEvents = user.attendedEvents ?? [];
    const myInterests = user.interests ?? [];

    if (myEvents.length === 0 && myInterests.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
        message: 'Sin datos para recomendar'
      });
    }

    const weightMap = new Map();

    [...myEvents].reverse().forEach((event) => {
      if (!event.category) return;
      weightMap.set(event.category, (weightMap.get(event.category) ?? 0) + 2);
    });

    myInterests.forEach((interest) => {
      const category = INTERESTS_MAP[interest];
      if (!category) return;
      weightMap.set(category, (weightMap.get(category) ?? 0) + 1);
    });

    if (weightMap.size === 0) {
      return res.status(200).json({
        success: true,
        data: []
      });
    }

    const maxCategories = Math.min(weightMap.size, Math.floor(limit / 2));
    const totalWeight = [...weightMap.values()].reduce((a, b) => a + b, 0);

    const sortedCategories = [...weightMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, maxCategories);

    const slots = sortedCategories.map(([category, weight]) => ({
      cat: category,
      weight,
      slots: Math.max(1, Math.round((weight / totalWeight) * limit))
    }));

    const myIds = myEvents.map((event) => event._id);
    const now = new Date();

    const byCategory = await Promise.all(
      slots.map(({ cat, slots: n }) =>
        Event.find({
          status: 'active',
          category: cat,
          _id: { $nin: myIds },
          $or: [{ startDate: { $gte: now } }, { startDate: null }]
        })
          .sort({ startDate: 1 })
          .limit(n)
      )
    );

    const interleaved = [];
    const maxLen = Math.max(...byCategory.map((arr) => arr.length));

    for (let i = 0; i < maxLen; i++) {
      for (const arr of byCategory) {
        if (arr[i]) interleaved.push(arr[i]);
      }
    }

    const result = interleaved.slice(0, limit);

    return res.status(200).json({
      success: true,
      count: result.length,
      data: result,
      categories: slots.map((slot) => ({
        category: slot.cat,
        weight: slot.weight,
        slots: slot.slots
      }))
    });
  } catch (error) {
    console.error('GET RECOMMENDATIONS ERROR:', error);
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
