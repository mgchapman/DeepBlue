const cfg = require("../../config.json");

function StudyCommand(msg) {
    if(cfg.study.channels) {
        if(!cfg.study.channels.includes(msg.channel.name)) {
            return; //Not in the right channel
        }
    }

    let studyRole = msg.member.roles.find(val => val.name === cfg.study.studyRoleName);
    if(studyRole) {
        //Remove the role
        msg.member.removeRole(studyRole);
        msg.channel.send("Study role removed.");
    } else {
        //Add the role
        let role = msg.guild.roles.find(val => val.name === cfg.study.studyRoleName);
        msg.member.addRole(role);
        msg.channel.send("Study role added.");
    }
}

module.exports = StudyCommand;