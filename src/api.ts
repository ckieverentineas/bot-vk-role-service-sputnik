import { Logger } from "./module/helper";

const express = require('express')

const app = express();
const PORT = 3002;
const domen = `localhost`

// === API для опроса через fetch ===
app.get('/ping', async (req: any, res: any) => {
  res.json({ status: 'alive', message: 'Спутник ВК: Я жив!', timestamp: Date.now(), uptime: process.uptime().toFixed(2) + ' сек', });
});

export async function Start_Worker_API_Bot() {
    app.listen(PORT, () => {
      Logger(`Worker бот слушает на http://${domen}:${PORT}`);
    });
}