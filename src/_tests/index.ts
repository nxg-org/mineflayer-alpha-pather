import { createBot } from "mineflayer";
import {inject} from "../index"




const bot = createBot({
    username: "test_pathing",
    host: "localhost",
    port: 25565
})

bot.loadPlugin(inject);