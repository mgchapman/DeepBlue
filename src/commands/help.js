const cfg = require("../../config.json");

function HelpCommand(msg) {
    if(cfg.help.channels) {
        if(!cfg.help.channels.includes(msg.channel.name)) {
            return; //Not in the right channel
        }
    }
    msg.channel.send({
        "embed": {
            "color": cfg.deepblue.embedColor,
            "fields": cfg.help.fields
        }
    });
}

module.exports = HelpCommand;