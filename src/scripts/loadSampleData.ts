/*
  Script to load sample data using TypeORM entities instead of raw SQL.
  This ensures compatibility with entity validation and avoids conflicts with sync scripts.

  Usage: npm run sample-data
  Or: ts-node-dev --env-file=.env src/scripts/loadSampleData.ts
*/

import { fileURLToPath } from "node:url";
import { AppDataSource } from "@/db";
import { User } from "@/entities/User";
import { Vehicle } from "@/entities/Vehicle";
import { VehicleBrand } from "@/entities/VehicleBrand";
import { VehicleModel } from "@/entities/VehicleModel";
import { MaintenanceCategory } from "@/entities/MaintenanceCategory";
import { Maintenance } from "@/entities/Maintenance";
import { Assignment } from "@/entities/Assignment";
import { MaintenanceRequirement } from "@/entities/MaintenanceRequirement";
import { QuarterlyControl } from "@/entities/QuarterlyControl";
import { QuarterlyControlItem } from "@/entities/QuarterlyControlItem";
import { Reservation } from "@/entities/Reservation";
import { VehicleResponsible } from "@/entities/VehicleResponsible";
import { VehicleACL } from "@/entities/VehicleACL";
import { UserRole } from "@/entities/UserRole";
import { VehicleKilometers } from "@/entities/VehicleKilometers";
import { MaintenanceRecord } from "@/entities/MaintenanceRecord";
import { UserRoleEnum } from "@/enums/UserRoleEnum";
import { PermissionType } from "@/enums/PermissionType";
import { QuarterlyControlItemStatus } from "@/enums/QuarterlyControlItemStatusEnum";

type SampleDataStats = {
  users: number;
  vehicles: number;
  maintenanceCategories: number;
  maintenances: number;
  assignments: number;
  maintenanceRequirements: number;
  maintenanceRecords: number;
  reservations: number;
  vehicleResponsibles: number;
  vehicleKilometers: number;
  vehicleACLs: number;
  userRoles: number;
  quarterlyControls: number;
  quarterlyControlItems: number;
};

async function clearSampleData(): Promise<void> {
  // Use DELETE with 1=1 condition to delete all records but respect foreign keys
  // Order matters! Delete child records before parents

  // 1. Delete records that depend on vehicles, maintenances, and users
  await AppDataSource.query("DELETE FROM quarterly_control_items WHERE 1=1");
  await AppDataSource.query("DELETE FROM quarterly_controls WHERE 1=1");
  await AppDataSource.query("DELETE FROM maintenance_records WHERE 1=1");
  await AppDataSource.query("DELETE FROM vehicle_kilometers WHERE 1=1");
  await AppDataSource.query("DELETE FROM reservations WHERE 1=1");
  await AppDataSource.query("DELETE FROM vehicle_responsibles WHERE 1=1");
  await AppDataSource.query("DELETE FROM vehicle_acl WHERE 1=1");

  // 2. Delete assignments only for sample users or sample vehicles
  await AppDataSource.query(`
    DELETE FROM assignments 
    WHERE user_id IN (
      SELECT id FROM users 
      WHERE entra_id LIKE 'SAMPLE_%' OR email LIKE '%@sample.test'
    )
    OR vehicle_id IN (
      SELECT id FROM vehicles WHERE 1=1
    )
  `);

  // 3. Delete maintenance requirements (depends on vehicles and maintenances)
  await AppDataSource.query("DELETE FROM maintenances_requirements WHERE 1=1");

  // 4. Delete maintenances and categories
  await AppDataSource.query("DELETE FROM maintenances WHERE 1=1");
  await AppDataSource.query("DELETE FROM maintenance_categories WHERE 1=1");

  // 5. Delete vehicles and their related data
  await AppDataSource.query("DELETE FROM vehicles WHERE 1=1");
  await AppDataSource.query("DELETE FROM vehicle_models WHERE 1=1");
  await AppDataSource.query("DELETE FROM vehicle_brands WHERE 1=1");

  // 6. Delete user roles only for sample users (those with SAMPLE_ prefix or @sample.test domain)
  await AppDataSource.query(`
    DELETE FROM user_roles 
    WHERE user_id IN (
      SELECT id FROM users 
      WHERE entra_id LIKE 'SAMPLE_%' OR email LIKE '%@sample.test'
    )
  `);

  // 7. Only delete sample users (those with SAMPLE_ prefix in entraId or @sample.test domain)
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
      cuit: "12345678901",
      email: "carlos.rodriguez@sample.test",
      active: true,
      entraId: "SAMPLE_USER_001",
    },
    {
      firstName: "María",
      lastName: "González",
      cuit: "23456789012",
      email: "maria.gonzalez@sample.test",
      active: true,
      entraId: "SAMPLE_USER_002",
    },
    {
      firstName: "Ana",
      lastName: "Martínez",
      cuit: "34567890123",
      email: "ana.martinez@sample.test",
      active: true,
      entraId: "SAMPLE_USER_003",
    },
    // Operations Team (mostly active, one inactive for testing)
    {
      firstName: "Juan",
      lastName: "Pérez",
      cuit: "45678901234",
      email: "juan.perez@sample.test",
      active: true,
      entraId: "SAMPLE_USER_004",
    },
    {
      firstName: "Luis",
      lastName: "López",
      cuit: "56789012345",
      email: "luis.lopez@sample.test",
      active: false,
      entraId: "SAMPLE_USER_005",
    },
    {
      firstName: "Sofia",
      lastName: "Hernández",
      cuit: "67890123456",
      email: "sofia.hernandez@sample.test",
      active: true,
      entraId: "SAMPLE_USER_006",
    },
    {
      firstName: "Diego",
      lastName: "García",
      cuit: "78901234567",
      email: "diego.garcia@sample.test",
      active: true,
      entraId: "SAMPLE_USER_007",
    },
    {
      firstName: "Valentina",
      lastName: "Silva",
      cuit: "89012345678",
      email: "valentina.silva@sample.test",
      active: true,
      entraId: "SAMPLE_USER_008",
    },
    // Field Staff (mix of active and inactive)
    {
      firstName: "Andrés",
      lastName: "Morales",
      cuit: "90123456789",
      email: "andres.morales@sample.test",
      active: true,
      entraId: "SAMPLE_USER_009",
    },
    {
      firstName: "Camila",
      lastName: "Torres",
      cuit: "12987654321",
      email: "camila.torres@sample.test",
      active: false,
      entraId: "SAMPLE_USER_010",
    },
    {
      firstName: "Miguel",
      lastName: "Vargas",
      cuit: "23876543210",
      email: "miguel.vargas@sample.test",
      active: true,
      entraId: "SAMPLE_USER_011",
    },
    {
      firstName: "Isabella",
      lastName: "Ruiz",
      cuit: "34765432109",
      email: "isabella.ruiz@sample.test",
      active: true,
      entraId: "SAMPLE_USER_012",
    },
    // Maintenance Team (all active)
    {
      firstName: "Roberto",
      lastName: "Jiménez",
      cuit: "45654321098",
      email: "roberto.jimenez@sample.test",
      active: true,
      entraId: "SAMPLE_USER_013",
    },
    {
      firstName: "Lucía",
      lastName: "Castro",
      cuit: "56543210987",
      email: "lucia.castro@sample.test",
      active: true,
      entraId: "SAMPLE_USER_014",
    },
    {
      firstName: "Fernando",
      lastName: "Romero",
      cuit: "67432109876",
      email: "fernando.romero@sample.test",
      active: true,
      entraId: "SAMPLE_USER_015",
    },
  ];

  const users = userRepo.create(usersData);
  const savedUsers = await userRepo.save(users);
  return savedUsers;
}

async function createBrandsAndModels(): Promise<{
  brands: VehicleBrand[];
  models: VehicleModel[];
}> {
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
    "Volkswagen",
    "Peugeot",
    "Renault",
    "Fiat",
    "Kia",
    "Jeep",
    "BMW",
    "Audi",
    "Citroën",
  ];
  const brands = await brandRepo.save(
    brandRepo.create(brandNames.map((name) => ({ name }))),
  );

  const findBrand = (name: string) => brands.find((b) => b.name === name)!;

  const modelData = [
    { name: "Corolla", brand: findBrand("Toyota"), vehicleType: "Sedan" },
    { name: "RAV4", brand: findBrand("Toyota"), vehicleType: "SUV" },
    { name: "Yaris", brand: findBrand("Toyota"), vehicleType: "Hatchback" },
    { name: "Civic", brand: findBrand("Honda"), vehicleType: "Sedan" },
    { name: "CR-V", brand: findBrand("Honda"), vehicleType: "SUV" },
    { name: "Sentra", brand: findBrand("Nissan"), vehicleType: "Sedan" },
    { name: "Versa", brand: findBrand("Nissan"), vehicleType: "Sedan" },
    {
      name: "Leaf",
      brand: findBrand("Nissan"),
      vehicleType: "Hatchback eléctrico",
    },
    { name: "Elantra", brand: findBrand("Hyundai"), vehicleType: "Sedan" },
    { name: "CX-5", brand: findBrand("Mazda"), vehicleType: "SUV" },
    { name: "Outback", brand: findBrand("Subaru"), vehicleType: "Crossover" },
    { name: "Ranger", brand: findBrand("Ford"), vehicleType: "Pickup" },
    { name: "Transit", brand: findBrand("Ford"), vehicleType: "Van" },
    { name: "Colorado", brand: findBrand("Chevrolet"), vehicleType: "Pickup" },
    { name: "Sprinter", brand: findBrand("Mercedes-Benz"), vehicleType: "Van" },
    {
      name: "Model 3",
      brand: findBrand("Tesla"),
      vehicleType: "Sedan eléctrico",
    },
    { name: "Golf", brand: findBrand("Volkswagen"), vehicleType: "Hatchback" },
    { name: "Amarok", brand: findBrand("Volkswagen"), vehicleType: "Pickup" },
    { name: "208", brand: findBrand("Peugeot"), vehicleType: "Hatchback" },
    { name: "2008", brand: findBrand("Peugeot"), vehicleType: "SUV" },
    { name: "Clio", brand: findBrand("Renault"), vehicleType: "Hatchback" },
    { name: "Kwid", brand: findBrand("Renault"), vehicleType: "Hatchback" },
    { name: "Cronos", brand: findBrand("Fiat"), vehicleType: "Sedan" },
    { name: "Argo", brand: findBrand("Fiat"), vehicleType: "Hatchback" },
    { name: "Sportage", brand: findBrand("Kia"), vehicleType: "SUV" },
    { name: "Seltos", brand: findBrand("Kia"), vehicleType: "SUV" },
    { name: "Renegade", brand: findBrand("Jeep"), vehicleType: "SUV" },
    { name: "Compass", brand: findBrand("Jeep"), vehicleType: "SUV" },
    { name: "X1", brand: findBrand("BMW"), vehicleType: "SUV" },
    { name: "320i", brand: findBrand("BMW"), vehicleType: "Sedan" },
    { name: "A3", brand: findBrand("Audi"), vehicleType: "Hatchback" },
    { name: "Q5", brand: findBrand("Audi"), vehicleType: "SUV" },
    { name: "C3", brand: findBrand("Citroën"), vehicleType: "Hatchback" },
    {
      name: "C4 Cactus",
      brand: findBrand("Citroën"),
      vehicleType: "Crossover",
    },
  ];

  const models = await modelRepo.save(modelRepo.create(modelData));
  return { brands, models };
}

async function createSampleVehicles(
  models: VehicleModel[],
): Promise<Vehicle[]> {
  const vehicleRepo = AppDataSource.getRepository(Vehicle);
  const findModel = (name: string) => models.find((m) => m.name === name)!;

  const vehiclesData = [
    {
      licensePlate: "ABC123",
      model: findModel("Corolla"),
      year: 2023,
      vehicleType: findModel("Corolla").vehicleType,
      chassisNumber: "8ADZY23T0PM012345",
      engineNumber: "2ZR-FE-230001",
      transmission: "CVT",
      fuelType: "Nafta",
    },
    {
      licensePlate: "DEF456",
      model: findModel("Civic"),
      year: 2022,
      vehicleType: findModel("Civic").vehicleType,
      chassisNumber: "19XFC2F59NE012456",
      engineNumber: "L15B7-220002",
      transmission: "CVT",
      fuelType: "Nafta",
    },
    {
      licensePlate: "GHI789",
      model: findModel("Sentra"),
      year: 2023,
      vehicleType: findModel("Sentra").vehicleType,
      chassisNumber: "3N1AB8CV8PY012789",
      engineNumber: "HR16DE-230003",
      transmission: "CVT",
      fuelType: "Nafta",
    },
    {
      licensePlate: "JKL012",
      model: findModel("Elantra"),
      year: 2022,
      vehicleType: findModel("Elantra").vehicleType,
      chassisNumber: "KMHL14JA7NA012012",
      engineNumber: "G4FJ-220004",
      transmission: "Manual",
      fuelType: "Nafta",
    },
    {
      licensePlate: "MNO345",
      model: findModel("RAV4"),
      year: 2023,
      vehicleType: findModel("RAV4").vehicleType,
      chassisNumber: "JTMW1RFV6PD012345",
      engineNumber: "2AR-FE-230005",
      transmission: "Automática",
      fuelType: "Nafta",
    },
    {
      licensePlate: "PQR678",
      model: findModel("CR-V"),
      year: 2022,
      vehicleType: findModel("CR-V").vehicleType,
      chassisNumber: "7FARW2H82NE012678",
      engineNumber: "L15B7-220006",
      transmission: "CVT",
      fuelType: "Nafta",
    },
    {
      licensePlate: "STU901",
      model: findModel("CX-5"),
      year: 2023,
      vehicleType: findModel("CX-5").vehicleType,
      chassisNumber: "JM3KFBCM1P0012901",
      engineNumber: "PY-VPS-230007",
      transmission: "Automática",
      fuelType: "Nafta",
    },
    {
      licensePlate: "VWX234",
      model: findModel("Outback"),
      year: 2022,
      vehicleType: findModel("Outback").vehicleType,
      chassisNumber: "4S4BTANC6N3012234",
      engineNumber: "FB25-220008",
      transmission: "CVT",
      fuelType: "Nafta",
    },
    {
      licensePlate: "YZA567",
      model: findModel("Ranger"),
      year: 2023,
      vehicleType: findModel("Ranger").vehicleType,
      chassisNumber: "1FTER4FH9PLA12567",
      engineNumber: "PUMA-230009",
      transmission: "Manual",
      fuelType: "Diésel",
    },
    {
      licensePlate: "BCD890",
      model: findModel("Colorado"),
      year: 2022,
      vehicleType: findModel("Colorado").vehicleType,
      chassisNumber: "1GCGTCE39N1012890",
      engineNumber: "LWN-220010",
      transmission: "Automática",
      fuelType: "Diésel",
    },
    {
      licensePlate: "EFG123",
      model: findModel("Transit"),
      year: 2023,
      vehicleType: findModel("Transit").vehicleType,
      chassisNumber: "1FTBW3XMXPKA13123",
      engineNumber: "PUMA-230011",
      transmission: "Manual",
      fuelType: "Diésel",
    },
    {
      licensePlate: "HIJ456",
      model: findModel("Sprinter"),
      year: 2022,
      vehicleType: findModel("Sprinter").vehicleType,
      chassisNumber: "WDYPF4CC3N1013456",
      engineNumber: "OM651-220012",
      transmission: "Automática",
      fuelType: "Diésel",
    },
    {
      licensePlate: "KLM789",
      model: findModel("Yaris"),
      year: 2023,
      vehicleType: findModel("Yaris").vehicleType,
      chassisNumber: "VNKKJ3BX1PA013789",
      engineNumber: "1NZ-FE-230013",
      transmission: "Manual",
      fuelType: "Nafta",
    },
    {
      licensePlate: "NOP012",
      model: findModel("Versa"),
      year: 2022,
      vehicleType: findModel("Versa").vehicleType,
      chassisNumber: "3N1CN8EV1NL014012",
      engineNumber: "HR12DE-220014",
      transmission: "CVT",
      fuelType: "Nafta",
    },
    {
      licensePlate: "QRS345",
      model: findModel("Model 3"),
      year: 2023,
      vehicleType: findModel("Model 3").vehicleType,
      chassisNumber: "5YJ3E1EA1PF014345",
      engineNumber: "7G-230015",
      transmission: "Automática",
      fuelType: "Eléctrico",
    },
    {
      licensePlate: "TUV678",
      model: findModel("Leaf"),
      year: 2022,
      vehicleType: findModel("Leaf").vehicleType,
      chassisNumber: "1N4AZ1CPXNC014678",
      engineNumber: "EM57-220016",
      transmission: "Automática",
      fuelType: "Eléctrico",
    },
    {
      licensePlate: "AAA111",
      model: findModel("Golf"),
      year: 2023,
      vehicleType: findModel("Golf").vehicleType,
      chassisNumber: "WVWZZZ1KZPW015111",
      engineNumber: "EA211-230017",
      transmission: "Manual",
      fuelType: "Nafta",
    },
    {
      licensePlate: "BBB222",
      model: findModel("Amarok"),
      year: 2024,
      vehicleType: findModel("Amarok").vehicleType,
      chassisNumber: "WVW2ZZZSRPR015222",
      engineNumber: "EA288-240018",
      transmission: "Automática",
      fuelType: "Diésel",
    },
    {
      licensePlate: "CCC333",
      model: findModel("208"),
      year: 2023,
      vehicleType: findModel("208").vehicleType,
      chassisNumber: "VF3C9HXK8PS015333",
      engineNumber: "EB2DT-230019",
      transmission: "Manual",
      fuelType: "Nafta",
    },
    {
      licensePlate: "DDD444",
      model: findModel("2008"),
      year: 2024,
      vehicleType: findModel("2008").vehicleType,
      chassisNumber: "VF3C9BHXKPS015444",
      engineNumber: "EB2DT-240020",
      transmission: "Automática",
      fuelType: "Nafta",
    },
    {
      licensePlate: "EEE555",
      model: findModel("Clio"),
      year: 2022,
      vehicleType: findModel("Clio").vehicleType,
      chassisNumber: "VF1BRA00264015555",
      engineNumber: "SCe70-220021",
      transmission: "Manual",
      fuelType: "Nafta",
    },
    {
      licensePlate: "FFF666",
      model: findModel("Kwid"),
      year: 2023,
      vehicleType: findModel("Kwid").vehicleType,
      chassisNumber: "93YBRA0FH4J015666",
      engineNumber: "SCe70-230022",
      transmission: "Manual",
      fuelType: "Nafta",
    },
    {
      licensePlate: "GGG777",
      model: findModel("Cronos"),
      year: 2024,
      vehicleType: findModel("Cronos").vehicleType,
      chassisNumber: "9BD178000P0015777",
      engineNumber: "FIRE-240023",
      transmission: "Manual",
      fuelType: "Nafta",
    },
    {
      licensePlate: "HHH888",
      model: findModel("Argo"),
      year: 2023,
      vehicleType: findModel("Argo").vehicleType,
      chassisNumber: "9BD35800XP0015888",
      engineNumber: "FIRE-230024",
      transmission: "CVT",
      fuelType: "Nafta",
    },
    {
      licensePlate: "III999",
      model: findModel("Sportage"),
      year: 2023,
      vehicleType: findModel("Sportage").vehicleType,
      chassisNumber: "KNDJ23AU1P7015999",
      engineNumber: "G4NA-230025",
      transmission: "Automática",
      fuelType: "Nafta",
    },
    {
      licensePlate: "JJJ000",
      model: findModel("Seltos"),
      year: 2024,
      vehicleType: findModel("Seltos").vehicleType,
      chassisNumber: "KNDJP3A53P7016000",
      engineNumber: "G4FJ-240026",
      transmission: "CVT",
      fuelType: "Nafta",
    },
    {
      licensePlate: "KKK111",
      model: findModel("Renegade"),
      year: 2023,
      vehicleType: findModel("Renegade").vehicleType,
      chassisNumber: "ZACCPBBT0PPZ16111",
      engineNumber: "T270-230027",
      transmission: "Automática",
      fuelType: "Nafta",
    },
    {
      licensePlate: "LLL222",
      model: findModel("Compass"),
      year: 2024,
      vehicleType: findModel("Compass").vehicleType,
      chassisNumber: "1C4NJDEB8QD016222",
      engineNumber: "T270-240028",
      transmission: "Automática",
      fuelType: "Nafta",
    },
    {
      licensePlate: "MMM333",
      model: findModel("X1"),
      year: 2023,
      vehicleType: findModel("X1").vehicleType,
      chassisNumber: "WBXHT9C06P5B16333",
      engineNumber: "B48A20A-230029",
      transmission: "Automática",
      fuelType: "Nafta",
    },
    {
      licensePlate: "NNN444",
      model: findModel("320i"),
      year: 2024,
      vehicleType: findModel("320i").vehicleType,
      chassisNumber: "WBA8E1G06QNB16444",
      engineNumber: "B48A20A-240030",
      transmission: "Automática",
      fuelType: "Nafta",
    },
    {
      licensePlate: "OOO555",
      model: findModel("A3"),
      year: 2023,
      vehicleType: findModel("A3").vehicleType,
      chassisNumber: "WAUZ8Z4F9P1016555",
      engineNumber: "TFSI-230031",
      transmission: "Automática",
      fuelType: "Nafta",
    },
    {
      licensePlate: "PPP666",
      model: findModel("Q5"),
      year: 2024,
      vehicleType: findModel("Q5").vehicleType,
      chassisNumber: "WA1ENAFY8Q2016666",
      engineNumber: "TFSI-240032",
      transmission: "Automática",
      fuelType: "Nafta",
    },
    {
      licensePlate: "QQQ777",
      model: findModel("C3"),
      year: 2023,
      vehicleType: findModel("C3").vehicleType,
      chassisNumber: "VF7A1BHX1PS016777",
      engineNumber: "EB2DT-230033",
      transmission: "Manual",
      fuelType: "Nafta",
    },
    {
      licensePlate: "RRR888",
      model: findModel("C4 Cactus"),
      year: 2024,
      vehicleType: findModel("C4 Cactus").vehicleType,
      chassisNumber: "VF7EHW0H8QS016888",
      engineNumber: "EB2DT-240034",
      transmission: "Automática",
      fuelType: "Nafta",
    },
  ];

  // Add registrationDate based on vehicle year
  const vehiclesWithRegistration = vehiclesData.map((v) => ({
    ...v,
    registrationDate: `${v.year}-01-15`,
  }));

  const vehicles = vehicleRepo.create(vehiclesWithRegistration);
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
    // Current assignments (drivers)
    {
      user: findUser("ana.martinez@sample.test"),
      vehicle: findVehicle("ABC123"),
      startDate: "2024-01-01",
      endDate: null,
    },
    {
      user: findUser("diego.garcia@sample.test"),
      vehicle: findVehicle("DEF456"),
      startDate: "2024-03-01",
      endDate: null,
    },
    {
      user: findUser("valentina.silva@sample.test"),
      vehicle: findVehicle("MNO345"),
      startDate: "2024-02-01",
      endDate: null,
    },

    // Old assignments (should not grant permission now)
    {
      user: findUser("juan.perez@sample.test"),
      vehicle: findVehicle("ABC123"),
      startDate: "2023-01-01",
      endDate: "2023-12-31", // ended
    },
    {
      user: findUser("sofia.hernandez@sample.test"),
      vehicle: findVehicle("MNO345"),
      startDate: "2023-06-01",
      endDate: "2024-05-31", // ended
    },

    // Other assignments
    {
      user: findUser("carlos.rodriguez@sample.test"),
      vehicle: findVehicle("QRS345"),
      startDate: "2024-01-01",
      endDate: null,
    },
    {
      user: findUser("maria.gonzalez@sample.test"),
      vehicle: findVehicle("STU901"),
      startDate: "2024-02-01",
      endDate: null,
    },
    {
      user: findUser("andres.morales@sample.test"),
      vehicle: findVehicle("YZA567"),
      startDate: "2024-06-01",
      endDate: null,
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
      endDate: null,
    },
    {
      user: findUser("roberto.jimenez@sample.test"),
      vehicle: findVehicle("KLM789"),
      startDate: "2024-09-01",
      endDate: null,
    },
    {
      user: findUser("lucia.castro@sample.test"),
      vehicle: findVehicle("NOP012"),
      startDate: "2024-10-01",
      endDate: null,
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

async function createMaintenanceRequirements(
  models: VehicleModel[],
  maintenances: Maintenance[],
): Promise<MaintenanceRequirement[]> {
  const requirementRepo = AppDataSource.getRepository(MaintenanceRequirement);

  // Helper functions
  const findModel = (name: string) => models.find((m) => m.name === name)!;
  const findMaintenance = (name: string) =>
    maintenances.find((m) => m.name === name)!;

  const requirementsData = [
    // Oil changes for sedan models (Civic, Corolla, Sentra)
    {
      model: findModel("Civic"),
      maintenance: findMaintenance("Oil Change"),
      startDate: "2024-01-01",
      endDate: null,
      kilometersFrequency: 5000,
      daysFrequency: 90,
    },
    {
      model: findModel("Corolla"),
      maintenance: findMaintenance("Oil Change"),
      startDate: "2024-01-01",
      endDate: null,
      kilometersFrequency: 5000,
      daysFrequency: 90,
    },
    {
      model: findModel("Sentra"),
      maintenance: findMaintenance("Oil Change"),
      startDate: "2024-01-01",
      endDate: null,
      kilometersFrequency: 5000,
      daysFrequency: 90,
    },

    // Tire rotations for SUV models
    {
      model: findModel("CR-V"),
      maintenance: findMaintenance("Tire Rotation"),
      startDate: "2024-01-01",
      endDate: null,
      kilometersFrequency: 10000,
      daysFrequency: 180,
    },
    {
      model: findModel("RAV4"),
      maintenance: findMaintenance("Tire Rotation"),
      startDate: "2024-01-01",
      endDate: null,
      kilometersFrequency: 10000,
      daysFrequency: 180,
    },

    // Brake inspections for compact models
    {
      model: findModel("Civic"),
      maintenance: findMaintenance("Brake Inspection"),
      startDate: "2024-01-01",
      endDate: null,
      kilometersFrequency: 20000,
      daysFrequency: 365,
    },
    {
      model: findModel("Golf"),
      maintenance: findMaintenance("Brake Inspection"),
      startDate: "2024-01-01",
      endDate: null,
      kilometersFrequency: 20000,
      daysFrequency: 365,
    },

    // Annual safety inspections for various models
    {
      model: findModel("Civic"),
      maintenance: findMaintenance("Annual Safety Inspection"),
      startDate: "2024-01-01",
      endDate: null,
      kilometersFrequency: null,
      daysFrequency: 365,
    },
    {
      model: findModel("Corolla"),
      maintenance: findMaintenance("Annual Safety Inspection"),
      startDate: "2024-01-01",
      endDate: null,
      kilometersFrequency: null,
      daysFrequency: 365,
    },
    {
      model: findModel("CR-V"),
      maintenance: findMaintenance("Annual Safety Inspection"),
      startDate: "2024-01-01",
      endDate: null,
      kilometersFrequency: null,
      daysFrequency: 365,
    },
    {
      model: findModel("Model 3"),
      maintenance: findMaintenance("Annual Safety Inspection"),
      startDate: "2024-01-01",
      endDate: null,
      kilometersFrequency: null,
      daysFrequency: 365,
    },
  ];

  const requirements = requirementRepo.create(requirementsData);
  const savedRequirements = await requirementRepo.save(requirements);

  return savedRequirements;
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
    // Current responsibles (positive cases)
    {
      vehicle: findVehicle("DEF456"), // V2
      user: findUser("maria.gonzalez@sample.test"),
      ceco: "23000000", // in range 23000000-23999999
      startDate: "2024-01-01",
      endDate: null,
    },
    {
      vehicle: findVehicle("MNO345"), // V3
      user: findUser("valentina.silva@sample.test"),
      ceco: "17001234", // in range 17000000-17999999
      startDate: "2024-02-01",
      endDate: null,
    },

    // Old responsibles (should not grant permission now)
    {
      vehicle: findVehicle("ABC123"), // V1
      user: findUser("juan.perez@sample.test"),
      ceco: "12003456", // in range 12000000-12999999
      startDate: "2023-01-01",
      endDate: "2023-12-31", // ended
    },
    {
      vehicle: findVehicle("DEF456"), // V2
      user: findUser("diego.garcia@sample.test"),
      ceco: "23000000",
      startDate: "2023-06-01",
      endDate: "2024-05-31", // ended
    },

    // Other responsibles
    {
      vehicle: findVehicle("YZA567"),
      user: findUser("andres.morales@sample.test"),
      ceco: "18000123",
      startDate: "2024-06-01",
      endDate: null,
    },
    {
      vehicle: findVehicle("EFG123"),
      user: findUser("miguel.vargas@sample.test"),
      ceco: "15000000",
      startDate: "2024-07-01",
      endDate: null,
    },
    {
      vehicle: findVehicle("HIJ456"),
      user: findUser("isabella.ruiz@sample.test"),
      ceco: "30000000", // outside ranges
      startDate: "2024-08-01",
      endDate: null,
    },
  ];

  const responsibles = responsibleRepo.create(responsiblesData);
  const savedResponsibles = await responsibleRepo.save(responsibles);

  return savedResponsibles;
}

// --- Authorization sample data (simplified) ---
async function createAuthorizationData(users: User[], vehicles: Vehicle[]) {
  const vehicleACLRepo = AppDataSource.getRepository(VehicleACL);
  const userRoleRepo = AppDataSource.getRepository(UserRole);

  // Helper finders
  const findUser = (email: string) => users.find((u) => u.email === email)!;
  const findVehicle = (lp: string) =>
    vehicles.find((v) => v.licensePlate === lp)!;

  // User roles (Carlos admin, others user)
  const savedRoles = await userRoleRepo.save(
    userRoleRepo.create([
      {
        user: findUser("carlos.rodriguez@sample.test"),
        role: UserRoleEnum.ADMIN,
        startTime: new Date("2024-01-01T00:00:00Z"),
        endTime: undefined, // indefinite
      },
      {
        user: findUser("ana.martinez@sample.test"),
        role: UserRoleEnum.USER,
        startTime: new Date("2024-01-01T00:00:00Z"),
      },
    ]),
  );

  // Simple Vehicle ACLs - direct user-vehicle-permission-period mappings
  const savedACLs = await vehicleACLRepo.save(
    vehicleACLRepo.create([
      // Miguel has DRIVER permission on ABC123 and DEF456
      {
        user: findUser("miguel.vargas@sample.test"),
        vehicle: findVehicle("ABC123"),
        permission: PermissionType.DRIVER,
        startTime: new Date("2024-01-01T00:00:00Z"),
        endTime: null,
      },
      {
        user: findUser("miguel.vargas@sample.test"),
        vehicle: findVehicle("DEF456"),
        permission: PermissionType.DRIVER,
        startTime: new Date("2024-01-01T00:00:00Z"),
        endTime: null,
      },
      // Juan (old driver) has READ permission on ABC123 via ACL
      {
        user: findUser("juan.perez@sample.test"),
        vehicle: findVehicle("ABC123"),
        permission: PermissionType.READ,
        startTime: new Date("2024-01-01T00:00:00Z"),
        endTime: null,
      },
      // Lucia has MAINTAINER permission on GHI789
      {
        user: findUser("lucia.castro@sample.test"),
        vehicle: findVehicle("GHI789"),
        permission: PermissionType.MAINTAINER,
        startTime: new Date("2024-01-01T00:00:00Z"),
        endTime: null,
      },
      // Roberto has FULL permission on STU901
      {
        user: findUser("roberto.jimenez@sample.test"),
        vehicle: findVehicle("STU901"),
        permission: PermissionType.FULL,
        startTime: new Date("2024-01-01T00:00:00Z"),
        endTime: null,
      },
      // Expired ACL example: Sofia had DRIVER permission on MNO345 but it expired
      {
        user: findUser("sofia.hernandez@sample.test"),
        vehicle: findVehicle("MNO345"),
        permission: PermissionType.DRIVER,
        startTime: new Date("2023-06-01T00:00:00Z"),
        endTime: new Date("2024-05-31T23:59:59Z"), // expired
      },
    ]),
  );

  return {
    vehicleACLs: savedACLs.length,
    userRoles: savedRoles.length,
  };
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
  vehicles: Vehicle[],
  maintenances: Maintenance[],
): Promise<MaintenanceRecord[]> {
  const recordRepo = AppDataSource.getRepository(MaintenanceRecord);
  const kmLogRepo = AppDataSource.getRepository(VehicleKilometers);

  // Helper functions
  const findUser = (email: string) => users.find((u) => u.email === email)!;
  const findVehicle = (licensePlate: string) =>
    vehicles.find((v) => v.licensePlate === licensePlate)!;
  const findMaintenance = (name: string) =>
    maintenances.find((m) => m.name === name)!;

  const recordsData = [
    {
      maintenance: findMaintenance("Oil Change"),
      vehicle: findVehicle("ABC123"),
      user: findUser("roberto.jimenez@sample.test"),
      date: "2024-12-15",
      kilometers: 45000,
      notes: "Regular oil change. Used synthetic 5W-30. All levels checked.",
    },
    {
      maintenance: findMaintenance("Oil Change"),
      vehicle: findVehicle("DEF456"),
      user: findUser("lucia.castro@sample.test"),
      date: "2024-12-10",
      kilometers: 38000,
      notes: "Oil change completed. Minor leak detected and repaired.",
    },
    {
      maintenance: findMaintenance("Tire Rotation"),
      vehicle: findVehicle("ABC123"),
      user: findUser("fernando.romero@sample.test"),
      date: "2024-11-20",
      kilometers: 42000,
      notes: "Tire rotation completed. Front tires showing slight wear.",
    },
  ];

  // Create kilometer logs first, then link to maintenance records
  const savedRecords: MaintenanceRecord[] = [];
  for (const data of recordsData) {
    // Create the kilometer log
    const kmLog = kmLogRepo.create({
      vehicle: data.vehicle,
      user: data.user,
      date: new Date(data.date),
      kilometers: data.kilometers,
    });
    const savedKmLog = await kmLogRepo.save(kmLog);

    // Create the maintenance record with the km log reference
    const record = recordRepo.create({
      maintenance: data.maintenance,
      vehicle: data.vehicle,
      user: data.user,
      date: data.date,
      kilometersLog: savedKmLog,
      notes: data.notes,
    });
    const savedRecord = await recordRepo.save(record);
    savedRecords.push(savedRecord);
  }

  return savedRecords;
}

async function createSampleQuarterlyControls(
  users: User[],
  vehicles: Vehicle[],
): Promise<QuarterlyControl[]> {
  const controlRepo = AppDataSource.getRepository(QuarterlyControl);

  // Helper functions
  const findUser = (email: string) => users.find((u) => u.email === email)!;
  const findVehicle = (licensePlate: string) =>
    vehicles.find((v) => v.licensePlate === licensePlate)!;

  const controlsData = [
    // Control for Q4 2024 - ABC123 (Toyota Corolla)
    {
      vehicle: findVehicle("ABC123"),
      year: 2024,
      quarter: 4,
      intendedDeliveryDate: "2025-01-15",
      filledBy: findUser("roberto.jimenez@sample.test"),
      filledAt: "2024-12-20",
    },
    // Control for Q1 2025 - DEF456 (Honda Civic)
    {
      vehicle: findVehicle("DEF456"),
      year: 2025,
      quarter: 1,
      intendedDeliveryDate: "2025-02-10",
      filledBy: null,
      filledAt: null,
    },
    // Control for Q4 2024 - MNO345 (Toyota RAV4)
    {
      vehicle: findVehicle("MNO345"),
      year: 2024,
      quarter: 4,
      intendedDeliveryDate: "2025-01-20",
      filledBy: findUser("lucia.castro@sample.test"),
      filledAt: "2024-12-18",
    },
    // Control for Q1 2025 - GHI789 (Nissan Sentra) - pending
    {
      vehicle: findVehicle("GHI789"),
      year: 2025,
      quarter: 1,
      intendedDeliveryDate: "2025-02-15",
      filledBy: null,
      filledAt: null,
    },
    // Control for Q4 2024 - STU901 (Mazda CX-5)
    {
      vehicle: findVehicle("STU901"),
      year: 2024,
      quarter: 4,
      intendedDeliveryDate: "2025-01-25",
      filledBy: findUser("fernando.romero@sample.test"),
      filledAt: "2024-12-22",
    },
  ];

  const controls = controlRepo.create(controlsData);
  const savedControls = await controlRepo.save(controls);

  return savedControls;
}

async function createSampleQuarterlyControlItems(
  controls: QuarterlyControl[],
): Promise<QuarterlyControlItem[]> {
  const itemRepo = AppDataSource.getRepository(QuarterlyControlItem);

  // Helper function to find control by vehicle license plate and quarter
  const findControl = (licensePlate: string, year: number, quarter: number) =>
    controls.find(
      (c) =>
        c.vehicle.licensePlate === licensePlate &&
        c.year === year &&
        c.quarter === quarter,
    )!;

  const itemsData = [
    // Items for ABC123 Q4 2024
    {
      quarterlyControl: findControl("ABC123", 2024, 4),
      category: "Mecánico",
      title: "Revisar niveles de fluidos",
      status: QuarterlyControlItemStatus.APROBADO,
      observations:
        "Todos los niveles correctos. Aceite, refrigerante y frenos OK.",
    },
    {
      quarterlyControl: findControl("ABC123", 2024, 4),
      category: "Mecánico",
      title: "Verificar estado de neumáticos",
      status: QuarterlyControlItemStatus.APROBADO,
      observations: "Presión correcta. Profundidad de dibujo adecuada.",
    },
    {
      quarterlyControl: findControl("ABC123", 2024, 4),
      category: "Eléctrico",
      title: "Comprobar sistema de luces",
      status: QuarterlyControlItemStatus.APROBADO,
      observations: "Todas las luces funcionando correctamente.",
    },
    {
      quarterlyControl: findControl("ABC123", 2024, 4),
      category: "Seguridad",
      title: "Inspeccionar frenos",
      status: QuarterlyControlItemStatus.PENDIENTE,
      observations:
        "Se detectó ruido leve en freno delantero derecho. Requiere atención.",
    },

    // Items for DEF456 Q1 2025 (pending control)
    {
      quarterlyControl: findControl("DEF456", 2025, 1),
      category: "Mecánico",
      title: "Revisar niveles de fluidos",
      status: QuarterlyControlItemStatus.PENDIENTE,
      observations: "",
    },
    {
      quarterlyControl: findControl("DEF456", 2025, 1),
      category: "Mecánico",
      title: "Verificar estado de neumáticos",
      status: QuarterlyControlItemStatus.PENDIENTE,
      observations: "",
    },
    {
      quarterlyControl: findControl("DEF456", 2025, 1),
      category: "Eléctrico",
      title: "Comprobar sistema de luces",
      status: QuarterlyControlItemStatus.PENDIENTE,
      observations: "",
    },

    // Items for MNO345 Q4 2024
    {
      quarterlyControl: findControl("MNO345", 2024, 4),
      category: "Mecánico",
      title: "Revisar niveles de fluidos",
      status: QuarterlyControlItemStatus.APROBADO,
      observations: "Niveles correctos. Se agregó refrigerante menor.",
    },
    {
      quarterlyControl: findControl("MNO345", 2024, 4),
      category: "Mecánico",
      title: "Verificar estado de neumáticos",
      status: QuarterlyControlItemStatus.RECHAZADO,
      observations:
        "Neumático trasero izquierdo con presión baja. Inflado y marcado para reemplazo.",
    },
    {
      quarterlyControl: findControl("MNO345", 2024, 4),
      category: "Seguridad",
      title: "Inspeccionar frenos",
      status: QuarterlyControlItemStatus.APROBADO,
      observations: "Pastillas en buen estado. Discos sin desgaste excesivo.",
    },

    // Items for GHI789 Q1 2025 (pending)
    {
      quarterlyControl: findControl("GHI789", 2025, 1),
      category: "Mecánico",
      title: "Revisar niveles de fluidos",
      status: QuarterlyControlItemStatus.PENDIENTE,
      observations: "",
    },
    {
      quarterlyControl: findControl("GHI789", 2025, 1),
      category: "Eléctrico",
      title: "Comprobar batería",
      status: QuarterlyControlItemStatus.PENDIENTE,
      observations: "",
    },

    // Items for STU901 Q4 2024
    {
      quarterlyControl: findControl("STU901", 2024, 4),
      category: "Mecánico",
      title: "Revisar niveles de fluidos",
      status: QuarterlyControlItemStatus.APROBADO,
      observations: "Todo en orden. Vehículo en excelente estado.",
    },
    {
      quarterlyControl: findControl("STU901", 2024, 4),
      category: "Mecánico",
      title: "Verificar estado de neumáticos",
      status: QuarterlyControlItemStatus.APROBADO,
      observations: "Neumáticos nuevos recientemente instalados.",
    },
    {
      quarterlyControl: findControl("STU901", 2024, 4),
      category: "Eléctrico",
      title: "Comprobar sistema de luces",
      status: QuarterlyControlItemStatus.APROBADO,
      observations: "Sistema completo funcionando.",
    },
    {
      quarterlyControl: findControl("STU901", 2024, 4),
      category: "Seguridad",
      title: "Inspeccionar frenos",
      status: QuarterlyControlItemStatus.APROBADO,
      observations: "Sistema de frenos en perfectas condiciones.",
    },
    {
      quarterlyControl: findControl("STU901", 2024, 4),
      category: "Carrocería",
      title: "Verificar estado general",
      status: QuarterlyControlItemStatus.APROBADO,
      observations: "Sin daños visibles. Pintura en buen estado.",
    },
  ];

  const items = itemRepo.create(itemsData);
  const savedItems = await itemRepo.save(items);

  return savedItems;
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
  const maintenanceRequirements = await createMaintenanceRequirements(
    models,
    maintenances,
  );
  const reservations = await createSampleReservations(users, vehicles);
  const vehicleResponsibles = await createVehicleResponsibles(users, vehicles);
  const vehicleKilometers = await createVehicleKilometers(users, vehicles);
  const authStats = await createAuthorizationData(users, vehicles);
  const maintenanceRecords = await createMaintenanceRecords(
    users,
    vehicles,
    maintenances,
  );
  const quarterlyControls = await createSampleQuarterlyControls(
    users,
    vehicles,
  );
  const quarterlyControlItems =
    await createSampleQuarterlyControlItems(quarterlyControls);

  const stats: SampleDataStats = {
    users: users.length,
    vehicles: vehicles.length,
    maintenanceCategories: categories.length,
    maintenances: maintenances.length,
    assignments: assignments.length,
    maintenanceRequirements: maintenanceRequirements.length,
    maintenanceRecords: maintenanceRecords.length,
    reservations: reservations.length,
    vehicleResponsibles: vehicleResponsibles.length,
    vehicleKilometers: vehicleKilometers.length,
    vehicleACLs: authStats.vehicleACLs,
    userRoles: authStats.userRoles,
    quarterlyControls: quarterlyControls.length,
    quarterlyControlItems: quarterlyControlItems.length,
  };

  console.log(`   Brands: ${brands.length}`);
  console.log(`   Models: ${models.length}`);

  console.log("\n✅ Sample data loading completed!");
  console.log(`   Users: ${stats.users}`);
  console.log(`   Vehicles: ${stats.vehicles}`);
  console.log(`   Maintenance Categories: ${stats.maintenanceCategories}`);
  console.log(`   Maintenance Types: ${stats.maintenances}`);
  console.log(`   Assignments: ${stats.assignments}`);
  console.log(`   Maintenance Requirements: ${stats.maintenanceRequirements}`);
  console.log(`   Maintenance Records: ${stats.maintenanceRecords}`);
  console.log(`   Reservations: ${stats.reservations}`);
  console.log(`   Vehicle Responsibles: ${stats.vehicleResponsibles}`);
  console.log(`   Vehicle Kilometers: ${stats.vehicleKilometers}`);
  console.log(`   Vehicle ACLs: ${stats.vehicleACLs}`);
  console.log(`   User Roles: ${stats.userRoles}`);
  console.log(`   Quarterly Controls: ${stats.quarterlyControls}`);
  console.log(`   Quarterly Control Items: ${stats.quarterlyControlItems}`);

  return stats;
}

// Only run if this file is executed directly (not imported)
if (fileURLToPath(import.meta.url) === process.argv[1]) {
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
