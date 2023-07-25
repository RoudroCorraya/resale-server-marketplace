const express = require('express');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require('cors');
require('dotenv').config();
const app = express();

const stripe = require("stripe")(process.env.STRIPE_SECRET);
const port = process.env.PORT || 5000;

//middleware start
app.use(cors());
app.use(express.json());
//middleware end


//mongodb start


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster3resalemarketpla.onz9ndk.mongodb.net/?retryWrites=true&w=majority`;


// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    //maek connection start
    const categoriesCollection = client.db('resale-categories').collection('allCategoris');
    const usersCollection = client.db('resale-categories').collection('users');
    const bookingInfoCollection = client.db('resale-categories').collection('bookingInfo');
    const paymentfoCollection = client.db('resale-categories').collection('paymentDetails');
    //maek connection end

    //define route start
    app.get('/categories', async (req, res) => {
      
      const query = {};
      const categories = await categoriesCollection.find(query).toArray();

      res.send(categories);
    });
    //add product data start
    app.post('/dashboard/addproduct', async (req, res) => {
      const addProcuct = req.body;
      const result = await categoriesCollection.insertOne(addProcuct);
      res.send(result);
    })
    //add product data end
    app.get('/categories/:category', async (req, res) => {
      const category = req.params.category;
      console.log('lg cheakinbg', category);
      const query = { category };
      const result = await categoriesCollection.find(query).toArray();
      res.send(result);

    });
    // app.get('/categories/:category_id', async(req, res) =>{
    //     const category_id = req.params._id;
    //     console.log('uuu',category_id);
    //     const query = {category_id: category_id};
    //     const categories = await categoriesCollection.find(query).toArray();
    //     res.send(categories);
    // })
    // app.get('/categories/:_id', async (req, res) => {
    //   const _id = req.params._id;
    //   console.log('new', _id);
    //   const query = { _id };
    //   const eachcategories = await categoriesCollection.find(query).toArray();
    //   res.send(eachcategories);
    // });

    app.post('/users', async (req, res) => {
      const user = req.body;
      const result = await usersCollection.insertOne(user);
      res.send(result);
    });
    app.post('/booking', async (req, res) => {
      const bookingInfo = req.body;
      const result = await bookingInfoCollection.insertOne(bookingInfo);
      res.send(result);
    });
    app.get('/dashboard/orders', async (req, res) => {
      console.log(req.query.email);
      let query = {};
      const bookinbEmail = req.query.email;
      if (req.query.email) {
        query = {
          buyer: bookinbEmail
        }
      }

      const result = await bookingInfoCollection.find(query).toArray();
      res.send(result);
    });
    app.get('/dashboard/orders/:email', async (req, res) => {
      const buyeremail = req.params.email;
      console.log('buyers email', buyeremail);
      const query = { buyeremail };
      const result = await bookingInfoCollection.find(query).toArray();
      res.send(result);
    });

    //making admin start
    // app.put('/users/admin/:_id', async(req, res) => {
    //   const _id = req.params._id;
    //   const filter = {_id: new ObjectId(_id)};
    //   const option = {upsert: true};
    //   const updatedDoc = {
    //     $set: {
    //       role: 'admin'
    //     }
    //   }
    //   const result = await usersCollection.updateOne(filter, updatedDoc, option);
    // })
    //making admin end

    // dashbord admin route separation start
    app.get('/users/admin/:email', async (req, res) => {
      const email = req.params.email;
      const query = { email };
      const user = await usersCollection.findOne(query);
      res.send({ isAdmin: user?.role === 'Admin' });
    });
    // dashbord admin route separation end
    app.get('/users/seller/:email', async (req, res) => {
      const email = req.params.email;
      const query = { email };
      const user = await usersCollection.findOne(query);
      res.send({ isSeller: user?.role === 'Seller' });
    });
    //my product data loading start
    app.get('/dashboard/categories/:SellerEmail', async (req, res) => {
      const SellerEmail = req.params.SellerEmail;
      console.log('SellerEmail', SellerEmail);
      const query = { SellerEmail };
      const result = await categoriesCollection.find(query).toArray();
      // const result2 = await bookingInfoCollection.find(query).toArray();
      res.send(result);

    });
    //my product data loading end
    app.get('/users/buyer/:email', async (req, res) => {
      const email = req.params.email;
      const query = { email };
      const user = await usersCollection.findOne(query);
      res.send({ isbuyer: user?.role === 'Buyer' });
    });
    app.get('/sellers', async (req, res) => {
      const query = { role: 'Seller' }
      const sellers = await usersCollection.find(query).toArray();
      res.send(sellers);
    });
    app.get('/buyer', async (req, res) => {
      const query = { role: 'Buyer' }
      const sellers = await usersCollection.find(query).toArray();
      res.send(sellers);
    });
    app.get('/dashboard/payment/:_id', async (req, res) => {
      const _id = req.params._id;
      const query = { _id: new ObjectId(_id) };
      const bookingidInfo = await bookingInfoCollection.findOne(query);
      res.send(bookingidInfo);
    });
    //payment intent start
    app.post("/create-payment-intent", async (req, res) => {
      const booked = req.body;
      const price = booked.ResalePrice;
      const total = price * 100;
      const paymentIntent = await stripe.paymentIntents.create({
        currency: 'usd',
        amount: total,
        "payment_method_types": [
          "card"
        ],
      });
      res.send({
        clientSecret: paymentIntent.client_secret,
      });
    });
    //payment intent end

    //payment data inserting start
    app.post('/payments', async(req, res) =>{
      const payment = req.body;
      const result = await paymentfoCollection.insertOne(payment);
      const _id = payment.bookingId;
     
      const query = {_id: new ObjectId(_id)};
     
      
      const updatedDoc ={
        $set: {
          paid: true,
          transectionId: payment.TransectionId
        }
      }
      const updateResult = await bookingInfoCollection.updateOne(query, updatedDoc);
      
     
      
      res.send(result);
    });
    //payment data inserting end

    // undold buttom update start
    app.patch('/payments/:product_Id', async(req, res) =>{
      const productinfo = req.params; 
      const product_Id = productinfo.product_Id;
      console.log('productID', product_Id)
      const query = {_id : new ObjectId(product_Id)};
      const updatedDoc = {
        $set: {
          status: true,
        }
      }
      const updateresult = await categoriesCollection.updateOne(query, updatedDoc);
      console.log('status', updateresult);
      res.send(updateresult);
    })
    //undold buttom update end


//delete seller start
app.delete('/sellers/:_id', async(req, res)=>{
  const _id = req.params._id;
  const query = {_id : new ObjectId(_id)};
  const result = await usersCollection.deleteOne(query);
  res.send(result);
})
//delete seller end
//delete buyer start
app.delete('/buyer/:_id', async(req, res)=>{
  const _id = req.params._id;
  const query = {_id : new ObjectId(_id)};
  const result = await usersCollection.deleteOne(query);
  res.send(result);
});
//delete buyer end

//mybuyer part start
app.get('/dashboard/mybuyerfind/:SellerEmail', async(req, res) =>{
  const SellerEmail = req.params.SellerEmail;
  console.log('roxs cheak', SellerEmail);
  const query = {SellerEmail};
  const result = await bookingInfoCollection.find(query).toArray();
  res.send(result);
})
//mybuyer part end
app.delete('/mybuyer/:_id', async(req, res)=>{
  const _id = req.params._id;
  const query = {_id : new ObjectId(_id)};
  const result = await bookingInfoCollection.deleteOne(query);
  res.send(result);
});
app.delete('/myproduct/:_id', async(req, res)=>{
  const _id = req.params._id;
  const query = {_id : new ObjectId(_id)};
  const result = await categoriesCollection.deleteOne(query);
  res.send(result);
});






    //


    //define route end


  } finally {

  }
}
run().catch(console.dir);

//mongodb end
app.get('/', async (req, res) => {
  res.send('resale market server is running');
})
app.listen(port, () => console.log(`resale market server is running on ${port}`));
