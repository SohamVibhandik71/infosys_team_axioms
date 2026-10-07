import { registerSchema, loginSchema } from '../validators/authValidator.js';
import { registerUser, loginUser, getUserById } from '../services/authService.js';
import { sendSuccess } from '../utils/response.js';

export const register = async (req, res, next) => {
  try {
    const validatedData = registerSchema.parse(req.body);
    const result = await registerUser(validatedData);
    return sendSuccess(res, result, 'User registered successfully', 201);
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const validatedData = loginSchema.parse(req.body);
    const result = await loginUser(validatedData);
    return sendSuccess(res, result, 'Login successful', 200);
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req, res, next) => {
  try {
    const user = await getUserById(req.user.id);
    return sendSuccess(res, { user }, 'User profile retrieved', 200);
  } catch (error) {
    next(error);
  }
};

export default {
  register,
  login,
  getMe
};
