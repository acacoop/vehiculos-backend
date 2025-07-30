import { some } from "../../../db";

const BASE_SELECT = `
    SELECT
        m.id,
        m.name,
        mc.name as maintenanceCategoryName
    FROM
        maintenances as m
        INNER JOIN
            maintenance_categories as mc
        ON
            m.category_id = mc.id
    `;

export const getAllMaintenances = async () => {
  const query = `${BASE_SELECT}`;
  const maintenanceRecords = await some(query, []);
  return maintenanceRecords;
};
