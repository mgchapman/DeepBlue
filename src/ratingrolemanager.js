const cfg = require("../config.json");

function RatingRoleManager(deepblue) {
    this.roles = cfg.ratingRoleManager.roles;
    this.unrankedRole = cfg.ratingRoleManager.unrankedRole;
    this.deepblue = deepblue;

    this.deepblue.discord.on("guildMemberAdd", (member) => {
        let role = this.deepblue.guild.roles.find((val) => val.name === this.unrankedRole);
        member.addRole(role);
    });
}

RatingRoleManager.prototype.assignRoleForRating = function(member, rating, msg) {
    //Check if user has unranked role and remove it
    let unranked = member.roles.find((val) => val.name === this.unrankedRole);
    if(unranked) {
        member.removeRole(unranked);
    }

    let matchedRole = this.getRoleForRating(rating);

    //Remove other rating roles, if there are any
    let alreadyHasMatchedRole = false;
    member.roles.some((role) => {
        if(this.roles.includes(role.name)) {
            if(role.name === matchedRole) {
                alreadyHasMatchedRole = true;
            } else {
                member.removeRole(role);
            }
        }
    });

    //Add new role, if needed
    if(!alreadyHasMatchedRole) {
        let role = this.deepblue.guild.roles.find((val) => val.name === matchedRole);
        member.addRole(role);
        return matchedRole;
    }

    return null;
};

RatingRoleManager.prototype.getCurrentRatingRole = function(member) {
    let found = null;

    member.roles.some((role) => {
        if(this.roles.includes(role.name)) {
            found = role.name;
        }
    });

    return found;
};

RatingRoleManager.prototype.remove = function(member) {
    member.roles.some((role) => {
        if(this.roles.includes(role.name)) {
            member.removeRole(role);
        }
    });

    let unranked = this.deepblue.guild.roles.find((val) => val.name === this.unrankedRole);
    member.addRole(unranked);
};

RatingRoleManager.prototype.getRoleForRating = function(rating) {
    //Find appropriate rating role
    //Lowest role edge case
    let matchedRole = rating < parseInt(this.roles[0]) ? this.roles[0] : null;
    if(!matchedRole) {
        //Starting with 2nd lowest
        for(let i = 1; i < this.roles.length; i++) {
            let r = parseInt(this.roles[i]);
            if(rating >= r) {
                matchedRole = this.roles[i];
            } else {
                break; //Implies that roles in config are in order
            }
        }
    }

    if(!matchedRole) {
        console.error(`Coundn't find appropriate role for rating ${rating}.`);
        return null;
    }

    return matchedRole;
};

module.exports = RatingRoleManager;