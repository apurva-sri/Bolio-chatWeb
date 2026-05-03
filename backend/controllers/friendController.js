const FriendRequest = require('../models/FriendRequest');
const User = require('../models/User');
const logger = require('../config/logger');

/**
 * @desc  Send a friend request to another user
 * @route POST /api/friends/send-request
 * @access Private
 * body: { receiverId }
 */
const sendFriendRequest = async (req, res) => {
  try {
    const senderId = req.user._id;
    const { receiverId } = req.body;

    logger.info(`[Send Request API] ${req.user.username} → sending request to userId: ${receiverId}`);

    if (senderId.toString() === receiverId) {
      return res.status(400).json({ success: false, message: 'You cannot send a friend request to yourself' });
    }

    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (req.user.friends.includes(receiverId)) {
      return res.status(400).json({ success: false, message: 'You are already friends with this user' });
    }
    const existingRequest = await FriendRequest.findOne({
      $or: [
        { sender: senderId, receiver: receiverId },
        { sender: receiverId, receiver: senderId },
      ],
    });

    if (existingRequest) {
      return res.status(400).json({ success: false, message: 'A friend request already exists between you two' });
    }

    // Create the friend request document in MongoDB
    const request = await FriendRequest.create({ sender: senderId, receiver: receiverId });

    logger.success(`[Send Request API] Request sent from ${req.user.username} to ${receiver.username}`);

    res.status(201).json({
      success: true,
      message: `Friend request sent to ${receiver.username}`,
      request,
    });

  } catch (error) {
    logger.error(`[Send Request API] Error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Server error while sending friend request' });
  }
};

/**
 * @desc  Accept an incoming friend request
 * @route POST /api/friends/accept-request
 * @access Private
 * body: { requestId }
 */
const acceptFriendRequest = async (req, res) => {
  try {
    const { requestId } = req.body;
    const currentUserId = req.user._id;

    logger.info(`[Accept Request API] User ${req.user.username} accepting requestId: ${requestId}`);

    const request = await FriendRequest.findById(requestId);

    if (!request) {
      return res.status(404).json({ success: false, message: 'Friend request not found' });
    }

    // Only the RECEIVER can accept the request
    if (request.receiver.toString() !== currentUserId.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to accept this request' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Request is no longer pending' });
    }

    // Update request status to accepted
    request.status = 'accepted';
    await request.save();

    // Add each user to the other's friends array (both directions)
    await User.findByIdAndUpdate(request.sender,   { $addToSet: { friends: request.receiver } });
    await User.findByIdAndUpdate(request.receiver, { $addToSet: { friends: request.sender } });

    logger.success(`[Accept Request API] ${req.user.username} accepted request from userId: ${request.sender}`);

    res.status(200).json({
      success: true,
      message: 'Friend request accepted! You are now friends.',
    });

  } catch (error) {
    logger.error(`[Accept Request API] Error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Server error while accepting request' });
  }
};

/**
 * @desc  Reject an incoming friend request
 * @route POST /api/friends/reject-request
 * @access Private
 * body: { requestId }
 */
const rejectFriendRequest = async (req, res) => {
  try {
    const { requestId } = req.body;
    const currentUserId = req.user._id;

    logger.info(`[Reject Request API] User ${req.user.username} rejecting requestId: ${requestId}`);

    const request = await FriendRequest.findById(requestId);

    if (!request) {
      return res.status(404).json({ success: false, message: 'Friend request not found' });
    }

    // Only the RECEIVER can reject
    if (request.receiver.toString() !== currentUserId.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to reject this request' });
    }

    // Delete the request document from DB
    await FriendRequest.findByIdAndDelete(requestId);

    logger.info(`[Reject Request API] Request rejected and deleted`);

    res.status(200).json({ success: true, message: 'Friend request rejected' });

  } catch (error) {
    logger.error(`[Reject Request API] Error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Server error while rejecting request' });
  }
};

/**
 * @desc  Get all INCOMING pending friend requests for the logged-in user
 * @route GET /api/friends/requests
 * @access Private
 */
const getIncomingRequests = async (req, res) => {
  try {
    logger.info(`[Get Requests API] Fetching incoming requests for ${req.user.username}`);

    // Find all pending requests where current user is the RECEIVER
    const requests = await FriendRequest.find({
      receiver: req.user._id,
      status: 'pending',
    }).populate('sender', 'name lastName username avatar isOnline'); // populate sender's details

    res.status(200).json({ success: true, requests });

  } catch (error) {
    logger.error(`[Get Requests API] Error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Server error while fetching requests' });
  }
};

/**
 * @desc  Get the full friends list of the logged-in user
 * @route GET /api/friends/list
 * @access Private
 */
const getFriendsList = async (req, res) => {
  try {
    logger.info(`[Friends List API] Fetching friends list for ${req.user.username}`);

    // Populate the friends array in User with actual user data
    const user = await User.findById(req.user._id)
      .select('friends')
      .populate('friends', 'name lastName username avatar isOnline lastSeen');

    res.status(200).json({ success: true, friends: user.friends });

  } catch (error) {
    logger.error(`[Friends List API] Error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Server error while fetching friends list' });
  }
};

module.exports = {
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  getIncomingRequests,
  getFriendsList,
};
