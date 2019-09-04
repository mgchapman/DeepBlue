const cfg = require("../../config.json");

function ArenaCommand(msg) {
    if(cfg.arena.channels) {
        if(!cfg.arena.channels.includes(msg.channel.name)) {
            return; //Not in the right channel
        }
    }

    let arenaRole = msg.member.roles.find(val => val.name === cfg.arena.arenaRoleName);
    if(arenaRole) {
        //Remove the role
        msg.member.removeRole(arenaRole);
        msg.channel.send("Arena role removed.");
    } else {
        //Add the role
        let role = msg.guild.roles.find(val => val.name === cfg.arena.arenaRoleName);
        msg.member.addRole(role);
        msg.channel.send("Arena role added.");
    }
}

module.exports = ArenaCommand;