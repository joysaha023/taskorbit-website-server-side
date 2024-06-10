const express = require('express')
const cors = require('cors');
const jwt = require('jsonwebtoken')
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express()
const port = process.env.PORT || 5000;

//middleware
app.use(cors())
app.use(express.json())


const uri = `mongodb+srv://${process.env.USER_NAME}:${process.env.USER_PASS}@cluster0.mjki1qn.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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
    // await client.connect();

    const userCollection = client.db("taskOrbitDB").collection("userDB")
    const reviewCollection = client.db("taskOrbitDB").collection("reviewDB")
    const addTaskCollection = client.db("taskOrbitDB").collection("addTaskDB")
    const submissionCollection = client.db("taskOrbitDB").collection("submissionDB")


    // jwt implement api
    app.post('/jwt', async(req, res) => {
      const user = req.body
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET_KEY, {expiresIn: '365d'})
      res.send({token})
    })

    //middlewares
    const verifyToken = (req, res, next) => {
      console.log('inside verify token', req.headers);
      next();
    }
    //user data
    app.get('/users', async(req, res) => {
      const workerUser =  userCollection.find({role: 'worker'}).sort({created_at: -1})
      const result = await workerUser.toArray();
      res.send(result)
    })

    app.get('/users/role/:email', async(req, res) => {
      const email = req.params.email;
      const query = {email: email};
      const user = await userCollection.findOne(query)
      res.send(user)
    })

    app.get('/users/user/:email', async(req, res) => {
      const email = req.params.email;
      const query = {email: email};
      const user = await userCollection.findOne(query)
      res.send(user)
    })

    app.post('/users', async (req, res) => {
        const user = req.body;
        // check the email is alredy exists or not
        const query = {email: user.email}
        const existingUser = await userCollection.findOne(query)
        if(existingUser){
            return res.send({message: 'user already exist', insertedId: null})
        }
        const result = await userCollection.insertOne(user)
        res.send(result)
    })
    app.patch('/userRole/:id', async (req, res) => {
      const id  = req.params.id
      const role = req.body
      const query = {_id: new ObjectId(id)}
      const updateDoc = {
        $set: role,
      }
      const result = await userCollection.updateOne(query, updateDoc)
      res.send(result)
    })

    app.delete('/userDelete/:id', async (req, res) => {
      const id = req.params.id;
      const query = {_id: new ObjectId(id)}
      const result = await userCollection.deleteOne(query)
      res.send(result)
    })

    // add task data
    app.get('/task', async (req, res) => {
      const taskItem = addTaskCollection.find().sort({ current_time: -1 })
      const result = await taskItem.toArray();
      res.send(result)
    })
    app.get('/jobdetails/:id', async(req, res) => {
      console.log(req.params);
      const result = await addTaskCollection.findOne({
        _id: new ObjectId(req.params.id)
      });
      res.send(result);
    })
    app.post('/addtask', async (req, res) => {
      const taskData = req.body;
      const result  = await addTaskCollection.insertOne(taskData)
      res.send(result)
    })
    app.put('/updateTask/:id', async(req, res) => {
      console.log(req.params.id)
      const query = { _id: new ObjectId(req.params.id)}
      const options = {upsert: true}
      const updateData = {
        $set: {
          task_detail: req.body.task_detail,
          task_title: req.body.task_title,
          submission_info: req.body.submission_info
        },
      }
      const result = await addTaskCollection.updateOne(query, updateData, options)
      res.send(result)
    })
    app.delete('/delete/:id', async (req, res) => {
      const id = req.params.id;
      const query = {_id: new ObjectId(id)}
      const result = await addTaskCollection.deleteOne(query)
      res.send(result)
    })

    //submission collection 
    app.get('/submitData/:email', async(req, res) => {
      const email = req.params.email
      const  query = {worker_email: email}
      const submitItem = submissionCollection.find(query).sort({ current_date: -1 })
      const result = await submitItem.toArray();
      res.send(result)
    })
    app.get('/reviewData/:email', async(req, res) => {
      const email = req.params.email
      const  query = {creator_email: email}
      const submitItem = submissionCollection.find(query).sort({ current_date: -1 })
      const result = await submitItem.toArray();
      res.send(result)
    })
    app.get('/approveData/:email', async(req, res) => {
      const email = req.params.email
      const  query = {worker_email: email, status: 'Approved'}
      const approveItem = submissionCollection.find(query)
      const result = await approveItem.toArray();
      res.send(result)
    })
    app.post('/submitDetails', async (req, res) => {
      const submitData = req.body;
      const result = await submissionCollection.insertOne(submitData)
      res.send(result)
    })
    app.patch('/updateStatus/:id', async (req, res) => {
      const id  = req.params.id
      const status = req.body
      const query = {_id: new ObjectId(id)}
      const updateDoc = {
        $set: status,
      }
      const result = await submissionCollection.updateOne(query, updateDoc)
      res.send(result)
    })


    //get review data
    app.get('/review', async(req, res) => {
      const result = await reviewCollection.find().toArray();
      res.send(result);
  })


    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    // console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);



app.get('/', (req, res) => {
    res.send('Hello taskorbit')
})

app.listen(port, () => {
    console.log(` app listening on port ${port}`)
})