import mongoose from 'mongoose'
import mongo from './config.js'
import { getAllConsumProducts, getAllMercadonaProducts } from './lib.js'
import { MercadonaProduct, ConsumProduct } from './model.js'

try {
  await mongo()
  console.log('connected to mongoDB! Retrieveing all the products...')
  const [mercadonaProducts, consumProducts] = await Promise.all([
    getAllMercadonaProducts(),
    getAllConsumProducts()
  ])

  console.log('Inserting all the products into the DB...')
  await MercadonaProduct.collection.insertMany(mercadonaProducts)
  await ConsumProduct.collection.insertMany(consumProducts)

  /* res 200 */
} catch (err) {
  /* res 500 */
  console.log(err.message)
} finally {
  mongoose.connection.close()
}
