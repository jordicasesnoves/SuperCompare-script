import mongoose from 'mongoose'
import * as dotenv from 'dotenv' // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import

dotenv.config()

const mongoPath = process.env.MONGODB_URI

if (!mongoPath) throw new Error('env var for Mongo URI not defined')

const mongo = async () => {
  await mongoose.connect(mongoPath)
  return mongoose
}

export default mongo
