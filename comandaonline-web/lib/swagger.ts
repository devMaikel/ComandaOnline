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
          Table: {
            type: "object",
            properties: {
              id: {
                type: "string",
                format: "uuid",
                example: "table-uuid-1234",
              },
              number: {
                type: "integer",
                example: 10,
              },
              barId: {
                type: "string",
                format: "uuid",
                example: "bar-uuid-1234",
              },
              createdAt: {
                type: "string",
                format: "date-time",
                example: "2025-05-22T14:30:00Z",
              },
              updatedAt: {
                type: "string",
                format: "date-time",
                example: "2025-05-22T14:30:00Z",
              },
              deletedAt: {
                type: "string",
                format: "date-time",
                nullable: true,
                example: null,
              },
            },
          },
          User: {
            type: "object",
            properties: {
              id: {
                type: "string",
                format: "uuid",
                example: "user-uuid-1234",
              },
              email: {
                type: "string",
                format: "email",
                example: "usuario@example.com",
              },
            },
          },

          CommandItem: {
            type: "object",
            properties: {
              id: {
                type: "string",
                format: "uuid",
                example: "item-uuid-1234",
              },
              quantity: {
                type: "integer",
                example: 2,
              },
              menuItem: {
                $ref: "#/components/schemas/MenuItem",
              },
              addedBy: {
                $ref: "#/components/schemas/User",
              },
              createdAt: {
                type: "string",
                format: "date-time",
                example: "2025-05-23T12:00:00Z",
              },
              updatedAt: {
                type: "string",
                format: "date-time",
                example: "2025-05-23T12:00:00Z",
              },
            },
          },

          Command: {
            type: "object",
            properties: {
              id: {
                type: "string",
                format: "uuid",
                example: "command-uuid-1234",
              },
              tableId: {
                type: "string",
                format: "uuid",
                example: "table-uuid-1234",
              },
              barId: {
                type: "string",
                format: "uuid",
                example: "bar-uuid-1234",
              },
              status: {
                type: "string",
                enum: ["OPEN", "CLOSED"],
                example: "OPEN",
              },
              publicHash: {
                type: "string",
                example: "a1b2c3d4e5",
              },
              openedById: {
                type: "string",
                format: "uuid",
                example: "user-uuid-1234",
              },
              closedById: {
                type: "string",
                format: "uuid",
                nullable: true,
                example: "user-uuid-5678",
              },
              createdAt: {
                type: "string",
                format: "date-time",
                example: "2025-05-23T11:00:00Z",
              },
              updatedAt: {
                type: "string",
                format: "date-time",
                example: "2025-05-23T11:30:00Z",
              },
              deletedAt: {
                type: "string",
                format: "date-time",
                nullable: true,
                example: null,
              },
              table: {
                $ref: "#/components/schemas/Table",
              },
              bar: {
                $ref: "#/components/schemas/Bar",
              },
              openedBy: {
                $ref: "#/components/schemas/User",
              },
              closedBy: {
                $ref: "#/components/schemas/User",
              },
              items: {
                type: "array",
                items: {
                  $ref: "#/components/schemas/CommandItem",
                },
              },
            },
          },

          // <<< ADIÇÕES NOVAS AQUI >>>
          CommandItemCreateRequest: {
            type: "object",
            required: ["commandId", "menuItemId", "quantity"],
            properties: {
              commandId: {
                type: "string",
                format: "uuid",
                example: "command-uuid-1234",
              },
              menuItemId: {
                type: "string",
                format: "uuid",
                example: "menuitem-uuid-1234",
              },
              quantity: {
                type: "integer",
                example: 3,
              },
              notes: {
                type: "string",
                nullable: true,
                example: "Sem cebola",
              },
            },
          },

          CommandItemUpdateRequest: {
            type: "object",
            properties: {
              quantity: {
                type: "integer",
                example: 5,
              },
              notes: {
                type: "string",
                nullable: true,
                example: "Sem lactose",
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
