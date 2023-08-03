const express = require('express');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require('cors');
require('dotenv').config();
const jwt = require('jsonwebtoken');

const app = express();

const stripe = require("stripe")(process.env.STRIPE_SECRET);
const port = process.env.PORT || 5000;

//middleware start
// app.use(cors());
const corsConfig = {
  origin: 'https://resale-server-market.vercel.app',
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]
}
app.use(cors(corsConfig));
app.options("", cors(corsConfig));
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

function verifyJWT(req, res, next) {
  console.log('jetauthoraization', req.headers.autorization);
  const authheader = req.headers.autorization;
  if (!authheader) {
    return res.status(401).send({ message: 'unauthorized access' })
  }
  const token = authheader.split(' ')[1];

  jwt.verify(token, process.env.ACCESS_TOKEN_JWT, function (err, decoded) {
    console.log('err decodes', err, decoded);
    if (err) {
      return res.status(401).send({ message: 'unauthorized access' });
    }
    req.decoded = decoded;
    next();
  });

}

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
     client.connect();
    //maek connection start
    const categoriesCollection = client.db('resale-categories').collection('allCategoris');
    const usersCollection = client.db('resale-categories').collection('users');
    const bookingInfoCollection = client.db('resale-categories').collection('bookingInfo');
    const paymentfoCollection = client.db('resale-categories').collection('paymentDetails');
    const WishLishfoCollection = client.db('resale-categories').collection('WishLish');
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

    app.post('/users',  async (req, res) => {
      // const decoded = req.decoded.email;
      // console.log('inside user api', decoded.email);
      const user = req.body;
      const userEmail = user.email;
      console.log('userjwt', userEmail);
      // if (userEmail !== decoded.email) {
      //   return res.status(403).send({ message: 'unauthorized access' });
      // }
      const result = await usersCollection.insertOne(user);
      console.log('inside user api', result);
      res.send(result);
    });
    // app.get('/jwt', async(req, res) =>{
    //   const email = req.query.email;
    //   console.log(req.headers.authorization);
    //   const query = {email};
    //   const user = await usersCollection.findOne(query);
    //   if(user){
    //     const token = jwt.sign({email}, process.env.ACCESS_TOKEN_JWT, {expiresIn: '6h'});
    //     return res.send({accessToken : token});
    //   }
    //   res.status(403).send({accessToken: 'forbidden access'});

    //   console.log(user);


    // });
    app.post('/jwt', async (req, res) => {
      const email = req.body;
      // console.log('tokenjwt', email);
      const token = jwt.sign({ email }, process.env.ACCESS_TOKEN_JWT, { expiresIn: '6h' });
      console.log('tokenjwt', token);
      res.send({ token });

      // if(user){
      //   const token = jwt.sign({email}, process.env.ACCESS_TOKEN_JWT, {expiresIn: '6h'});

      //   return res.send({accessToken: token});

      // }
      // res.status(403).send({accessToken: 'forbidden access'});


    });
    app.post('/booking', async (req, res) => {
      const bookingInfo = req.body;
      const result = await bookingInfoCollection.insertOne(bookingInfo);
      res.send(result);
    });
    app.get('/dashboard/orders', verifyJWT, async (req, res) => {
      // const decoded = req.decoded;
      // console.log('orderinside decoded', decoded.email);

      // if(decoded.email !== req.query.email){
      //   return res.status(403).send({message: 'unauthorized access'})
      // }
      // console.log('inside order api', decoded);
      const decoded = req.decoded.email;
      // console.log('orderinside decoded', decoded.email);
      let query = {};
      const bookinbEmail = req.query.email;
      // console.log('bookingemail', bookinbEmail);

      if (req.query.email) {
        query = {
          buyer: bookinbEmail
        }
        if (query.buyer !== decoded.email) {
          return res.status(403).send({ message: 'unauthorized access' });
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
    app.post('/payments', async (req, res) => {
      const payment = req.body;
      const result = await paymentfoCollection.insertOne(payment);
      const _id = payment.bookingId;

      const query = { _id: new ObjectId(_id) };


      const updatedDoc = {
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
    app.patch('/payments/:product_Id', async (req, res) => {
      const productinfo = req.params;
      const product_Id = productinfo.product_Id;
      console.log('productID', product_Id)
      const query = { _id: new ObjectId(product_Id) };
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


    //varified seller start

    // app.put('/sellerVerify/:SellerEmail', async(req, res) =>{
    //   const SellerEmail = req.params.SellerEmail;
    //   console.log('SellerEmail', SellerEmail);
    //   const query = {SellerEmail};
    //   const updatedDoc = {
    //     $set: {
    //       varify: true,
    //     }
    //   }
    //   const updateResult = await categoriesCollection.updateOne(query, updatedDoc);
    //   console.log('updateResult', updateResult);
    //   res.send(updateResult);
    // })
    app.patch('/sellerVerify/:SellerEmail', async (req, res) => {
      const SellerEmail = req.params.SellerEmail;

      console.log('SellerEmail ptch', SellerEmail)
      const query = { SellerEmail };
      const updatedDoc = {
        $set: {
          varify: true,
        }
      }
      const updateresult = await categoriesCollection.updateMany(query, updatedDoc);
      console.log('verify', updateresult);
      res.send(updateresult);
    })
    // varified seller end
    app.put('/userVerify/:_id', async(req, res) => {
      const _id = req.params._id;
      const filter = {_id: new ObjectId(_id)};
      const option = {upsert: true};
      const updatedDoc = {
        $set: {
          varify: true
        }
      }
      const result = await usersCollection.updateOne(filter, updatedDoc, option);
      // res.send(result);
    });
    app.get('/userverifycheak/:email', async(req, res) =>{
      const email = req.params.email;
      const filter = {email};
      const result = await usersCollection.findOne(filter);
      // const query = {SellerEmail: email};
      // const result = await usersCollection.findOne(filter);
      // if(result.varify){
      //   const updatedDoc = {
      //     $set: {
      //       varify: true,
      //     }
      //   }
      //   const updateresult = await categoriesCollection.updateOne(query, updatedDoc);
      //   console.log('verify', updateresult);
      //   res.send(updateresult);
      // }

     
      const verify = {varify: true};
      const notverify = {varify: false};
      console.log('result.varify', result.varify);
      if(result.varify !== true){
      
        return res.send(notverify);
      }
      res.send(verify);
      
    });
    //catgegory product update verify start
    app.get('/vari/:SellerEmail', async (req, res) => {
      const email = req.params.SellerEmail;

      
      const query = { email };
      const result = await usersCollection.findOne(query);
      console.log('SellerEmail ptch', result)
     
     res.send(result);
      
    })
//catgegory product update verify start

    //delete seller start
    app.delete('/sellers/:_id', async (req, res) => {
      const _id = req.params._id;
      const query = { _id: new ObjectId(_id) };
      const result = await usersCollection.deleteOne(query);
      res.send(result);
    })
    //delete seller end
    //delete buyer start
    app.delete('/buyer/:_id', async (req, res) => {
      const _id = req.params._id;
      const query = { _id: new ObjectId(_id) };
      const result = await usersCollection.deleteOne(query);
      res.send(result);
    });
    //delete buyer end

    //mybuyer part start
    app.get('/dashboard/mybuyerfind/:SellerEmail', verifyJWT, async (req, res) => {
      const decoded = req.decoded.email;
      console.log('insidemybuyerfind', decoded.email);
      const SellerEmail = req.params.SellerEmail;
      console.log('sellerEmail', SellerEmail);
      if (SellerEmail !== decoded.email) {
        return res.status(403).send({ message: 'unauthorized access' });
      }
      const query = { SellerEmail };
      const result = await bookingInfoCollection.find(query).toArray();
      res.send(result);
    })
    //mybuyer part end
    app.delete('/mybuyer/:_id', async (req, res) => {
      const _id = req.params._id;
      const query = { _id: new ObjectId(_id) };
      const result = await bookingInfoCollection.deleteOne(query);
      res.send(result);
    });
    app.delete('/myproduct/:_id', async (req, res) => {
      const _id = req.params._id;
      const query = { _id: new ObjectId(_id) };
      const result = await categoriesCollection.deleteOne(query);
      res.send(result);
    });
    //add wishlist start
    app.post('/wishlish', async (req, res) => {
      const wishlish = req.body;

      const result = await WishLishfoCollection.insertOne(wishlish);
      res.send(result);
    })
    //add wishlist end

    //dashboard buyer wishList start
    app.get('/dashboard/wishlist/:buyerEmail', async (req, res) => {
      const buyerEmail = req.params.buyerEmail;
      console.log('buyeremail wishList', buyerEmail);
      const query = { buyerEmail };
      const result = await WishLishfoCollection.find(query).toArray();
      res.send(result);

    })
    //dashboard buyer wishList end
    app.delete('/wishlist/:productID', async (req, res) => {
      const productID = req.params.productID;
      console.log('productId', productID);
      const query = { productID: productID };
      const result = await WishLishfoCollection.deleteOne(query);
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
