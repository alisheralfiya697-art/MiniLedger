/**
 * @file routes/authRoutes.ts
 * @description Authentication routing endpoints for OTP requests and verification.
 */

import { Router } from 'express';
import { AuthController } from '../controllers/authController.js';
import { validateBody } from '../middleware/errorHandler.js';
import { requestOtpSchema, verifyOtpSchema } from '../validators/index.js';
import { authenticateUser } from '../middleware/auth.js';

const router = Router();

// Public: Request 6-digit mock OTP
router.post('/request-otp', validateBody(requestOtpSchema), AuthController.requestOtp);

// Public: Verify 6-digit OTP and receive JWT
router.post('/verify-otp', validateBody(verifyOtpSchema), AuthController.verifyOtp);

// Protected: Get current authenticated user details
router.get('/me', authenticateUser, AuthController.getCurrentUser);

export default router;
