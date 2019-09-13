const cfg = require("../../config.json");

function ArenaCommand(deepblue, msg) {
    if(cfg.arena.channels) {
        if(!cfg.arena.channels.includes(msg.channel.name)) {
            return; //Not in the right channel
        }
    }

    let arenaRole = msg.member.roles.find(val => val.name === cfg.arena.arenaRoleName);
    if(arenaRole) {
        //Remove the role
        msg.member.removeRole(arenaRole).catch(console.error);
        deepblue.sendMessage(msg.channel, "Arena role removed.");
    } else {
        //Add the role
        let role = msg.guild.roles.find(val => val.name === cfg.arena.arenaRoleName);
        msg.member.addRole(role).catch(console.error);
        deepblue.sendMessage(msg.channel, "Arena role added.");
    }

    msg.delete(cfg.deepblue.messageDeleteDelay).catch(console.error);
}

module.exports = ArenaCommand;