const cfg = require("../../config.json");

function RemoveCommand(deepblue, msg) {
    if(cfg.remove.channels) {
        if(!cfg.remove.channels.includes(msg.channel.name)) {
            return; //Not in the right channel
        }
    }

    deepblue.lichessTracker.remove(msg, msg.member);
}

module.exports = RemoveCommand;