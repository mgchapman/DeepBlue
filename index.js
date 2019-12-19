const cfg = require("./config.json");
const DeepBlue = require("./src/deepblue.js");
const client = new (require("discord.js")).Client({
    disabledEvents: ["TYPING_START"]
});

client.login(cfg.discordToken);
client.on("ready", () => {
    let guild = client.guilds.first();
    let roles = [...cfg.ratingRoleManager.roles];
    roles.push(cfg.ratingRoleManager.unrankedRole);
    roles.push(cfg.ratingRoleManager.provisionalRole);
    roles.push(cfg.deepblue.staffRole);
    roles.push(cfg.study.studyRoleName);

    new DeepBlue(client);
    console.log("The bot started!");
});

client.on("error", console.error);
