import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import path from 'path';
import { Express } from 'express';

// Load OpenAPI spec from YAML file
const openApiSpec = YAML.load(path.join(__dirname, '../../openAPI.yaml'));

// Swagger configuration
const swaggerOptions: swaggerJSDoc.Options = {
  definition: openApiSpec,
  apis: [], // We use the external YAML file instead of inline docs
};

const swaggerSpec = swaggerJSDoc(swaggerOptions);

// Custom Swagger UI options
const swaggerUiOptions = {
  explorer: true,
  customCss: `
    .topbar-wrapper .link {
      content: url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjQwIiB2aWV3Qm94PSIwIDAgMTAwIDQwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjx0ZXh0IHg9IjEwIiB5PSIyNSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE2IiBmb250LXdlaWdodD0iYm9sZCIgZmlsbD0iIzMzNyI+VmVow61jdWxvczwvdGV4dD48L3N2Zz4=');
      height: 40px;
    }
    .swagger-ui .topbar { background-color: #2c3e50; }
  `,
  customSiteTitle: "Vehiculos API Documentation",
  customfavIcon: "/favicon.ico",
  swaggerOptions: {
    docExpansion: 'list',
    filter: true,
    showRequestHeaders: true,
    showCommonExtensions: true,
    tryItOutEnabled: true,
  }
};

// Setup Swagger middleware
export const setupSwagger = (app: Express) => {
  // Serve swagger docs
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerUiOptions));
  
  // Serve raw OpenAPI spec
  app.get('/docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  // Serve raw OpenAPI spec as YAML
  app.get('/docs.yaml', (req, res) => {
    res.setHeader('Content-Type', 'text/yaml');
    res.send(YAML.stringify(swaggerSpec, 4));
  });

  console.log('📚 Swagger documentation available at: /docs');
  console.log('📄 OpenAPI JSON spec available at: /docs.json');
  console.log('📄 OpenAPI YAML spec available at: /docs.yaml');
};
