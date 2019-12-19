const cfg = require("../../config.json");

function RemoveCommand(deepblue, msg) {
    if(cfg.remove.channels) {
        if(!cfg.remove.channels.includes(msg.channel.name)) {
            return; //Not in the right channel
        }
    }

    let split = msg.content.split(/\s+/);

    if(split.length < 2) {
        deepblue.lichessTracker.remove(msg, msg.member);
    } else if(split.length === 2) {
        let staffRoleOnMember = msg.member.roles.find(val => val.name === cfg.deepblue.staffRole);

        if(staffRoleOnMember) {
            //Check if mention
            let member = deepblue.getMemberFromMention(split[1]);

            if(member) {
                deepblue.lichessTracker.remove(msg, member);
            } else {
                //Remove by username
                deepblue.lichessTracker.removeByUsername(msg, split[1]);
            }
        } else {
            deepblue.sendMessage(msg.channel, "You do not have a staff role to use this command.");
        }
    } else {
        deepblue.sendMessage(msg.channel, "Too many parameters.");
    }

}

module.exports = RemoveCommand;
