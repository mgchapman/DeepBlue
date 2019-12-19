const cfg = require("../config.json");
const FenCommand = require("./commands/fen.js");
const HelpCommand = require("./commands/help.js");
const StudyCommand = require("./commands/study.js");
const LichessCommand = require("./commands/lichess.js");
const RemoveCommand = require("./commands/remove.js");

const RatingRoleManager = require("./ratingrolemanager.js");
const LichessTracker = require("./lichesstracker.js");

function DeepBlue(discord) {
    this.guild = discord.guilds.first();
    this.botChannel = this.guild.channels.find(c => c.name === cfg.deepblue.botChannelName);
    this.modChannel = this.guild.channels.find(c => c.name === cfg.deepblue.modChannelName);
    this.staffRole = this.guild.roles.find(val => val.name === cfg.deepblue.staffRole);
    this.discord = discord;
    this.ratingRoleManager = new RatingRoleManager(this);
    this.lichessTracker = new LichessTracker(this);

    discord.on("message", msg => this.onMessage(msg));

    discord.on("guildMemberRemove", member => {
        this.lichessTracker.remove(null, member);
    });
}

DeepBlue.prototype.onMessage = function(msg) {
    if(!cfg.deepblue.commandStartChars.includes(msg.content[0]) || !msg.member) {
        return; //Not a command, or a direct message
    }
    let cmd = msg.content.substring(1).toLowerCase();

    if(cmd.startsWith("fen")) {
        FenCommand(this, msg);
    } else if(cmd.startsWith("help") || cmd.startsWith("dbhelp")) {
        HelpCommand(this, msg);
    } else if(cmd.startsWith("lichess") || cmd.startsWith("link")) {
        LichessCommand(this, msg);
    } else if(cmd.startsWith("remove") || cmd.startsWith("unlink")) {
        RemoveCommand(this, msg);
    } else if(cmd === "study") {
        StudyCommand(this, msg);
    } else if(cmd === "update") {
        this.sendMessage(msg.channel, "Bot auto updates now. Check when the next update is due in the bot's status message.");
    }

    console.log(new Date().toString(), msg.member.nickname || msg.author.username, ":", msg.content);
};

DeepBlue.prototype.sendMessage = function(channel, msg, keep) {
    if(!channel) {
        channel = this.botChannel;
    }
    channel.send(msg)
};

DeepBlue.prototype.getMemberFromMention = function(text) {
    if(!text.startsWith("<@") || !text.endsWith(">")) {
        return null;
    }
    text = text.replace(/[^\d]/g, "");
    return this.guild.members.get(text);
};

module.exports = DeepBlue;
