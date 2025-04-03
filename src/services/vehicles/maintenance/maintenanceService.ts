import { some } from "../../../db";

const BASE_SELECT = `
    SELECT
        m.id,
        m.name,
        m.img_name as maintenanceImgName,
        mc.name as maintenanceCategoryName
    FROM
        maintenance as m
        INNER JOIN
            maintenance_category as mc
        ON
            m.category_id = mc.id
    `;

export const getAllMaintenances = async () => {
  const query = `${BASE_SELECT}`;
  const maintenanceRecords = await some(query, []);
  return maintenanceRecords;
};
