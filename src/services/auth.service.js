const bcrypt = require('bcrypt');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');

const register = async (fullName, email, password) => {
  const existingUser = await User.findOne({ email });
  if (existingUser) throw new Error('Email already in use');
  
  const hashPassword = await bcrypt.hash(password, 10);
  const newUser = await User.create({ fullName, email, hashPassword });
  const token = generateToken(newUser._id.toString(), newUser.role);
  
  const userResponse = {
    _id: newUser._id,
    fullName: newUser.fullName,
    email: newUser.email,
    phone: newUser.phone,
    role: newUser.role,
    createdAt: newUser.createdAt
  };
  return { user: userResponse, token };
};

const login = async (email, password) => {
  const user = await User.findOne({ email });
  if (!user) throw new Error('Invalid credentials');
  
  const isPasswordValid = await bcrypt.compare(password, user.hashPassword);
  if (!isPasswordValid) throw new Error('Invalid credentials');
  
  const token = generateToken(user._id.toString(), user.role);
  const userResponse = {
    _id: user._id,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    role: user.role,
    createdAt: user.createdAt
  };
  return { user: userResponse, token };
};

const getProfile = async (userId) => {
  const user = await User.findById(userId).select('-hashPassword');
  if (!user) throw new Error('User not found');
  return user;
};

const getAllUsers = async () => {
  const users = await User.find().select('-hashPassword');
  return users;
};

module.exports = { register, login, getProfile, getAllUsers };
