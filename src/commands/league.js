const cfg = require("../../config.json");

function LeagueCommand(deepblue, msg) {
    if(cfg.league.channels) {
        if(!cfg.league.channels.includes(msg.channel.name)) {
            return; //Not in the right channel
        }
    }

    let leagueRole = msg.member.roles.find(val => val.name === cfg.league.leagueRoleName);
    if(leagueRole) {
        //Remove the role
        msg.member.removeRole(leagueRole).catch(console.error);
        deepblue.sendMessage(msg.channel, "League role removed.");
    } else {
        //Add the role
        let role = msg.guild.roles.find(val => val.name === cfg.league.leagueRoleName);
        msg.member.addRole(role).catch(console.error);
        deepblue.sendMessage(msg.channel, "League role added.");
    }

    msg.delete(cfg.deepblue.messageDeleteDelay).catch(console.error);
}

module.exports = LeagueCommand;