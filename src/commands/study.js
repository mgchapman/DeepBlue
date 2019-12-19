const cfg = require("../../config.json");

function StudyCommand(deepblue, msg) {
    if(cfg.study.channels) {
        if(!cfg.study.channels.includes(msg.channel.name)) {
            return; //Not in the right channel
        }
    }

    let studyRole = msg.member.roles.find(val => val.name === cfg.study.studyRoleName);
    if(studyRole) {
        //Remove the role
        msg.member.removeRole(studyRole).catch(console.error);
        deepblue.sendMessage(msg.channel, "Study role removed.");
    } else {
        //Add the role
        let role = msg.guild.roles.find(val => val.name === cfg.study.studyRoleName);
        msg.member.addRole(role).catch(console.error);
        deepblue.sendMessage(msg.channel, "Study role added.");
    }

}

module.exports = StudyCommand;
