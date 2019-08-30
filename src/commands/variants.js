const cfg = require("../../config.json");

function VariantsCommand(deepblue, msg) {
    if(cfg.variants.channels) {
        if(!cfg.variants.channels.includes(msg.channel.name)) {
            return; //Not in the right channel
        }
    }

    msg.channel.send({
        "embed": {
            "title": `Variants tracked by the bot:`,
            "color": cfg.deepblue.embedColor,
            "description": cfg.variants.list.join("\n")
        }
    });
}

module.exports = VariantsCommand;