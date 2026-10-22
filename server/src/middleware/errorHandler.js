export const errorHandler = (err, req, res, next) => {
  // Structured logging
  console.error(`[ERROR] ${req.method} ${req.url}:`, err);

  // Prisma unique constraint violation
  if (err.code === 'P2002') {
    const fields = err.meta?.target || 'field';
    return res.status(409).json({
      success: false,
      message: `A record with this ${Array.isArray(fields) ? fields.join(', ') : fields} already exists.`,
      code: 'DUPLICATE_ENTRY',
    });
  }

  // Prisma record not found
  if (err.code === 'P2025') {
    return res.status(404).json({
      success: false,
      message: 'The requested record does not exist or has been removed.',
      code: 'NOT_FOUND',
    });
  }

  // Prisma foreign key constraint failure
  if (err.code === 'P2003') {
    return res.status(400).json({
      success: false,
      message: 'Cannot perform operation because referenced parent record does not exist or is constrained.',
      code: 'FOREIGN_KEY_VIOLATION',
    });
  }

  // Default server error
  const statusCode = err.statusCode || 500;
  const message = err.isOperational ? err.message : (process.env.NODE_ENV === 'production' ? 'An unexpected internal error occurred.' : err.message);

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
};
