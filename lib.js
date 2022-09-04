import axios from 'axios'

export const getAllMercadonaProducts = async () => {
  console.log('Retrieving Mercadona data...')
  const mercadonaCategoriesUrl = `https://tienda.mercadona.es/api/categories/?lang=es&wh=vlc1`
  const { data: mercadonaCategories } = await axios.get(
    mercadonaCategoriesUrl,
    { headers: { 'Content-Type': 'application/json' } }
  )
  const cats = mercadonaCategories.results
  const catsIds = []
  await Promise.all(
    cats.map(async (cat) => {
      await Promise.all(
        cat.categories.map(async (subCat) => {
          catsIds.push(subCat.id)
        })
      )
    })
  )

  const allProducts = []
  await Promise.all(
    catsIds.map(async (catId) => {
      const url = `https://7uzjkl1dj0-dsn.algolia.net/1/indexes/products_prod_vlc1_es/query?x-algolia-agent=Algolia%20for%20JavaScript%20(3.35.1)%3B%20Browser&x-algolia-application-id=7UZJKL1DJ0&x-algolia-api-key=9d8f2e39e90df472b4f2e559a116fe17`
      const { data } = await axios.post(
        url,
        `{"params":"query=*&facetFilters=%5B%22categories.categories.id%3A${catId}%22%5D"}`,
        {
          headers: { 'Content-Type': 'text/plain' }
        }
      )
      const products = data.hits
      allProducts.push(...products)
    })
  )

  let totalTotal = 0
  const mercadonaPrices = allProducts.map((product) => {
    const priceParsed = parseFloat(product.price_instructions.unit_price)
    totalTotal = totalTotal + priceParsed
    return {
      id: product.id,
      name: product.display_name,
      supermarket: 'mercadona',
      currentPrice: priceParsed,
      priceDate: Date.now(),
      priceHistory: [{ price: priceParsed, priceDate: Date.now() }],
      imageURL: product.thumbnail
    }
  })
  /*  Remove duplicated products */
  const filteredArr = mercadonaPrices.reduce((acc, current) => {
    const x = acc.find((item) => item.id === current.id)
    if (!x) {
      return acc.concat([current])
    } else {
      return acc
    }
  }, [])

  console.log('Mercadona ready! ' + filteredArr.length + ' products loaded')
  return filteredArr
}

export const getAllConsumProducts = async () => {
  console.log('Retrieving Consum data...')
  let counter = 0
  const consumURL = `https://tienda.consum.es/api/rest/V1.0/catalog/product?limit=100&offset=0`
  const consumProducts = []
  while (true) {
    const { data } = await axios.get(
      `https://tienda.consum.es/api/rest/V1.0/catalog/product?limit=100&offset=${
        counter * 100
      }`,
      {
        headers: {
          'x-tol-zone': '0'
        }
      }
    )
    consumProducts.push(...data.products)
    counter++
    if (!data.hasMore) break
  }

  const consumPrices = consumProducts.map((product) => {
    const imageURL = product.media[0]?.url || product.productData.imageURL
    const imageURLBigger = imageURL.replace('135x135', '300x300')
    const price = parseFloat(
      product.priceData.prices[0].value.centAmount.toFixed(2)
    )
    return {
      id: product.code,
      name: product.productData.name,
      currentPrice: price,
      supermarket: 'consum',
      priceDate: Date.now(),
      priceHistory: [{ price, priceDate: Date.now() }],
      imageURL: imageURLBigger
    }
  })
  console.log('Consum data ready! ' + consumPrices.length + ' products loaded')

  return consumPrices
}

export const checkProductExists = async (product, model) => {
  /* Non-existing product */
  const isAlreadyExistingProduct = await model.findOne({ id: product.id })

  if (!isAlreadyExistingProduct) {
    /* Add the product to the DB */
    console.log(
      'Non existing product found! Inserting into the DB... ',
      product.name
    )
    await model.collection.insertOne(product)
    return false
  }
  return true
}

export const checkProductPrice = async (product, model) => {
  /* Product with outdated price */
  const foundProduct = await model.findOne({
    id: product.id,
    currentPrice: { $ne: product.currentPrice }
  })

  if (foundProduct) {
    const update = {
      currentPrice: product.currentPrice,
      priceDate: Date.now(),
      priceHistory: [
        ...foundProduct.priceHistory,
        {
          price: product.currentPrice,
          priceDate: Date.now()
        }
      ]
    }
    const updatedProduct = await model.findOneAndUpdate(
      {
        id: product.id,
        currentPrice: { $ne: product.currentPrice }
      },
      update,
      { new: true }
    )
    return updatedProduct
  }

  return foundProduct
}

export const DBWipe = async () => {
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
  }
}
