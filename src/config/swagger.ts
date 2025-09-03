import swaggerUi from "swagger-ui-express";
import YAML from "yamljs";
import path from "path";
import { Express } from "express";

// Load static OpenAPI YAML once at startup
const staticSpec = YAML.load(path.join(__dirname, "../../openAPI.yaml"));

// Minimal custom UI options (static only)
const swaggerUiOptions = {
  explorer: false,
  customCss: `
    .swagger-ui .topbar { background-color: #2c3e50; }
  `,
  customSiteTitle: "Vehiculos API Documentation",
  customfavIcon: "/favicon.ico",
  swaggerOptions: {
    docExpansion: "list",
    filter: false,
    tryItOutEnabled: true,
  },
};

export const setupSwagger = (app: Express) => {
  // Serve static swagger UI backed by the YAML file only
  app.use(
    "/docs",
    swaggerUi.serve,
    swaggerUi.setup(staticSpec, swaggerUiOptions),
  );

  // Raw JSON (converted from YAML once)
  app.get("/docs.json", (_req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.send(staticSpec);
  });

  // Raw YAML passthrough
  app.get("/docs.yaml", (_req, res) => {
    res.setHeader("Content-Type", "text/yaml");
    res.send(YAML.stringify(staticSpec, 4));
  });
};
