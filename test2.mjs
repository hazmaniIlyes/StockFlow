import { app } from "electron";
console.log(typeof app);
if (app) app.quit();
