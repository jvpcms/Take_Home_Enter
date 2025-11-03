import { migrate, generateTypes } from "./migrations/setup.ts";

await migrate();
await generateTypes();
