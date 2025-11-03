import type { Response as ExpressResponse } from "express";

/**
 * Sends an HTTP response with the given status, message, and data
 *
 * @param status The HTTP status code
 * @param message The message to include in the response
 * @param data The data to include in the response
 * @param res The Express response object
 * @returns The Express response object with the status, message, and data
 */
function httpResponse(status: number, message: string, data: any, res: ExpressResponse) {
  res.status(status).json({
    message,
    data,
  });
}

/**
 * Sends an HTTP 200 OK response with the given message and data
 *
 * @param message The message to include in the response
 * @param data The data to include in the response
 * @param res The Express response object
 * @returns The Express response object with the status, message, and data
 */
export function httpResponseOk(message: string, data: any, res: ExpressResponse) {
  httpResponse(200, message, data, res);
}

/**
 * Sends an HTTP 400 Bad Request response with the given message and data
 *
 * @param message The message to include in the response
 * @param data The data to include in the response
 * @param res The Express response object
 * @returns The Express response object with the status, message, and data
 */
export function httpResponseBadRequest(message: string, data: any, res: ExpressResponse) {
  httpResponse(400, message, data, res);
}

/**
 * Sends an HTTP 401 Unauthorized response with the given message and data
 *
 * @param message The message to include in the response
 * @param data The data to include in the response
 * @param res The Express response object
 * @returns The Express response object with the status, message, and data
 */
export function httpResponseUnauthorized(message: string, data: any, res: ExpressResponse) {
  httpResponse(401, message, data, res);
}

/**
 * Sends an HTTP 500 Internal Server Error response with the given message and data
 * 
 * @param message The message to include in the response
 * @param data The data to include in the response
 * @param res The Express response object
 * @returns The Express response object with the status, message, and data
 */
export function httpResponseInternalServerError(message: string, data: any, res: ExpressResponse) {
  httpResponse(500, message, data, res);
}