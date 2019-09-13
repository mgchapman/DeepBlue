const cfg = require("../../config.json");

function VariantsCommand(deepblue, msg) {
    if(cfg.variants.channels) {
        if(!cfg.variants.channels.includes(msg.channel.name)) {
            return; //Not in the right channel
        }
    }

    deepblue.sendMessage(msg.channel, {
        "embed": {
            "title": `Variants tracked by the bot:`,
            "color": cfg.deepblue.embedColor,
            "description": cfg.variants.list.join("\n")
        }
    });

    msg.delete(cfg.deepblue.messageDeleteDelay).catch(console.error);
}

module.exports = VariantsCommand;