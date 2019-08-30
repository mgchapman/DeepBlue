const cfg = require("./config.json");
const DeepBlue = require("./src/deepblue.js");
const client = new (require("discord.js")).Client();

client.login(cfg.discordToken);
client.on("ready", () => {
    let guild = client.guilds.first();
    for(let i = 0; i < cfg.ratingRoleManager.roles.length; i++) {
        let role = cfg.ratingRoleManager.roles[i];
        let foundRole = guild.roles.find((val) => val.name === role);
        if(!foundRole) {
            console.error("Coundn't find role", role);
        }
    }

    new DeepBlue(client);
    console.log("The bot started!");
});