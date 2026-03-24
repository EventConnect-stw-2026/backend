const express = require('express');
const router = express.Router();
const requireAuth = require('../middlewares/auth.middleware');
const cookieParser = require('cookie-parser');

const {
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  getPendingRequests,
  getFriends,
  removeFriend,
  getSuggestedFriends,
  getSearchableUsers,
  getUsersBySearch,
  getSentRequests
} = require('../controllers/friends.controller');

router.use(cookieParser());

router.use(requireAuth);

router.post('/request', sendFriendRequest);
router.post('/accept', acceptFriendRequest);
router.post('/reject', rejectFriendRequest);
router.get('/pending', getPendingRequests);
router.get('/list', getFriends);
router.get('/suggested', getSuggestedFriends);
router.post('/remove', removeFriend);
router.get('/searchable', getSearchableUsers);
router.get('/search', getUsersBySearch);
router.get('/sent', getSentRequests);

module.exports = router;
