const cfg = require("../config.json");
const FenCommand = require("./commands/fen.js");
const HelpCommand = require("./commands/help.js");
const ArenaCommand = require("./commands/arena.js");
const LeagueCommand = require("./commands/league.js");
const StudyCommand = require("./commands/study.js");
const VariantsCommand = require("./commands/variants.js");
const LichessCommand = require("./commands/lichess.js");
const RemoveCommand = require("./commands/remove.js");

const RatingRoleManager = require("./ratingrolemanager.js");
const LichessTracker = require("./lichesstracker.js");
/*
const RankCommand = require("./commands/rank.js");
const ListCommand = require("./commands/list.js");
*/

function DeepBlue(discord) {
    this.guild = discord.guilds.first();
    this.botChannel = this.guild.channels.find(c => c.name === cfg.deepblue.botChannelName);
    this.modChannel = this.guild.channels.find(c => c.name === cfg.deepblue.modChannelName);
    this.discord = discord;
    this.ratingRoleManager = new RatingRoleManager(this);
    this.lichessTracker = new LichessTracker(this);

    discord.on("message", msg => this.onMessage(msg));

    discord.on("guildMemberRemove", member => {
        this.lichessTracker.remove(null, member);
    });
}

DeepBlue.prototype.onMessage = function(msg) {
    if(!cfg.deepblue.commandStartChars.includes(msg.content[0])) {
        return; //Not a command
    }
    let commandStarter = msg.content.substring(1).toLowerCase();

    if(commandStarter.startsWith("fen")) {
        FenCommand(this, msg);
    } else if(commandStarter.startsWith("help") || commandStarter.startsWith("dbhelp")) {
        HelpCommand(msg);
    } else if(commandStarter.startsWith("lichess") || commandStarter.startsWith("link")) {
        LichessCommand(this, msg);
    } else if(commandStarter.startsWith("list")) {
        //ListCommand(this, msg);
    } else if(commandStarter.startsWith("active")) {
        //ListCommand(this, msg, true); //Active only flag set
    } else if(commandStarter.startsWith("rank") || commandStarter.startsWith("myrank")) {
        //RankCommand(this, msg);
    } else if(commandStarter === "remove" || commandStarter === "unlink") {
        RemoveCommand(this, msg);
    } else if(commandStarter === "arena") {
        ArenaCommand(msg);
    } else if(commandStarter === "league") {
        LeagueCommand(msg);
    } else if(commandStarter === "study") {
        StudyCommand(msg);
    } else if(commandStarter === "variants") {
        VariantsCommand(this, msg);
    }
};

DeepBlue.prototype.sendBotChannel = function(msg) {
    this.botChannel.send(msg).catch(console.error);
};

DeepBlue.prototype.sendModChannel = function(msg) {
    this.modChannel.send(msg).catch(console.error);
};

DeepBlue.prototype.getMemberFromMention = function(text) {
    if(!text.startsWith("<@") || !text.endsWith(">")) {
        return null;
    }
    text = text.replace(/[^\d]/g, "");
    return this.guild.members.get(text);
};

module.exports = DeepBlue;