import { oneOrNone } from "../db";
import { AppError } from "../middleware/errorHandler";

/**
 * Validates that a vehicle exists in the database
 * @param vehicleId - The ID of the vehicle to validate
 * @throws AppError if the vehicle doesn't exist
 */
export const validateVehicleExists = async (vehicleId: string): Promise<void> => {
  const vehicleExists = await oneOrNone<{ id: string }>(
    'SELECT id FROM vehicles WHERE id = $1', 
    [vehicleId]
  );
  
  if (!vehicleExists) {
    throw new AppError(
      `Vehicle with ID ${vehicleId} does not exist`,
      404,
      'https://example.com/problems/vehicle-not-found',
      'Vehicle Not Found'
    );
  }
};

/**
 * Validates that a user exists in the database
 * @param userId - The ID of the user to validate
 * @throws AppError if the user doesn't exist
 */
export const validateUserExists = async (userId: string): Promise<void> => {
  const userExists = await oneOrNone<{ id: string }>(
    'SELECT id FROM users WHERE id = $1', 
    [userId]
  );
  
  if (!userExists) {
    throw new AppError(
      `User with ID ${userId} does not exist`,
      404,
      'https://example.com/problems/user-not-found',
      'User Not Found'
    );
  }
};
