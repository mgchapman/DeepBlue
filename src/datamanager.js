const fs = require("fs");

function DataManager(file) {
    this.file = file;
    //Create file if doesnt exist
    try {
        fs.accessSync(this.file);
    } catch(e) {
        console.log("Created", this.file);
        fs.appendFileSync(this.file, "{}");
    }
}

DataManager.prototype.getData = function() {
    return JSON.parse(fs.readFileSync(this.file));
};

DataManager.prototype.saveData = function(data) {
    fs.writeFileSync(this.file, JSON.stringify(data));
};

module.exports = DataManager;