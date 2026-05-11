const mongoose = require('mongoose');
const Meetup = require('../models/Meetup');
const Event = require('../models/Event');
const User = require('../models/User');
const FriendRequest = require('../models/FriendRequest');
const logger = require('../utils/logger');

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

async function areAcceptedFriends(userId, otherUserId) {
  return FriendRequest.findOne({
    $or: [
      { fromUser: userId, toUser: otherUserId, status: 'accepted' },
      { fromUser: otherUserId, toUser: userId, status: 'accepted' }
    ]
  });
}

async function createMeetup(req, res) {
  try {
    const organizerId = req.user?.sub;
    const { eventId, friendIds, meetupDateTime, meetupPlace } = req.body;

    if (!organizerId || !eventId || !Array.isArray(friendIds) || !meetupDateTime || !meetupPlace?.trim()) {
      return res.status(400).json({ message: 'Datos incompletos' });
    }

    if (!isValidObjectId(eventId)) {
      return res.status(400).json({ message: 'Evento inválido' });
    }

    if (friendIds.length === 0) {
      return res.status(400).json({ message: 'Debes seleccionar al menos un amigo' });
    }

    const uniqueFriendIds = [...new Set(friendIds.map(String))];

    if (uniqueFriendIds.some(id => !isValidObjectId(id))) {
      return res.status(400).json({ message: 'Hay algún amigo con ID inválido' });
    }

    if (uniqueFriendIds.includes(String(organizerId))) {
      return res.status(400).json({ message: 'No puedes invitarte a ti mismo' });
    }

    const [event, organizer] = await Promise.all([
      Event.findById(eventId),
      User.findById(organizerId)
    ]);

    if (!event) {
      return res.status(404).json({ message: 'Evento no encontrado' });
    }

    if (!organizer) {
      return res.status(404).json({ message: 'Organizador no encontrado' });
    }

    const meetupDate = new Date(meetupDateTime);
    if (Number.isNaN(meetupDate.getTime())) {
      return res.status(400).json({ message: 'Fecha de quedada inválida' });
    }

    for (const friendId of uniqueFriendIds) {
      const friendship = await areAcceptedFriends(organizerId, friendId);
      if (!friendship) {
        return res.status(403).json({
          message: 'Solo puedes invitar a usuarios que sean tus amigos'
        });
      }
    }

    const meetup = await Meetup.create({
      organizer: organizerId,
      event: eventId,
      meetupDateTime: meetupDate,
      meetupPlace: meetupPlace.trim(),
      participants: uniqueFriendIds.map(friendId => ({
        user: friendId,
        response: 'pending',
        respondedAt: null
      })),
      status: 'active'
    });

    const populatedMeetup = await Meetup.findById(meetup._id)
      .populate('organizer', 'name username email avatarUrl')
      .populate('event')
      .populate('participants.user', 'name username email avatarUrl');

    return res.status(201).json({
      message: 'Quedada creada correctamente',
      meetup: populatedMeetup
    });
  } catch (error) {
    logger.error('CREATE MEETUP ERROR', { error });
    return res.status(500).json({ message: 'Error al crear la quedada' });
  }
}

async function getOrganizedMeetups(req, res) {
  try {
    const userId = req.user?.sub;

    const meetups = await Meetup.find({
      organizer: userId
    })
      .populate('organizer', 'name username email avatarUrl')
      .populate('event')
      .populate('participants.user', 'name username email avatarUrl')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      meetups
    });
  } catch (error) {
    logger.error('GET ORGANIZED MEETUPS ERROR', { error });
    return res.status(500).json({ message: 'Error al obtener tus quedadas organizadas' });
  }
}

async function getInvitedMeetups(req, res) {
  try {
    const userId = req.user?.sub;

    const meetups = await Meetup.find({
      'participants.user': userId
    })
      .populate('organizer', 'name username email avatarUrl')
      .populate('event')
      .populate('participants.user', 'name username email avatarUrl')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      meetups
    });
  } catch (error) {
    logger.error('GET INVITED MEETUPS ERROR', { error });
    return res.status(500).json({ message: 'Error al obtener las quedadas a las que te han invitado' });
  }
}

async function respondToMeetup(req, res) {
  try {
    const userId = req.user?.sub;
    const { meetupId } = req.params;
    const { response } = req.body;

    if (!['accepted', 'rejected'].includes(response)) {
      return res.status(400).json({ message: 'Respuesta inválida' });
    }

    const meetup = await Meetup.findById(meetupId);

    if (!meetup) {
      return res.status(404).json({ message: 'Quedada no encontrada' });
    }

    if (meetup.status === 'cancelled') {
      return res.status(400).json({ message: 'La quedada está cancelada' });
    }

    const participant = meetup.participants.find(
      p => p.user.toString() === userId.toString()
    );

    if (!participant) {
      return res.status(403).json({ message: 'No estás invitado a esta quedada' });
    }

    participant.response = response;
    participant.respondedAt = new Date();

    await meetup.save();

    const populatedMeetup = await Meetup.findById(meetup._id)
      .populate('organizer', 'name username email avatarUrl')
      .populate('event')
      .populate('participants.user', 'name username email avatarUrl');

    return res.status(200).json({
      message: response === 'accepted' ? 'Has aceptado la quedada' : 'Has rechazado la quedada',
      meetup: populatedMeetup
    });
  } catch (error) {
    logger.error('RESPOND TO MEETUP ERROR', { error });
    return res.status(500).json({ message: 'Error al responder a la quedada' });
  }
}

async function cancelMeetup(req, res) {
  try {
    const userId = req.user?.sub;
    const { meetupId } = req.params;

    const meetup = await Meetup.findById(meetupId);

    if (!meetup) {
      return res.status(404).json({ message: 'Quedada no encontrada' });
    }

    if (meetup.organizer.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Solo el organizador puede cancelar la quedada' });
    }

    if (meetup.status === 'cancelled') {
      return res.status(400).json({ message: 'La quedada ya estaba cancelada' });
    }

    meetup.status = 'cancelled';
    await meetup.save();

    return res.status(200).json({
      message: 'Quedada cancelada correctamente'
    });
  } catch (error) {
    logger.error('CANCEL MEETUP ERROR', { error });
    return res.status(500).json({ message: 'Error al cancelar la quedada' });
  }
}

async function getPendingMeetupInvitationsCount(req, res) {
  try {
    const userId = req.user?.sub;

    if (!userId) {
      return res.status(401).json({ message: 'No autenticado' });
    }

    const pendingInvitationsCount = await Meetup.countDocuments({
      status: 'active',
      participants: {
        $elemMatch: {
          user: userId,
          response: 'pending'
        }
      }
    });

    return res.status(200).json({
      pendingInvitationsCount,
      hasPendingMeetupInvitations: pendingInvitationsCount > 0
    });
  } catch (error) {
    logger.error('GET PENDING MEETUP INVITATIONS COUNT ERROR', { error });
    return res.status(500).json({ message: 'Error al obtener invitaciones pendientes de quedadas' });
  }
}

module.exports = {
  createMeetup,
  getOrganizedMeetups,
  getInvitedMeetups,
  respondToMeetup,
  cancelMeetup,
  getPendingMeetupInvitationsCount
};