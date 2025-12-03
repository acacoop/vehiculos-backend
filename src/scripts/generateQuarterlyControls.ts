/*
  Script to generate quarterly controls for all active vehicles.
  This script creates a control for each active vehicle with predefined items.

  Usage: npm run generate-quarterly-controls
  Or: tsx --env-file=.env src/scripts/generateQuarterlyControls.ts
*/

import { fileURLToPath } from "node:url";
import { AppDataSource } from "@/db";
import { Vehicle } from "@/entities/Vehicle";
import { QuarterlyControl } from "@/entities/QuarterlyControl";
import { QuarterlyControlItem } from "@/entities/QuarterlyControlItem";
import { QuarterlyControlItemStatus } from "@/enums/QuarterlyControlItemStatusEnum";

// Predefined control items organized by category
const CONTROL_CATEGORIES = {
  "Motor y Fluidos": [
    "Nivel de aceite",
    "Nivel de refrigerante",
    "Sin pérdidas de fluidos",
    "Dirección y freno de mano operativos",
  ],
  "Luces y Señalización": [
    "Luces de posición",
    "Luces de freno",
    "Luces de giro / balizas",
    "Luces de retroceso",
    "Bocina",
  ],
  "Neumáticos y Carrocería": [
    "Estado de cubiertas",
    "Estado de espejos",
    "Estado del parabrisas",
    "Tapa de combustible",
    "Rueda de auxilio + accesorios",
  ],
  "Seguridad y Emergencia": [
    "Cinturones de seguridad",
    "Apoyacabezas",
    "Matafuego vigente",
    "Chaleco reflectivo",
    "Balizas y botiquín",
  ],
};

// Flatten categories into template format
const CONTROL_ITEMS_TEMPLATE = Object.entries(CONTROL_CATEGORIES).flatMap(
  ([category, items]) => items.map((title) => ({ category, title })),
);

/**
 * Get current quarter (1-4) based on current date
 */
function getCurrentQuarter(): number {
  const month = new Date().getMonth() + 1; // 1-12
  return Math.ceil(month / 3); // 1-4
}

/**
 * Calculate intended delivery date (last day of current quarter)
 */
function getIntendedDeliveryDate(): string {
  const year = new Date().getFullYear();
  const quarter = getCurrentQuarter();
  const lastMonthOfQuarter = quarter * 3;
  const lastDayOfQuarter = new Date(year, lastMonthOfQuarter, 0);
  return lastDayOfQuarter.toISOString().split("T")[0];
}

/**
 * Check if a control already exists for a vehicle in the current quarter
 */
async function controlExists(
  vehicleId: string,
  year: number,
  quarter: number,
): Promise<boolean> {
  const controlRepo = AppDataSource.getRepository(QuarterlyControl);
  const existing = await controlRepo.findOne({
    where: { vehicle: { id: vehicleId }, year, quarter },
  });
  return existing !== null;
}

/**
 * Main function to generate controls
 */
async function generateQuarterlyControls(): Promise<void> {
  console.log("🚀 Starting quarterly control generation...\n");

  const year = new Date().getFullYear();
  const quarter = getCurrentQuarter();
  const intendedDeliveryDate = getIntendedDeliveryDate();

  console.log(`📅 Current period: Q${quarter} ${year}`);
  console.log(`📆 Intended delivery date: ${intendedDeliveryDate}\n`);

  // Get all vehicles (assuming we want all vehicles, not just "active" ones)
  // If you have an 'active' field, add: where: { active: true }
  const vehicleRepo = AppDataSource.getRepository(Vehicle);
  const vehicles = await vehicleRepo.find({
    relations: ["model", "model.brand"],
  });

  console.log(`🚗 Found ${vehicles.length} vehicles\n`);

  let created = 0;
  let skipped = 0;

  for (const vehicle of vehicles) {
    try {
      // Check if control already exists
      const exists = await controlExists(vehicle.id, year, quarter);
      if (exists) {
        console.log(
          `⏭️  Skipped ${vehicle.licensePlate} - control already exists`,
        );
        skipped++;
        continue;
      }

      // Create control
      const controlRepo = AppDataSource.getRepository(QuarterlyControl);
      const control = controlRepo.create({
        vehicle,
        year,
        quarter,
        intendedDeliveryDate,
        filledBy: null,
        filledAt: null,
      });
      const savedControl = await controlRepo.save(control);

      // Create control items
      const itemRepo = AppDataSource.getRepository(QuarterlyControlItem);
      const items = CONTROL_ITEMS_TEMPLATE.map((template) => {
        return itemRepo.create({
          quarterlyControl: savedControl,
          category: template.category,
          title: template.title,
          status: QuarterlyControlItemStatus.PENDIENTE,
          observations: "", // Empty by default
        });
      });
      await itemRepo.save(items);

      console.log(
        `✅ Created control for ${vehicle.licensePlate} (${vehicle.model.brand.name} ${vehicle.model.name}) with ${items.length} items`,
      );
      created++;
    } catch (error) {
      console.error(
        `❌ Error creating control for ${vehicle.licensePlate}:`,
        error,
      );
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   ✅ Created: ${created} controls`);
  console.log(`   ⏭️ Skipped: ${skipped} (already exist)`);
  console.log(
    `   📝 Total items per control: ${CONTROL_ITEMS_TEMPLATE.length}`,
  );
}

/**
 * Main execution
 */
async function main() {
  console.log("🔌 Initializing database connection...\n");

  try {
    await AppDataSource.initialize();
    console.log("✅ Database connected\n");

    await generateQuarterlyControls();

    console.log("\n✨ Script completed successfully!");
  } catch (error) {
    console.error("\n❌ Script failed:", error);
    process.exit(1);
  } finally {
    await AppDataSource.destroy();
    console.log("\n🔌 Database connection closed");
  }
}

// Run only if this is the main module
const isMain = process.argv[1] === fileURLToPath(import.meta.url);
if (isMain) {
  main();
}

export { generateQuarterlyControls };
