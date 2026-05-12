/**
 * Aplicación: EventConnect - Plataforma de gestión de eventos
 * Archivo: friends.controller.js
 * Descripción: Controlador para gestionar solicitudes de amistad.
 * Autor: Pablo Báscones, Mario Caudevilla, Mario Hernández y David Borrel
 */
const User = require('../models/User');
const FriendRequest = require('../models/FriendRequest');
const logger = require('../utils/logger');

// Enviar solicitud de amistad
async function sendFriendRequest(req, res) {
  try {
    const userId = req.user?.sub;
    const { friendId } = req.body;

    if (!userId || !friendId) {
      return res.status(400).json({ message: 'Datos incompletos' });
    }

    if (userId === friendId) {
      return res.status(400).json({ message: 'No puedes enviarte una solicitud a ti mismo' });
    }

    const user = await User.findById(userId);
    const friend = await User.findById(friendId);

    if (!user || !friend) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Verificar si ya existe una solicitud (en cualquier dirección)
    const existingRequest = await FriendRequest.findOne({
      $or: [
        { fromUser: userId, toUser: friendId },
        { fromUser: friendId, toUser: userId }
      ]
    });

    if (existingRequest) {
      return res.status(400).json({ message: 'Ya existe una solicitud entre estos usuarios' });
    }

    // Crear solicitud
    const friendRequest = await FriendRequest.create({
      fromUser: userId,
      toUser: friendId,
      status: 'pending'
    });

    return res.status(201).json({
      message: 'Solicitud de amistad enviada',
      friendRequest
    });
  } catch (error) {
    logger.error('SEND FRIEND REQUEST ERROR', { error });
    return res.status(500).json({ message: 'Error al enviar solicitud' });
  }
}

// Aceptar solicitud de amistad
async function acceptFriendRequest(req, res) {
  try {
    const userId = req.user?.sub;
    const { requestId } = req.params;

    if (!userId || !requestId) {
      return res.status(400).json({ message: 'Datos incompletos' });
    }

    const friendRequest = await FriendRequest.findById(requestId);

    if (!friendRequest) {
      return res.status(404).json({ message: 'Solicitud no encontrada' });
    }

    if (friendRequest.toUser.toString() !== userId) {
      return res.status(403).json({ message: 'No tienes permiso para aceptar esta solicitud' });
    }

    if (friendRequest.status !== 'pending') {
      return res.status(400).json({ message: 'Esta solicitud ya ha sido procesada' });
    }

    // Actualizar solicitud a aceptada
    friendRequest.status = 'accepted';
    await friendRequest.save();

    return res.status(200).json({
      message: 'Solicitud aceptada, ¡ahora sois amigos!',
      friendRequest
    });
  } catch (error) {
    logger.error('ACCEPT FRIEND REQUEST ERROR', { error });
    return res.status(500).json({ message: 'Error al aceptar solicitud' });
  }
}

// Rechazar solicitud de amistad
async function rejectFriendRequest(req, res) {
  try {
    const userId = req.user?.sub;
    const { requestId } = req.params;

    if (!userId || !requestId) {
      return res.status(400).json({ message: 'Datos incompletos' });
    }

    const friendRequest = await FriendRequest.findById(requestId);

    if (!friendRequest) {
      return res.status(404).json({ message: 'Solicitud no encontrada' });
    }

    if (friendRequest.toUser.toString() !== userId) {
      return res.status(403).json({ message: 'No tienes permiso para rechazar esta solicitud' });
    }

    if (friendRequest.status !== 'pending') {
      return res.status(400).json({ message: 'Esta solicitud ya ha sido procesada' });
    }

    // Actualizar solicitud a rechazada
    friendRequest.status = 'rejected';
    await friendRequest.save();

    return res.status(200).json({
      message: 'Solicitud rechazada'
    });
  } catch (error) {
    logger.error('REJECT FRIEND REQUEST ERROR', { error });
    return res.status(500).json({ message: 'Error al rechazar solicitud' });
  }
}

// Obtener solicitudes pendientes del usuario
async function getPendingRequests(req, res) {
  try {
    const userId = req.user?.sub;

    const pendingRequests = await FriendRequest.find({
      toUser: userId,
      status: 'pending'
    }).populate('fromUser', 'name username email avatarUrl bio location');

    return res.status(200).json({
      pendingRequests
    });
  } catch (error) {
    logger.error('GET PENDING REQUESTS ERROR', { error });
    return res.status(500).json({ message: 'Error al obtener solicitudes' });
  }
}

// Obtener lista de amigos del usuario (aceptadas)
async function getFriends(req, res) {
  try {
    const userId = req.user?.sub;

    // Buscar todas las solicitudes aceptadas donde el usuario es fromUser o toUser
    const friendRequests = await FriendRequest.find({
      $or: [
        { fromUser: userId, status: 'accepted' },
        { toUser: userId, status: 'accepted' }
      ]
    }).populate([
      { path: 'fromUser', select: 'name username email avatarUrl bio location' },
      { path: 'toUser', select: 'name username email avatarUrl bio location' }
    ]);

    // Extraer los amigos (el otro usuario en cada relación)
    const friends = friendRequests.map(req => {
      return req.fromUser._id.toString() === userId ? req.toUser : req.fromUser;
    });

    return res.status(200).json({
      friends,
      count: friends.length
    });
  } catch (error) {
    logger.error('GET FRIENDS ERROR', { error });
    return res.status(500).json({ message: 'Error al obtener amigos' });
  }
}

// Eliminar amigo
async function removeFriend(req, res) {
  try {
    const userId = req.user?.sub;
    const { friendId } = req.params;

    if (!userId || !friendId) {
      return res.status(400).json({ message: 'Datos incompletos' });
    }

    // Buscar la solicitud aceptada entre estos dos usuarios
    const friendRequest = await FriendRequest.findOne({
      $or: [
        { fromUser: userId, toUser: friendId, status: 'accepted' },
        { fromUser: friendId, toUser: userId, status: 'accepted' }
      ]
    });

    if (!friendRequest) {
      return res.status(404).json({ message: 'No sois amigos' });
    }

    // Eliminar la solicitud
    await FriendRequest.findByIdAndDelete(friendRequest._id);

    return res.status(200).json({
      message: 'Amigo eliminado'
    });
  } catch (error) {
    logger.error('REMOVE FRIEND ERROR', { error });
    return res.status(500).json({ message: 'Error al eliminar amigo' });
  }
}

// Obtener amigos sugeridos (amigos de tus amigos)
async function getSuggestedFriends(req, res) {
  try {
    const userId = req.user?.sub;

    // Obtener amigos del usuario
    const userFriendRequests = await FriendRequest.find({
      $or: [
        { fromUser: userId, status: 'accepted' },
        { toUser: userId, status: 'accepted' }
      ]
    });

    // Extraer IDs de amigos
    const friendIds = userFriendRequests.map(req => {
      return req.fromUser.toString() === userId ? req.toUser : req.fromUser;
    });

    // IDs de usuarios a los que ya enviaste solicitud pendiente
    const sentRequests = await FriendRequest.find({
      fromUser: userId,
      status: 'pending'
    });
    const sentToIds = sentRequests.map(r => r.toUser.toString());

    // Obtener amigos de amigos
    const friendsOfFriends = await FriendRequest.find({
      $or: [
        { fromUser: { $in: friendIds }, status: 'accepted' },
        { toUser: { $in: friendIds }, status: 'accepted' }
      ]
    }).populate([
      { path: 'fromUser', select: 'name username email avatarUrl bio location _id' },
      { path: 'toUser', select: 'name username email avatarUrl bio location _id' }
    ]);

    // Crear mapa de usuarios sugeridos con contador de amigos en común
    const suggestedMap = new Map();

    friendsOfFriends.forEach(req => {
      // De cada relación de amistad, extraer el usuario que NO es el userId
      // ni ninguno de sus amigos directos — ese es el candidato a sugerir
      const fromId = req.fromUser._id.toString();
      const toId   = req.toUser._id.toString();

      // El candidato es el extremo que no es uno de nuestros amigos directos ni nosotros mismos
      let suggestedUser = null;
      if (fromId !== userId && !friendIds.some(id => id.toString() === fromId)) {
        suggestedUser = req.fromUser;
      } else if (toId !== userId && !friendIds.some(id => id.toString() === toId)) {
        suggestedUser = req.toUser;
      }

      if (!suggestedUser) return;

      // No sugerir si ya es amigo, es el mismo usuario, o ya tiene solicitud enviada
      if (
        suggestedUser._id.toString() === userId ||
        friendIds.some(id => id.toString() === suggestedUser._id.toString()) ||
        sentToIds.includes(suggestedUser._id.toString())
      ) {
        return;
      }

      const key = suggestedUser._id.toString();
      if (suggestedMap.has(key)) {
        suggestedMap.get(key).mutualFriends++;
      } else {
        suggestedMap.set(key, {
          ...suggestedUser.toObject?.() || suggestedUser,
          mutualFriends: 1
        });
      }
    });

    // Convertir a array, ordenar por amigos en común y coger aleatorios
    let suggestedArray = Array.from(suggestedMap.values())
      .sort((a, b) => b.mutualFriends - a.mutualFriends);

    // Tomar 3-5 aleatorios de los mejores sugeridos
    const randomCount = Math.min(suggestedArray.length, Math.floor(Math.random() * 3) + 3); // 3-5
    const suggested = suggestedArray
      .slice(0, Math.min(suggestedArray.length, 10)) // Top 10 primero
      .sort(() => Math.random() - 0.5) // Shuffle
      .slice(0, randomCount); // Coger N aleatorios

    return res.status(200).json({
      suggestedFriends: suggested
    });
  } catch (error) {
    logger.error('GET SUGGESTED FRIENDS ERROR', { error });
    return res.status(500).json({ message: 'Error al obtener amigos sugeridos' });
  }
}

async function getSearchableUsers(req, res) {
  try {
    const userId = req.user?.sub;

    const users = await User.find(
      { _id: { $ne: userId } },
      'name username email avatarUrl bio location'
    );

    logger.debug('REQ USER EN SEARCHABLE', { user: req.user });
    return res.status(200).json({ users });
  } catch (error) {
    logger.error('GET SEARCHABLE USERS ERROR', { error });
    return res.status(500).json({ message: 'Error al obtener usuarios' });
  }
}

async function getUsersBySearch(req, res) {
  try {
    const userId = req.user?.sub;
    const q = (req.query.q || '').trim();

    const filter = {
      _id: { $ne: userId }
    };

    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: 'i' } },
        { username: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } }
      ];
    }

    const users = await User.find(
      filter,
      'name username email avatarUrl bio location'
    ).limit(20);

    return res.status(200).json({ users });
  } catch (error) {
    logger.error('SEARCH USERS ERROR', { error });
    return res.status(500).json({ message: 'Error al buscar usuarios' });
  }
}

async function getSentRequests(req, res) {
  try {
    const userId = req.user?.sub;

    const sentRequests = await FriendRequest.find({
      fromUser: userId,
      status: 'pending'
    }).populate('toUser', 'name username email avatarUrl bio location');

    return res.status(200).json({ sentRequests });
  } catch (error) {
    logger.error('GET SENT REQUESTS ERROR', { error });
    return res.status(500).json({ message: 'Error al obtener solicitudes enviadas' });
  }
}

module.exports = {
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  getPendingRequests,
  getFriends,
  removeFriend,
  getSuggestedFriends,
  getSearchableUsers,
  getSentRequests,
  getUsersBySearch
};