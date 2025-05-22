import { createSwaggerSpec } from "next-swagger-doc";

export const getApiDocs = async () => {
  const spec = createSwaggerSpec({
    apiFolder: "src/app/api",
    definition: {
      openapi: "3.0.0",
      info: {
        title: "Comanda Online API",
        version: "1.0",
      },
      components: {
        schemas: {
          Bar: {
            type: "object",
            properties: {
              id: {
                type: "string",
                format: "uuid",
                example: "abcd1234-5678-90ef-ghij-klmnopqrstuv",
              },
              name: {
                type: "string",
                example: "Bar do Zé",
              },
              ownerId: {
                type: "string",
                format: "uuid",
                example: "user-uuid-1234",
              },
            },
          },
          MenuItem: {
            type: "object",
            properties: {
              id: {
                type: "string",
                format: "uuid",
                example: "b0acb77e-33ea-4125-8f36-dfc88767070f",
              },
              name: {
                type: "string",
                example: "Cerveja artesanal",
              },
              price: {
                type: "number",
                format: "float",
                example: 12.5,
              },
              barId: {
                type: "string",
                format: "uuid",
                example: "123e4567-e89b-12d3-a456-426614174000",
              },
            },
          },
        },
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
          },
        },
      },
      security: [],
    },
  });
  return spec;
};
