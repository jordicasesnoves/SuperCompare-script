import mongoose from 'mongoose'

const ProductSchema = new mongoose.Schema({
  id: String,
  name: String,
  currentPrice: Number,
  supermarket: String,
  priceDate: Number,
  priceHistory: Array,
  imageURL: String
})

const ReportSchema = new mongoose.Schema({
  message: String,
  updatedProducts: Array,
  insertedProducts: Array,
  date: Number
})

export const ScriptReport =
  mongoose.models.ScriptReport ||
  mongoose.model('ScriptReport', ReportSchema, 'reports')

export const MercadonaProduct =
  mongoose.models.MercadonaProduct ||
  mongoose.model('MercadonaProduct', ProductSchema, 'mercadona')

export const ConsumProduct =
  mongoose.models.ConsumProduct ||
  mongoose.model('ConsumProduct', ProductSchema, 'consum')
