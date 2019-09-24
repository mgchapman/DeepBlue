const cfg = require("../../config.json");

function LichessCommand(deepblue, msg) {
    if(cfg.lichess.channels) {
        if(!cfg.lichess.channels.includes(msg.channel.name)) {
            return; //Not in the right channel
        }
    }

    let split = msg.content.split(/\s+/);

    if(split.length < 2) {
        deepblue.sendMessage(msg.channel, "Not enough parameters.");
    } else if(split.length === 2) {
        deepblue.lichessTracker.track(msg, split[1]);
    } else {
        deepblue.sendMessage(msg.channel, "Too many parameters.");
    }

    msg.delete(cfg.deepblue.messageDeleteDelay).catch(console.error);
}

module.exports = LichessCommand;