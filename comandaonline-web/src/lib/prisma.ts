import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url:
        process.env.DATABASE_URL +
        (process.env.DATABASE_URL?.includes("?") ? "&" : "?") +
        "connection_limit=5",
    },
  },
  log: ["error"],
});

prisma
  .$connect()
  .then(() => console.log("✅ Conexão com Supabase estabelecida"))
  .catch((err) => {
    console.error("❌ Falha na conexão:");
    console.error("URL usada:", process.env.DATABASE_URL);
    console.error(err);
  });

export default prisma;
