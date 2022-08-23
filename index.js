import mongoose from 'mongoose'
import mongo from './config.js'
import {
  getAllConsumProducts,
  getAllMercadonaProducts,
  checkProductExists,
  checkProductPrice
} from './lib.js'

import { MercadonaProduct, ConsumProduct, ScriptReport } from './model.js'

try {
  console.time('temporazidor1')
  await mongo()
  console.log('connected to mongodb!')

  const [mercadonaProducts, consumProducts] = await Promise.all([
    getAllMercadonaProducts(),
    getAllConsumProducts()
  ])

  const updatedProducts = []
  const insertedProducts = []

  console.log('Checking Mercadona products...')
  await Promise.all(
    mercadonaProducts.map(async (product) => {
      const foundProduct = await checkProductExists(product, MercadonaProduct)
      if (!foundProduct) insertedProducts.push(product)

      const updatedProduct = await checkProductPrice(product, MercadonaProduct)
      if (updatedProduct) updatedProducts.push(updatedProduct)
    })
  )
  console.log('Mercadona products updated!')

  console.log('Checking Consum products...')
  await Promise.all(
    consumProducts.map(async (product) => {
      const foundProduct = await checkProductExists(product, ConsumProduct)
      if (!foundProduct) insertedProducts.push(product)

      const updatedProduct = await checkProductPrice(product, ConsumProduct)
      if (updatedProduct) updatedProducts.push(updatedProduct)
    })
  )
  console.log('Consum products updated!')

  const updatedCounter = updatedProducts.length
  const insertedCounter = insertedProducts.length
  const date = new Date().toLocaleDateString('es')

  const report = {
    message: `Cronjob successful at ${date} - Updated ${updatedCounter} product(s) and inserted ${insertedCounter} new one(s)`,
    updatedProducts,
    insertedProducts,
    date: Date.now()
  }

  await ScriptReport.collection.insertOne(report)
  console.timeEnd('temporazidor1')
  console.log(report.message)
} catch (err) {
  console.log(err.message)
} finally {
  mongoose.connection.close()
}
