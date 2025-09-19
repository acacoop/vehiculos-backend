/*
  Script to load sample data using TypeORM entities instead of raw SQL.
  This ensures compatibility with entity validation and avoids conflicts with sync scripts.
  
  Usage: npm run sample-data
  Or: ts-node-dev --env-file=.env src/scripts/loadSampleData.ts
*/

import { AppDataSource } from "../db";
import { User } from "../entities/User";
import { Vehicle } from "../entities/Vehicle";
import { VehicleBrand } from "../entities/VehicleBrand";
import { VehicleModel } from "../entities/VehicleModel";
import { MaintenanceCategory } from "../entities/MaintenanceCategory";
import { Maintenance } from "../entities/Maintenance";
import { Assignment } from "../entities/Assignment";
import { AssignedMaintenance } from "../entities/AssignedMaintenance";
import { MaintenanceRecord } from "../entities/MaintenanceRecord";
import { Reservation } from "../entities/Reservation";
import { VehicleResponsible } from "../entities/VehicleResponsible";
import { VehicleKilometers } from "../entities/VehicleKilometers";

type SampleDataStats = {
  users: number;
  vehicles: number;
  maintenanceCategories: number;
  maintenances: number;
  assignments: number;
  assignedMaintenances: number;
  maintenanceRecords: number;
  reservations: number;
  vehicleResponsibles: number;
  vehicleKilometers: number;
};

async function clearSampleData(): Promise<void> {
  // Clear in reverse dependency order to avoid foreign key constraints
  // Use DELETE with 1=1 condition to delete all records but respect foreign keys
  await AppDataSource.query("DELETE FROM maintenance_records WHERE 1=1");
  await AppDataSource.query("DELETE FROM vehicle_kilometers WHERE 1=1");
  await AppDataSource.query("DELETE FROM reservations WHERE 1=1");
  await AppDataSource.query("DELETE FROM assignments WHERE 1=1");
  await AppDataSource.query("DELETE FROM vehicle_responsibles WHERE 1=1");
  await AppDataSource.query("DELETE FROM assigned_maintenances WHERE 1=1");
  await AppDataSource.query("DELETE FROM maintenances WHERE 1=1");
  await AppDataSource.query("DELETE FROM maintenance_categories WHERE 1=1");
  await AppDataSource.query("DELETE FROM vehicles WHERE 1=1");
  await AppDataSource.query("DELETE FROM vehicle_models WHERE 1=1");
  await AppDataSource.query("DELETE FROM vehicle_brands WHERE 1=1");

  // Only delete sample users (those with SAMPLE_ prefix in entraId or @sample.test domain)
  // This preserves all real users from Entra sync
  const userRepo = AppDataSource.getRepository(User);
  const result = await userRepo
    .createQueryBuilder()
    .delete()
    .where("entra_id LIKE 'SAMPLE_%' OR email LIKE '%@sample.test'")
    .execute();

  console.log(
    `✅ Sample data cleared (${result.affected || 0} sample users removed, real users preserved)`,
  );
}

async function createSampleUsers(): Promise<User[]> {
  const userRepo = AppDataSource.getRepository(User);

  const usersData = [
    // Management & Admin (all active)
    {
      firstName: "Carlos",
      lastName: "Rodríguez",
      cuit: 12345678901,
      email: "carlos.rodriguez@sample.test",
      active: true,
      entraId: "SAMPLE_USER_001",
    },
    {
      firstName: "María",
      lastName: "González",
      cuit: 23456789012,
      email: "maria.gonzalez@sample.test",
      active: true,
      entraId: "SAMPLE_USER_002",
    },
    {
      firstName: "Ana",
      lastName: "Martínez",
      cuit: 34567890123,
      email: "ana.martinez@sample.test",
      active: true,
      entraId: "SAMPLE_USER_003",
    },
    // Operations Team (mostly active, one inactive for testing)
    {
      firstName: "Juan",
      lastName: "Pérez",
      cuit: 45678901234,
      email: "juan.perez@sample.test",
      active: true,
      entraId: "SAMPLE_USER_004",
    },
    {
      firstName: "Luis",
      lastName: "López",
      cuit: 56789012345,
      email: "luis.lopez@sample.test",
      active: false,
      entraId: "SAMPLE_USER_005",
    },
    {
      firstName: "Sofia",
      lastName: "Hernández",
      cuit: 67890123456,
      email: "sofia.hernandez@sample.test",
      active: true,
      entraId: "SAMPLE_USER_006",
    },
    {
      firstName: "Diego",
      lastName: "García",
      cuit: 78901234567,
      email: "diego.garcia@sample.test",
      active: true,
      entraId: "SAMPLE_USER_007",
    },
    {
      firstName: "Valentina",
      lastName: "Silva",
      cuit: 89012345678,
      email: "valentina.silva@sample.test",
      active: true,
      entraId: "SAMPLE_USER_008",
    },
    // Field Staff (mix of active and inactive)
    {
      firstName: "Andrés",
      lastName: "Morales",
      cuit: 90123456789,
      email: "andres.morales@sample.test",
      active: true,
      entraId: "SAMPLE_USER_009",
    },
    {
      firstName: "Camila",
      lastName: "Torres",
      cuit: 12987654321,
      email: "camila.torres@sample.test",
      active: false,
      entraId: "SAMPLE_USER_010",
    },
    {
      firstName: "Miguel",
      lastName: "Vargas",
      cuit: 23876543210,
      email: "miguel.vargas@sample.test",
      active: true,
      entraId: "SAMPLE_USER_011",
    },
    {
      firstName: "Isabella",
      lastName: "Ruiz",
      cuit: 34765432109,
      email: "isabella.ruiz@sample.test",
      active: true,
      entraId: "SAMPLE_USER_012",
    },
    // Maintenance Team (all active)
    {
      firstName: "Roberto",
      lastName: "Jiménez",
      cuit: 45654321098,
      email: "roberto.jimenez@sample.test",
      active: true,
      entraId: "SAMPLE_USER_013",
    },
    {
      firstName: "Lucía",
      lastName: "Castro",
      cuit: 56543210987,
      email: "lucia.castro@sample.test",
      active: true,
      entraId: "SAMPLE_USER_014",
    },
    {
      firstName: "Fernando",
      lastName: "Romero",
      cuit: 67432109876,
      email: "fernando.romero@sample.test",
      active: true,
      entraId: "SAMPLE_USER_015",
    },
  ];

  const users = userRepo.create(usersData);
  const savedUsers = await userRepo.save(users);
  return savedUsers;
}

async function createBrandsAndModels(): Promise<{ brands: VehicleBrand[]; models: VehicleModel[] }> {
  const brandRepo = AppDataSource.getRepository(VehicleBrand);
  const modelRepo = AppDataSource.getRepository(VehicleModel);

  const brandNames = [
    "Toyota",
    "Honda",
    "Nissan",
    "Hyundai",
    "Mazda",
    "Subaru",
    "Ford",
    "Chevrolet",
    "Mercedes-Benz",
    "Tesla",
  ];
  const brands = await brandRepo.save(brandRepo.create(brandNames.map((name) => ({ name }))));

  const findBrand = (name: string) => brands.find((b) => b.name === name)!;

  const modelData = [
    { name: "Corolla", brand: findBrand("Toyota") },
    { name: "RAV4", brand: findBrand("Toyota") },
    { name: "Yaris", brand: findBrand("Toyota") },
    { name: "Civic", brand: findBrand("Honda") },
    { name: "CR-V", brand: findBrand("Honda") },
    { name: "Sentra", brand: findBrand("Nissan") },
    { name: "Versa", brand: findBrand("Nissan") },
    { name: "Leaf", brand: findBrand("Nissan") },
    { name: "Elantra", brand: findBrand("Hyundai") },
    { name: "CX-5", brand: findBrand("Mazda") },
    { name: "Outback", brand: findBrand("Subaru") },
    { name: "Ranger", brand: findBrand("Ford") },
    { name: "Transit", brand: findBrand("Ford") },
    { name: "Colorado", brand: findBrand("Chevrolet") },
    { name: "Sprinter", brand: findBrand("Mercedes-Benz") },
    { name: "Model 3", brand: findBrand("Tesla") },
  ];

  const models = await modelRepo.save(modelRepo.create(modelData));
  return { brands, models };
}

async function createSampleVehicles(models: VehicleModel[]): Promise<Vehicle[]> {
  const vehicleRepo = AppDataSource.getRepository(Vehicle);
  const findModel = (name: string) => models.find((m) => m.name === name)!;

  const vehiclesData = [
    { licensePlate: "ABC123", model: findModel("Corolla"), year: 2023 },
    { licensePlate: "DEF456", model: findModel("Civic"), year: 2022 },
    { licensePlate: "GHI789", model: findModel("Sentra"), year: 2023 },
    { licensePlate: "JKL012", model: findModel("Elantra"), year: 2022 },
    { licensePlate: "MNO345", model: findModel("RAV4"), year: 2023 },
    { licensePlate: "PQR678", model: findModel("CR-V"), year: 2022 },
    { licensePlate: "STU901", model: findModel("CX-5"), year: 2023 },
    { licensePlate: "VWX234", model: findModel("Outback"), year: 2022 },
    { licensePlate: "YZA567", model: findModel("Ranger"), year: 2023 },
    { licensePlate: "BCD890", model: findModel("Colorado"), year: 2022 },
    { licensePlate: "EFG123", model: findModel("Transit"), year: 2023 },
    { licensePlate: "HIJ456", model: findModel("Sprinter"), year: 2022 },
    { licensePlate: "KLM789", model: findModel("Yaris"), year: 2023 },
    { licensePlate: "NOP012", model: findModel("Versa"), year: 2022 },
    { licensePlate: "QRS345", model: findModel("Model 3"), year: 2023 },
    { licensePlate: "TUV678", model: findModel("Leaf"), year: 2022 },
  ];

  const vehicles = vehicleRepo.create(vehiclesData);
  return vehicleRepo.save(vehicles);
}

async function createMaintenanceData(): Promise<{
  categories: MaintenanceCategory[];
  maintenances: Maintenance[];
}> {
  const categoryRepo = AppDataSource.getRepository(MaintenanceCategory);
  const maintenanceRepo = AppDataSource.getRepository(Maintenance);

  // Create categories
  const categoriesData = [
    { name: "Preventive Maintenance" },
    { name: "Corrective Maintenance" },
    { name: "Emergency Repairs" },
    { name: "Scheduled Service" },
    { name: "Safety Inspections" },
    { name: "Performance Upgrades" },
    { name: "Cosmetic Repairs" },
  ];

  const categories = categoryRepo.create(categoriesData);
  const savedCategories = await categoryRepo.save(categories);

  // Helper function to find category by name
  const findCategory = (name: string) =>
    savedCategories.find((c) => c.name === name)!;

  // Create maintenance types
  const maintenancesData = [
    // Preventive Maintenance
    {
      category: findCategory("Preventive Maintenance"),
      name: "Oil Change",
      kilometersFrequency: 5000,
      daysFrequency: 90,
      observations: "Cambio de aceite estándar cada 5000 km o 3 meses",
      instructions: "Utilizar aceite sintético 5W-30",
    },
    {
      category: findCategory("Preventive Maintenance"),
      name: "Tire Rotation",
      kilometersFrequency: 10000,
      daysFrequency: 180,
      observations: "Rotar neumáticos para desgaste uniforme",
      instructions: "Rotar cruzando neumáticos delanteros y traseros",
    },
    {
      category: findCategory("Preventive Maintenance"),
      name: "Air Filter Replacement",
      kilometersFrequency: 15000,
      daysFrequency: 365,
      observations: "Reemplazo de filtro de aire cada 15,000 km o 1 año",
      instructions: "Utilizar filtro OEM recomendado",
    },
    {
      category: findCategory("Preventive Maintenance"),
      name: "Brake Inspection",
      kilometersFrequency: 10000,
      daysFrequency: 180,
      observations: "Revisar estado de pastillas y discos",
      instructions: "Medir espesor y verificar ruidos anormales",
    },
    {
      category: findCategory("Preventive Maintenance"),
      name: "Battery Check",
      kilometersFrequency: 20000,
      daysFrequency: 365,
      observations: "Chequeo de carga y estado de batería",
      instructions: "Medir voltaje y limpiar bornes",
    },

    // Scheduled Service
    {
      category: findCategory("Scheduled Service"),
      name: "5,000 KM Service",
      kilometersFrequency: 5000,
      daysFrequency: 180,
      observations: "Servicio general cada 5000 km",
      instructions: "Cambio de aceite y revisión básica",
    },
    {
      category: findCategory("Scheduled Service"),
      name: "10,000 KM Service",
      kilometersFrequency: 10000,
      daysFrequency: 365,
      observations: "Servicio general cada 10000 km",
      instructions: "Incluye inspección de frenos y filtros",
    },

    // Safety Inspections
    {
      category: findCategory("Safety Inspections"),
      name: "Annual Safety Inspection",
      kilometersFrequency: null,
      daysFrequency: 365,
      observations: "Inspección de seguridad anual obligatoria",
      instructions: "Revisar frenos, luces y sistemas de seguridad",
    },
    {
      category: findCategory("Safety Inspections"),
      name: "Emissions Test",
      kilometersFrequency: null,
      daysFrequency: 365,
      observations: "Prueba de emisiones contaminantes",
      instructions: "Verificar niveles de CO2 y gases permitidos",
    },

    // Emergency Repairs
    {
      category: findCategory("Emergency Repairs"),
      name: "Engine Repair",
      kilometersFrequency: null,
      daysFrequency: null,
      observations: "Reparación en caso de fallas graves",
      instructions: "Diagnóstico completo y reparación según daño",
    },
    {
      category: findCategory("Emergency Repairs"),
      name: "Accident Damage Repair",
      kilometersFrequency: null,
      daysFrequency: null,
      observations: "Reparación por daños de accidentes",
      instructions: "Inspección estructural y de seguridad",
    },
  ];

  const maintenances = maintenanceRepo.create(maintenancesData);
  const savedMaintenances = await maintenanceRepo.save(maintenances);

  console.log();
  return { categories: savedCategories, maintenances: savedMaintenances };
}

async function createAssignments(
  users: User[],
  vehicles: Vehicle[],
): Promise<Assignment[]> {
  const assignmentRepo = AppDataSource.getRepository(Assignment);

  // Helper functions to find entities
  const findUser = (email: string) => users.find((u) => u.email === email)!;
  const findVehicle = (licensePlate: string) =>
    vehicles.find((v) => v.licensePlate === licensePlate)!;

  const assignmentsData = [
    // Management gets newer vehicles (long-term assignments)
    {
      user: findUser("carlos.rodriguez@sample.test"),
      vehicle: findVehicle("ABC123"),
      startDate: "2024-01-01",
      endDate: null,
    },
    {
      user: findUser("maria.gonzalez@sample.test"),
      vehicle: findVehicle("MNO345"),
      startDate: "2024-02-01",
      endDate: null,
    },
    {
      user: findUser("ana.martinez@sample.test"),
      vehicle: findVehicle("QRS345"),
      startDate: "2024-01-15",
      endDate: null,
    },

    // Operations team gets versatile vehicles
    {
      user: findUser("juan.perez@sample.test"),
      vehicle: findVehicle("DEF456"),
      startDate: "2024-03-01",
      endDate: "2025-06-30",
    },
    {
      user: findUser("sofia.hernandez@sample.test"),
      vehicle: findVehicle("STU901"),
      startDate: "2024-04-01",
      endDate: "2025-08-31",
    },
    {
      user: findUser("diego.garcia@sample.test"),
      vehicle: findVehicle("VWX234"),
      startDate: "2024-05-01",
      endDate: "2025-05-31",
    },

    // Field staff gets pickup trucks and vans
    {
      user: findUser("andres.morales@sample.test"),
      vehicle: findVehicle("YZA567"),
      startDate: "2024-06-01",
      endDate: "2025-03-31",
    },
    {
      user: findUser("miguel.vargas@sample.test"),
      vehicle: findVehicle("EFG123"),
      startDate: "2024-07-01",
      endDate: null,
    },
    {
      user: findUser("isabella.ruiz@sample.test"),
      vehicle: findVehicle("HIJ456"),
      startDate: "2024-08-01",
      endDate: "2025-07-31",
    },

    // Maintenance team gets compact vehicles
    {
      user: findUser("roberto.jimenez@sample.test"),
      vehicle: findVehicle("KLM789"),
      startDate: "2024-09-01",
      endDate: "2025-02-28",
    },
    {
      user: findUser("lucia.castro@sample.test"),
      vehicle: findVehicle("NOP012"),
      startDate: "2024-10-01",
      endDate: "2025-04-30",
    },
    {
      user: findUser("fernando.romero@sample.test"),
      vehicle: findVehicle("TUV678"),
      startDate: "2024-11-01",
      endDate: null,
    },
  ];

  const assignments = assignmentRepo.create(assignmentsData);
  const savedAssignments = await assignmentRepo.save(assignments);

  return savedAssignments;
}

async function createAssignedMaintenances(
  vehicles: Vehicle[],
  maintenances: Maintenance[],
): Promise<AssignedMaintenance[]> {
  const assignedMaintenanceRepo =
    AppDataSource.getRepository(AssignedMaintenance);

  // Helper functions
  const findVehicle = (licensePlate: string) =>
    vehicles.find((v) => v.licensePlate === licensePlate)!;
  const findMaintenance = (name: string) =>
    maintenances.find((m) => m.name === name)!;

  const assignedMaintenancesData = [
    // Oil changes for key vehicles
    {
      vehicle: findVehicle("ABC123"),
      maintenance: findMaintenance("Oil Change"),
      kilometersFrequency: 5000,
      daysFrequency: 90,
      observations: "Regular oil change",
      instructions: "Replace oil filter and drain old oil",
    },
    {
      vehicle: findVehicle("DEF456"),
      maintenance: findMaintenance("Oil Change"),
      kilometersFrequency: 5000,
      daysFrequency: 90,
      observations: "Regular oil change",
      instructions: "Replace oil filter and drain old oil",
    },
    {
      vehicle: findVehicle("MNO345"),
      maintenance: findMaintenance("Oil Change"),
      kilometersFrequency: 5000,
      daysFrequency: 90,
      observations: "Regular oil change",
      instructions: "Replace oil filter and drain old oil",
    },

    // Tire rotations
    {
      vehicle: findVehicle("ABC123"),
      maintenance: findMaintenance("Tire Rotation"),
      kilometersFrequency: 10000,
      daysFrequency: 180,
      observations: "Rotate tires for even wear",
      instructions: "Cross-rotate front and rear tires",
    },
    {
      vehicle: findVehicle("DEF456"),
      maintenance: findMaintenance("Tire Rotation"),
      kilometersFrequency: 10000,
      daysFrequency: 180,
      observations: "Rotate tires for even wear",
      instructions: "Cross-rotate front and rear tires",
    },

    // Brake inspections
    {
      vehicle: findVehicle("ABC123"),
      maintenance: findMaintenance("Brake Inspection"),
      kilometersFrequency: 20000,
      daysFrequency: 365,
      observations: "Brake inspection",
      instructions: "Measure pad thickness and check for abnormal noises",
    },
    {
      vehicle: findVehicle("MNO345"),
      maintenance: findMaintenance("Brake Inspection"),
      kilometersFrequency: 20000,
      daysFrequency: 365,
      observations: "Brake inspection",
      instructions: "Measure pad thickness and check for abnormal noises",
    },

    // Annual safety inspections for all vehicles
    {
      vehicle: findVehicle("ABC123"),
      maintenance: findMaintenance("Annual Safety Inspection"),
      kilometersFrequency: null,
      daysFrequency: 365,
      observations: "Annual safety inspection",
      instructions: "Check brakes, lights and safety systems",
    },
    {
      vehicle: findVehicle("DEF456"),
      maintenance: findMaintenance("Annual Safety Inspection"),
      kilometersFrequency: null,
      daysFrequency: 365,
      observations: "Annual safety inspection",
      instructions: "Check brakes, lights and safety systems",
    },
    {
      vehicle: findVehicle("MNO345"),
      maintenance: findMaintenance("Annual Safety Inspection"),
      kilometersFrequency: null,
      daysFrequency: 365,
      observations: "Annual safety inspection",
      instructions: "Check brakes, lights and safety systems",
    },
    {
      vehicle: findVehicle("QRS345"),
      maintenance: findMaintenance("Annual Safety Inspection"),
      kilometersFrequency: null,
      daysFrequency: 365,
      observations: "Annual safety inspection",
      instructions: "Check brakes, lights and safety systems",
    },
  ];

  const assignedMaintenances = assignedMaintenanceRepo.create(
    assignedMaintenancesData,
  );
  const savedAssignedMaintenances =
    await assignedMaintenanceRepo.save(assignedMaintenances);

  console.log();
  return savedAssignedMaintenances;
}

async function createSampleReservations(
  users: User[],
  vehicles: Vehicle[],
): Promise<Reservation[]> {
  const reservationRepo = AppDataSource.getRepository(Reservation);

  // Helper functions
  const findUser = (email: string) => users.find((u) => u.email === email)!;
  const findVehicle = (licensePlate: string) =>
    vehicles.find((v) => v.licensePlate === licensePlate)!;

  const reservationsData = [
    {
      user: findUser("valentina.silva@sample.test"),
      vehicle: findVehicle("GHI789"),
      startDate: "2025-01-15",
      endDate: "2025-01-20",
    },
    {
      user: findUser("diego.garcia@sample.test"),
      vehicle: findVehicle("JKL012"),
      startDate: "2025-01-18",
      endDate: "2025-01-25",
    },
    {
      user: findUser("sofia.hernandez@sample.test"),
      vehicle: findVehicle("KLM789"),
      startDate: "2025-01-22",
      endDate: "2025-01-24",
    },
  ];

  const reservations = reservationRepo.create(reservationsData);
  const savedReservations = await reservationRepo.save(reservations);

  return savedReservations;
}

async function createVehicleResponsibles(
  users: User[],
  vehicles: Vehicle[],
): Promise<VehicleResponsible[]> {
  const responsibleRepo = AppDataSource.getRepository(VehicleResponsible);

  // Helper functions
  const findUser = (email: string) => users.find((u) => u.email === email)!;
  const findVehicle = (licensePlate: string) =>
    vehicles.find((v) => v.licensePlate === licensePlate)!;

  const responsiblesData = [
    // Current responsibles
    {
      vehicle: findVehicle("ABC123"),
      user: findUser("carlos.rodriguez@sample.test"),
      startDate: "2024-01-01",
      endDate: null,
    },
    {
      vehicle: findVehicle("MNO345"),
      user: findUser("maria.gonzalez@sample.test"),
      startDate: "2024-02-01",
      endDate: null,
    },
    {
      vehicle: findVehicle("DEF456"),
      user: findUser("juan.perez@sample.test"),
      startDate: "2024-03-01",
      endDate: null,
    },
    {
      vehicle: findVehicle("YZA567"),
      user: findUser("andres.morales@sample.test"),
      startDate: "2024-06-01",
      endDate: null,
    },
    {
      vehicle: findVehicle("EFG123"),
      user: findUser("miguel.vargas@sample.test"),
      startDate: "2024-07-01",
      endDate: null,
    },
  ];

  const responsibles = responsibleRepo.create(responsiblesData);
  const savedResponsibles = await responsibleRepo.save(responsibles);

  return savedResponsibles;
}

async function createVehicleKilometers(
  users: User[],
  vehicles: Vehicle[],
): Promise<VehicleKilometers[]> {
  const kilometerRepo = AppDataSource.getRepository(VehicleKilometers);

  // Helper functions
  const findUser = (email: string) => users.find((u) => u.email === email)!;
  const findVehicle = (licensePlate: string) =>
    vehicles.find((v) => v.licensePlate === licensePlate)!;

  const kilometersData = [
    // Vehicle ABC123 progressive km
    {
      vehicle: findVehicle("ABC123"),
      user: findUser("carlos.rodriguez@sample.test"),
      date: new Date("2025-01-01T09:00:00Z"),
      kilometers: 45500,
    },
    {
      vehicle: findVehicle("ABC123"),
      user: findUser("carlos.rodriguez@sample.test"),
      date: new Date("2025-01-10T09:00:00Z"),
      kilometers: 46200,
    },
    {
      vehicle: findVehicle("ABC123"),
      user: findUser("carlos.rodriguez@sample.test"),
      date: new Date("2025-02-01T09:00:00Z"),
      kilometers: 48050,
    },

    // Vehicle DEF456
    {
      vehicle: findVehicle("DEF456"),
      user: findUser("juan.perez@sample.test"),
      date: new Date("2025-01-03T12:00:00Z"),
      kilometers: 38600,
    },
    {
      vehicle: findVehicle("DEF456"),
      user: findUser("juan.perez@sample.test"),
      date: new Date("2025-02-03T12:00:00Z"),
      kilometers: 40010,
    },

    // Vehicle MNO345
    {
      vehicle: findVehicle("MNO345"),
      user: findUser("maria.gonzalez@sample.test"),
      date: new Date("2025-01-02T08:30:00Z"),
      kilometers: 35200,
    },
  ];

  const kilometers = kilometerRepo.create(kilometersData);
  const savedKilometers = await kilometerRepo.save(kilometers);

  return savedKilometers;
}

async function createMaintenanceRecords(
  users: User[],
  assignedMaintenances: AssignedMaintenance[],
): Promise<MaintenanceRecord[]> {
  const recordRepo = AppDataSource.getRepository(MaintenanceRecord);

  // Helper function
  const findUser = (email: string) => users.find((u) => u.email === email)!;

  // Find some assigned maintenances to create records for
  const oilChangeABC = assignedMaintenances.find(
    (am) =>
      am.vehicle.licensePlate === "ABC123" &&
      am.maintenance.name === "Oil Change",
  );
  const oilChangeDEF = assignedMaintenances.find(
    (am) =>
      am.vehicle.licensePlate === "DEF456" &&
      am.maintenance.name === "Oil Change",
  );
  const tireRotationABC = assignedMaintenances.find(
    (am) =>
      am.vehicle.licensePlate === "ABC123" &&
      am.maintenance.name === "Tire Rotation",
  );

  const recordsData = [];

  if (oilChangeABC) {
    recordsData.push({
      assignedMaintenance: oilChangeABC,
      user: findUser("roberto.jimenez@sample.test"),
      date: "2024-12-15", // Use date string format for date type
      kilometers: 45000,
      notes: "Regular oil change. Used synthetic 5W-30. All levels checked.",
    });
  }

  if (oilChangeDEF) {
    recordsData.push({
      assignedMaintenance: oilChangeDEF,
      user: findUser("lucia.castro@sample.test"),
      date: "2024-12-10", // Use date string format for date type
      kilometers: 38000,
      notes: "Oil change completed. Minor leak detected and repaired.",
    });
  }

  if (tireRotationABC) {
    recordsData.push({
      assignedMaintenance: tireRotationABC,
      user: findUser("fernando.romero@sample.test"),
      date: "2024-11-20", // Use date string format for date type
      kilometers: 42000,
      notes: "Tire rotation completed. Front tires showing slight wear.",
    });
  }

  if (recordsData.length === 0) {
    return [];
  }

  const records = recordRepo.create(recordsData);
  const savedRecords = await recordRepo.save(records);

  return savedRecords;
}

export async function loadSampleData(): Promise<SampleDataStats> {
  console.log("🚀 Starting sample data loading...");

  // Ensure data source is initialized
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }

  // Clear existing data
  await clearSampleData();

  // Create sample data in order
  const users = await createSampleUsers();
  const { brands, models } = await createBrandsAndModels();
  const vehicles = await createSampleVehicles(models);
  const { categories, maintenances } = await createMaintenanceData();
  const assignments = await createAssignments(users, vehicles);
  const assignedMaintenances = await createAssignedMaintenances(
    vehicles,
    maintenances,
  );
  const reservations = await createSampleReservations(users, vehicles);
  const vehicleResponsibles = await createVehicleResponsibles(users, vehicles);
  const vehicleKilometers = await createVehicleKilometers(users, vehicles);
  const maintenanceRecords = await createMaintenanceRecords(
    users,
    assignedMaintenances,
  );

  const stats: SampleDataStats = {
    users: users.length,
    vehicles: vehicles.length,
    maintenanceCategories: categories.length,
    maintenances: maintenances.length,
    assignments: assignments.length,
    assignedMaintenances: assignedMaintenances.length,
    maintenanceRecords: maintenanceRecords.length,
    reservations: reservations.length,
    vehicleResponsibles: vehicleResponsibles.length,
    vehicleKilometers: vehicleKilometers.length,
  };

  console.log(`   Brands: ${brands.length}`);
  console.log(`   Models: ${models.length}`);

  console.log("\n✅ Sample data loading completed!");
  console.log(`   Users: ${stats.users}`);
  console.log(`   Vehicles: ${stats.vehicles}`);
  console.log(`   Maintenance Categories: ${stats.maintenanceCategories}`);
  console.log(`   Maintenance Types: ${stats.maintenances}`);
  console.log(`   Assignments: ${stats.assignments}`);
  console.log(`   Assigned Maintenances: ${stats.assignedMaintenances}`);
  console.log(`   Maintenance Records: ${stats.maintenanceRecords}`);
  console.log(`   Reservations: ${stats.reservations}`);
  console.log(`   Vehicle Responsibles: ${stats.vehicleResponsibles}`);
  console.log(`   Vehicle Kilometers: ${stats.vehicleKilometers}`);

  return stats;
}

// If this script is run directly (not imported)
if (require.main === module) {
  loadSampleData()
    .then(() => {
      console.log("\n🎉 Sample data script completed successfully!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Sample data script failed:", error);
      process.exit(1);
    });
}
