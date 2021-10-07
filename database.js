const mongoose = require("mongoose");
mongoose.set('useNewUrlParser', true);
mongoose.set('useUnifiedTopology', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useUnifiedTopology', true);


class Database{

    constructor() {
        this.connect();
    }

    connect() {
        mongoose.connect("mongodb+srv://admin:root@cluster0.ym9xh.mongodb.net/eclipseDB?retryWrites=true&w=majority")

        .then(() => {
            console.log("Successfully connected to database");
        })
        .catch((err) => {
            console.log("Database connection error " + err);
        })
    }
}

module.exports = new Database();