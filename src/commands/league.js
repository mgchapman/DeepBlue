const cfg = require("../../config.json");

function LeagueCommand(msg) {
    if(cfg.league.channels) {
        if(!cfg.league.channels.includes(msg.channel.name)) {
            return; //Not in the right channel
        }
    }

    let leagueRole = msg.member.roles.find(val => val.name === cfg.league.leagueRoleName);
    if(leagueRole) {
        //Remove the role
        msg.member.removeRole(leagueRole);
        msg.channel.send("League role removed.");
    } else {
        //Add the role
        let role = msg.guild.roles.find(val => val.name === cfg.league.leagueRoleName);
        msg.member.addRole(role);
        msg.channel.send("League role added.");
    }
}

module.exports = LeagueCommand;