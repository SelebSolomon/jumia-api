const app = require("./app");
const DB = require('./src/config/database')
const {ENV} = require('./src/lib/env')
const port = ENV.PORT

DB()
app.listen(port, console.log(`App is running on ${port}`));
