import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import userRouter from './routes/user.route.js';
import authRouter from './routes/auth.route.js';
import listingRouter from './routes/listing.route.js';
import cookieParser from 'cookie-parser';
import path from 'path';
import Razorpay from 'razorpay';
import { createHmac } from 'crypto';

dotenv.config();

//const mongoURI = 'mongodb+srv://binarywaveeyes:E733EsrYwhBvM741@test-project.s4jb5.mongodb.net/?retryWrites=true&w=majority&appName=test-projectmongodb://127.0.0.1:27017/merndatabase';
const mongoURI = 'mongodb://127.0.0.1:27017/merndatabase1';
//const mongoURI = 'mongodb+srv://sahithikandimalla:Sahithi05@cluster0.5rflcms.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
mongoose
  .connect(mongoURI)
  .then(() => {
    console.log('Connected to MongoDB!');
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err.message, err.stack);
    process.exit(1); // Exit if connection fails
  });

const __dirname = path.resolve();
const app = express();

app.use(express.json());
app.use(cookieParser());


app.listen(3000, () => {
  console.log('Server is running on port 3000!');
});

app.use('/api/user', userRouter);
app.use('/api/auth', authRouter);
app.use('/api/listing', listingRouter);

app.post('/api/order', async (req, res) => {
  try {

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID ||"rzp_test_qKDmABQedmUB76",
      key_secret: process.env.RAZORPAY_SECRET||"jXbUWBv09yogYBJKYEVlzfdU",
    });

    const options = {
      amount: req.body.amount,
      currency: req.body.currency,
      receipt: req.body.receipt,
    };


    const order = await razorpay.orders.create(options);
    

    if (!order) {
      return res.status(500).json({ message: 'Order creation failed' });
    }

    res.json(order);
  } catch (err) {
    console.error('Error in /api/order:', err.message, err.stack);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

app.post('/api/order/validate', async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;


    // const sha = createHmac('sha256', process.env.RAZORPAY_SECRET|"jXbUWBv09yogYBJKYEVlzfdU");
    // sha.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    // const digest = sha.digest('hex');

    // if (digest !== razorpay_signature) {
    //   return res.status(400).json({ msg: 'Transaction is not legit!' });
    // }

    res.json({
      msg: 'success',
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
    });
  } catch (err) {
    console.error('Validation error:', err);
    res.status(500).json({ message: 'Validation error12', error: err.message });

  }
});

app.use(express.static(path.join(__dirname, '/client/dist')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client', 'dist', 'index.html'));
});

app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  return res.status(statusCode).json({
    success: false,
    statusCode,
    message,
  });
});