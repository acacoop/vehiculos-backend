import { AppDataSource } from "../db";
import { AppError } from "../middleware/errorHandler";
import { Vehicle } from "../entities/Vehicle";
import { User } from "../entities/User";
import { MaintenanceCategory } from "../entities/MaintenanceCategory";
import { Maintenance } from "../entities/Maintenance";

/**
 * Validates that a vehicle exists in the database
 * @param vehicleId - The ID of the vehicle to validate
 * @throws AppError if the vehicle doesn't exist
 */
export const validateVehicleExists = async (
  vehicleId: string,
): Promise<void> => {
  const vehicleExists = await AppDataSource.getRepository(Vehicle).findOne({
    where: { id: vehicleId },
    select: ["id"],
  });

  if (!vehicleExists) {
    throw new AppError(
      `Vehicle with ID ${vehicleId} does not exist`,
      404,
      "https://example.com/problems/vehicle-not-found",
      "Vehicle Not Found",
    );
  }
};

/**
 * Validates that a user exists in the database
 * @param userId - The ID of the user to validate
 * @throws AppError if the user doesn't exist
 */
export const validateUserExists = async (userId: string): Promise<void> => {
  const userExists = await AppDataSource.getRepository(User).findOne({
    where: { id: userId },
    select: ["id"],
  });

  if (!userExists) {
    throw new AppError(
      `User with ID ${userId} does not exist`,
      404,
      "https://example.com/problems/user-not-found",
      "User Not Found",
    );
  }
};

/**
 * Validates that a maintenance category exists in the database
 * @param categoryId - The ID of the maintenance category to validate
 * @throws AppError if the maintenance category doesn't exist
 */
export const validateMaintenanceCategoryExists = async (
  categoryId: string,
): Promise<void> => {
  const categoryExists = await AppDataSource.getRepository(
    MaintenanceCategory,
  ).findOne({ where: { id: categoryId }, select: ["id"] });

  if (!categoryExists) {
    throw new AppError(
      `Maintenance category with ID ${categoryId} does not exist`,
      404,
      "https://example.com/problems/maintenance-category-not-found",
      "Maintenance Category Not Found",
    );
  }
};

/**
 * Validates that a maintenance exists in the database
 * @param maintenanceId - The ID of the maintenance to validate
 * @throws AppError if the maintenance doesn't exist
 */
export const validateMaintenanceExists = async (
  maintenanceId: string,
): Promise<void> => {
  const maintenanceExists = await AppDataSource.getRepository(
    Maintenance,
  ).findOne({ where: { id: maintenanceId }, select: ["id"] });

  if (!maintenanceExists) {
    throw new AppError(
      `Maintenance with ID ${maintenanceId} does not exist`,
      404,
      "https://example.com/problems/maintenance-not-found",
      "Maintenance Not Found",
    );
  }
};
