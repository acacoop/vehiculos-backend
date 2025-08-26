import { oneOrNone } from "../db";
import { AppError } from "../middleware/errorHandler";

/**
 * Validates that a vehicle exists in the database
 * @param vehicleId - The ID of the vehicle to validate
 * @throws AppError if the vehicle doesn't exist
 */
export const validateVehicleExists = async (
  vehicleId: string
): Promise<void> => {
  const vehicleExists = await oneOrNone<{ id: string }>(
    "SELECT id FROM vehicles WHERE id = $1",
    [vehicleId]
  );

  if (!vehicleExists) {
    throw new AppError(
      `Vehicle with ID ${vehicleId} does not exist`,
      404,
      "https://example.com/problems/vehicle-not-found",
      "Vehicle Not Found"
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
    "SELECT id FROM users WHERE id = $1",
    [userId]
  );

  if (!userExists) {
    throw new AppError(
      `User with ID ${userId} does not exist`,
      404,
      "https://example.com/problems/user-not-found",
      "User Not Found"
    );
  }
};

/**
 * Validates that a maintenance category exists in the database
 * @param categoryId - The ID of the maintenance category to validate
 * @throws AppError if the maintenance category doesn't exist
 */
export const validateMaintenanceCategoryExists = async (
  categoryId: string
): Promise<void> => {
  const categoryExists = await oneOrNone<{ id: string }>(
    "SELECT id FROM maintenance_categories WHERE id = $1",
    [categoryId]
  );

  if (!categoryExists) {
    throw new AppError(
      `Maintenance category with ID ${categoryId} does not exist`,
      404,
      "https://example.com/problems/maintenance-category-not-found",
      "Maintenance Category Not Found"
    );
  }
};

/**
 * Validates that a maintenance exists in the database
 * @param maintenanceId - The ID of the maintenance to validate
 * @throws AppError if the maintenance doesn't exist
 */
export const validateMaintenanceExists = async (
  maintenanceId: string
): Promise<void> => {
  const maintenanceExists = await oneOrNone<{ id: string }>(
    "SELECT id FROM maintenances WHERE id = $1",
    [maintenanceId]
  );

  if (!maintenanceExists) {
    throw new AppError(
      `Maintenance with ID ${maintenanceId} does not exist`,
      404,
      "https://example.com/problems/maintenance-not-found",
      "Maintenance Not Found"
    );
  }
};
