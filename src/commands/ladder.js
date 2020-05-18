const cfg = require("../../config.json");

function LadderCommand(deepblue, msg) {
    if(cfg.ladder.channels) {
        if(!cfg.ladder.channels.includes(msg.channel.name)) {
            return; //Not in the right channel
        }
    }

    let ladderRole = msg.member.roles.find(val => val.name === cfg.ladder.ladderRoleName);
    if(ladderRole) {
        //Remove the role
        msg.member.removeRole(ladderRole).catch(console.error);
        deepblue.sendMessage(msg.channel, "Ladder role removed.");
    } else {
        //Add the role
        let role = msg.guild.roles.find(val => val.name === cfg.ladder.ladderRoleName);
        msg.member.addRole(role).catch(console.error);
        deepblue.sendMessage(msg.channel, "Ladder role added.");
    }

}

module.exports = LadderCommand;
