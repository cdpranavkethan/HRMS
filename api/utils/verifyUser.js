import jwt from 'jsonwebtoken';
import { errorHandler } from './error.js';

export const verifyToken = (req, res, next) => {
  const token = req.cookies.access_token;

  if (!token) return next(errorHandler(401, 'Unauthorized'));

  jwt.verify(token,"40f7f2e17c22c3bb645a7d969fc1f42ddaf5021c51b1bd0dde2a567f41035b82", (err, user) => {
    if (err) return next(errorHandler(403, 'Forbidden'));

    req.user = user;
    next();
  });
};
