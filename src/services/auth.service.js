const bcrypt = require('bcrypt');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');

const register = async (name, email, password, phone) => {
  const existingUser = await User.findOne({ email });
  if (existingUser) throw new Error('Email already in use');
  
  const hashedPassword = await bcrypt.hash(password, 10);
  const role = email === process.env.ADMIN_EMAIL ? 'admin' : 'customer';
  const newUser = await User.create({ name, email, password: hashedPassword, phone, role });
  const token = generateToken(newUser._id.toString(), newUser.role);
  
  const userResponse = {
    _id: newUser._id,
    name: newUser.name,
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
  
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) throw new Error('Invalid credentials');
  
  const token = generateToken(user._id.toString(), user.role);
  const userResponse = {
    _id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    createdAt: user.createdAt
  };
  return { user: userResponse, token };
};

const getProfile = async (userId) => {
  const user = await User.findById(userId).select('-password');
  if (!user) throw new Error('User not found');
  return user;
};

const getAllUsers = async () => {
  const users = await User.find().select('-hashPassword');
  return users;
};

module.exports = { register, login, getProfile, getAllUsers };
