import mongoose from 'mongoose';

mongoose.Promise = global.Promise;

mongoose.connection.on('open', () => {
  console.log('MongoDB: Connected');
});

mongoose.connection.on('error', (err) => {
  console.log('MongoDB: Error', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB: Disconnected');
});

// Connect to MongoDB Atlas database using Mongoose ODM
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI as string);
    console.log('Connected to MongoDB Atlas!');
  } catch (error) {
    console.log('Error connecting to MongoDB Atlas!');
    console.error(error);
  }
}

export default connectDB;