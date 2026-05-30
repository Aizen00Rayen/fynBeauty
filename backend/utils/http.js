// Lightweight HTTP error with a status code, mirroring FastAPI's HTTPException.
class HttpError extends Error {
  constructor(status, detail) {
    super(typeof detail === "string" ? detail : "Erreur");
    this.status = status;
    this.detail = detail;
  }
}

// Wraps an async route handler so thrown errors reach the central error handler.
function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

module.exports = { HttpError, asyncHandler };
