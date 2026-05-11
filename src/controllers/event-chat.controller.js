const EventMessage = require('../models/EventMessage');
const User = require('../models/User');
const FriendRequest = require('../models/FriendRequest');
const logger = require('../utils/logger');

// GET /api/event-chat/:eventId/messages
async function getEventMessages(req, res) {
  try {
    const { eventId } = req.params;

    const messages = await EventMessage.find({ eventId })
      .sort({ createdAt: 1 })
      .limit(50)
      .populate('sender', 'name username avatarUrl');

    return res.status(200).json({ success: true, data: messages });
  } catch (error) {
    logger.error('GET EVENT MESSAGES ERROR', { error });
    return res.status(500).json({ message: 'Error al obtener mensajes' });
  }
}

// POST /api/event-chat/:eventId/messages
async function sendEventMessage(req, res) {
  try {
    const { eventId } = req.params;
    const userId = req.user?.sub;
    const { content } = req.body;

    if (!content?.trim()) {
      return res.status(400).json({ message: 'El mensaje no puede estar vacío' });
    }

    // Verificar que el usuario está apuntado al evento
    const user = await User.findById(userId).select('attendedEvents');
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    const isAttending = user.attendedEvents.some(id => id.toString() === eventId);
    if (!isAttending) {
      return res.status(403).json({ message: 'Tienes que apuntarte al evento para escribir en el chat' });
    }

    const message = await EventMessage.create({
      eventId,
      sender: userId,
      content: content.trim()
    });

    // Devolver populado para que el frontend lo muestre directamente
    const populated = await message.populate('sender', 'name username avatarUrl');

    return res.status(201).json({ success: true, data: populated });
  } catch (error) {
    logger.error('SEND EVENT MESSAGE ERROR', { error });
    return res.status(500).json({ message: 'Error al enviar mensaje' });
  }
}

// GET /api/event-chat/:eventId/friends
// Devuelve los amigos del usuario que también van a este evento
async function getFriendsAttending(req, res) {
  try {
    const { eventId } = req.params;
    const userId = req.user?.sub;

    // 1. Obtener amigos del usuario
    const friendRequests = await FriendRequest.find({
      $or: [
        { fromUser: userId, status: 'accepted' },
        { toUser: userId, status: 'accepted' }
      ]
    });

    const friendIds = friendRequests.map(r =>
      r.fromUser.toString() === userId ? r.toUser : r.fromUser
    );

    if (friendIds.length === 0) {
      return res.status(200).json({ success: true, data: [] });
    }

    // 2. De esos amigos, ver cuáles tienen el eventId en attendedEvents
    const friendsAttending = await User.find({
      _id: { $in: friendIds },
      attendedEvents: eventId
    }).select('name username avatarUrl');

    return res.status(200).json({ success: true, data: friendsAttending });
  } catch (error) {
    logger.error('GET FRIENDS ATTENDING ERROR', { error });
    return res.status(500).json({ message: 'Error al obtener amigos' });
  }
}

module.exports = { getEventMessages, sendEventMessage, getFriendsAttending };