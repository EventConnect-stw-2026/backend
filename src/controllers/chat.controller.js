const mongoose = require('mongoose');
const User = require('../models/User');
const FriendRequest = require('../models/FriendRequest');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const logger = require('../utils/logger');

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

function buildParticipantsKey(userId1, userId2) {
  return [userId1.toString(), userId2.toString()].sort().join(':');
}

async function areAcceptedFriends(userId, otherUserId) {
  return FriendRequest.findOne({
    $or: [
      { fromUser: userId, toUser: otherUserId, status: 'accepted' },
      { fromUser: otherUserId, toUser: userId, status: 'accepted' }
    ]
  });
}

function getOtherParticipant(conversation, currentUserId) {
  return conversation.participants.find(
    (p) => p._id.toString() !== currentUserId.toString()
  );
}

// Crear o recuperar conversación privada
async function createOrGetConversation(req, res) {
  try {
    const userId = req.user?.sub;
    const { friendId } = req.params;

    if (!userId || !friendId) {
      return res.status(400).json({ message: 'Datos incompletos' });
    }

    if (!isValidObjectId(userId) || !isValidObjectId(friendId)) {
      return res.status(400).json({ message: 'ID inválido' });
    }

    if (userId.toString() === friendId.toString()) {
      return res.status(400).json({ message: 'No puedes crear un chat contigo mismo' });
    }

    const [user, friend] = await Promise.all([
      User.findById(userId),
      User.findById(friendId)
    ]);

    if (!user || !friend) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const friendship = await areAcceptedFriends(userId, friendId);
    if (!friendship) {
      return res.status(403).json({ message: 'Solo puedes chatear con usuarios que sean tus amigos' });
    }

    const participantsKey = buildParticipantsKey(userId, friendId);

    let conversation = await Conversation.findOne({ participantsKey })
      .populate('participants', 'name username email avatarUrl bio location');

    if (!conversation) {
      conversation = await Conversation.create({
        participants: participantsKey.split(':'),
        participantsKey,
        lastMessage: '',
        lastMessageAt: null
      });

      conversation = await Conversation.findById(conversation._id)
        .populate('participants', 'name username email avatarUrl bio location');
    }

    const otherUser = getOtherParticipant(conversation, userId);

    return res.status(200).json({
      conversation: {
        _id: conversation._id,
        participants: conversation.participants,
        otherUser,
        lastMessage: conversation.lastMessage,
        lastMessageAt: conversation.lastMessageAt,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt
      }
    });
  } catch (error) {
    logger.error('CREATE OR GET CONVERSATION ERROR', { error });
    return res.status(500).json({ message: 'Error al crear u obtener la conversación' });
  }
}

// Listar conversaciones del usuario
async function getMyConversations(req, res) {
  try {
    const userId = req.user?.sub;

    if (!userId) {
      return res.status(401).json({ message: 'No autenticado' });
    }

    const conversations = await Conversation.find({
      participants: userId
    })
      .populate('participants', 'name username email avatarUrl bio location')
      .sort({ lastMessageAt: -1, updatedAt: -1 });

    const data = await Promise.all(
      conversations.map(async (conversation) => {
        const otherUser = getOtherParticipant(conversation, userId);

        const unreadCount = await Message.countDocuments({
          conversationId: conversation._id,
          receiver: userId,
          isRead: false
        });

        return {
          _id: conversation._id,
          otherUser,
          participants: conversation.participants,
          lastMessage: conversation.lastMessage,
          lastMessageAt: conversation.lastMessageAt,
          unreadCount,
          createdAt: conversation.createdAt,
          updatedAt: conversation.updatedAt
        };
      })
    );

    return res.status(200).json({
      conversations: data,
      count: data.length
    });
  } catch (error) {
    logger.error('GET MY CONVERSATIONS ERROR', { error });
    return res.status(500).json({ message: 'Error al obtener conversaciones' });
  }
}

// Obtener mensajes de una conversación
async function getConversationMessages(req, res) {
  try {
    const userId = req.user?.sub;
    const { conversationId } = req.params;

    if (!userId || !conversationId) {
      return res.status(400).json({ message: 'Datos incompletos' });
    }

    if (!isValidObjectId(conversationId)) {
      return res.status(400).json({ message: 'ID de conversación inválido' });
    }

    const conversation = await Conversation.findById(conversationId)
      .populate('participants', 'name username email avatarUrl bio location');

    if (!conversation) {
      return res.status(404).json({ message: 'Conversación no encontrada' });
    }

    const belongsToConversation = conversation.participants.some(
      (p) => p._id.toString() === userId.toString()
    );

    if (!belongsToConversation) {
      return res.status(403).json({ message: 'No tienes permiso para acceder a esta conversación' });
    }

    const messages = await Message.find({ conversationId })
      .populate('sender', 'name username avatarUrl')
      .populate('receiver', 'name username avatarUrl')
      .sort({ createdAt: 1 });

    const otherUser = getOtherParticipant(conversation, userId);

    return res.status(200).json({
      conversation: {
        _id: conversation._id,
        otherUser,
        participants: conversation.participants,
        lastMessage: conversation.lastMessage,
        lastMessageAt: conversation.lastMessageAt
      },
      messages
    });
  } catch (error) {
    logger.error('GET CONVERSATION MESSAGES ERROR', { error });
    return res.status(500).json({ message: 'Error al obtener mensajes' });
  }
}

// Enviar mensaje
async function sendMessage(req, res) {
  try {
    const userId = req.user?.sub;
    const { conversationId } = req.params;
    const { content } = req.body;

    if (!userId || !conversationId) {
      return res.status(400).json({ message: 'Datos incompletos' });
    }

    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'El mensaje no puede estar vacío' });
    }

    if (!isValidObjectId(conversationId)) {
      return res.status(400).json({ message: 'ID de conversación inválido' });
    }

    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({ message: 'Conversación no encontrada' });
    }

    const participantIds = conversation.participants.map((p) => p.toString());

    if (!participantIds.includes(userId.toString())) {
      return res.status(403).json({ message: 'No tienes permiso para enviar mensajes en esta conversación' });
    }

    const receiverId = participantIds.find((id) => id !== userId.toString());

    const friendship = await areAcceptedFriends(userId, receiverId);
    if (!friendship) {
      return res.status(403).json({ message: 'Ya no podéis enviar mensajes porque no sois amigos' });
    }

    const trimmedContent = content.trim();

    const message = await Message.create({
      conversationId: conversation._id,
      sender: userId,
      receiver: receiverId,
      content: trimmedContent,
      isRead: false
    });

    conversation.lastMessage = trimmedContent;
    conversation.lastMessageAt = new Date();
    await conversation.save();

    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'name username avatarUrl')
      .populate('receiver', 'name username avatarUrl');

    return res.status(201).json({
      message: 'Mensaje enviado correctamente',
      chatMessage: populatedMessage
    });
  } catch (error) {
    logger.error('SEND MESSAGE ERROR', { error });
    return res.status(500).json({ message: 'Error al enviar mensaje' });
  }
}

// Marcar mensajes como leídos
async function markConversationAsRead(req, res) {
  try {
    const userId = req.user?.sub;
    const { conversationId } = req.params;

    if (!userId || !conversationId) {
      return res.status(400).json({ message: 'Datos incompletos' });
    }

    if (!isValidObjectId(conversationId)) {
      return res.status(400).json({ message: 'ID de conversación inválido' });
    }

    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({ message: 'Conversación no encontrada' });
    }

    const belongsToConversation = conversation.participants.some(
      (p) => p.toString() === userId.toString()
    );

    if (!belongsToConversation) {
      return res.status(403).json({ message: 'No tienes permiso para modificar esta conversación' });
    }

    const result = await Message.updateMany(
      {
        conversationId,
        receiver: userId,
        isRead: false
      },
      {
        $set: { isRead: true }
      }
    );

    return res.status(200).json({
      message: 'Mensajes marcados como leídos',
      updatedCount: result.modifiedCount || 0
    });
  } catch (error) {
    logger.error('MARK CONVERSATION AS READ ERROR', { error });
    return res.status(500).json({ message: 'Error al marcar mensajes como leídos' });
  }
}

async function getUnreadCountsByFriend(req, res) {
  try {
    const userId = req.user?.sub;

    if (!userId) {
      return res.status(401).json({ message: 'No autenticado' });
    }

    const conversations = await Conversation.find({
      participants: userId
    }).populate('participants', 'name username email avatarUrl bio location');

    const unreadMessagesByFriend = {};

    for (const conversation of conversations) {
      const otherUser = getOtherParticipant(conversation, userId);

      if (!otherUser) continue;

      const unreadCount = await Message.countDocuments({
        conversationId: conversation._id,
        receiver: userId,
        isRead: false
      });

      unreadMessagesByFriend[otherUser._id.toString()] = unreadCount;
    }

    return res.status(200).json({
      unreadMessagesByFriend
    });
  } catch (error) {
    logger.error('GET UNREAD COUNTS BY FRIEND ERROR', { error });
    return res.status(500).json({ message: 'Error al obtener mensajes no leídos por amigo' });
  }
}

module.exports = {
  createOrGetConversation,
  getMyConversations,
  getConversationMessages,
  sendMessage,
  markConversationAsRead,
  getUnreadCountsByFriend
};