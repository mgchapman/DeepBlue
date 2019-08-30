const cfg = require("../../config.json");

function LichessCommand(deepblue, msg) {
    if(cfg.lichess.channels) {
        if(!cfg.lichess.channels.includes(msg.channel.name)) {
            return; //Not in the right channel
        }
    }

    let split = msg.content.split(/\s+/);

    if(split.length === 1) {
        return msg.channel.send("Not enough arguments.");
    } else if(split.length === 2) {
        return deepblue.lichessTracker.track(msg, split[1]);
    }
}

module.exports = LichessCommand;