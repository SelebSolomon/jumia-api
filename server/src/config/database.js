const mongoose = require('mongoose')
const {ENV} = require('../lib/env')


const DB = async () => {
    try {
        const conn = await mongoose.connect(ENV.MONGO_URL)
        console.log(`MongoDB Connected Successfully ${conn.connection.name}`)
    } catch (error) {
        console.log(error.message)
    }
}

module.exports = DB