import { some } from "../../../db";

const BASE_SELECT = `
    SELECT
        id,
        name
    FROM
        maintenance_categories
    `;

export const getAllMaintenancesCategories = async () => {
  const query = `${BASE_SELECT}`;
  const maintenanceCategoryRecords = await some(query, []);
  return maintenanceCategoryRecords;
};

