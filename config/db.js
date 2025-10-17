import mongoose from 'mongoose';
export const  connectDB = async()=>{
   try {
     const conn = await mongoose.connect(process.env.MONGO_URI);
     console.log(`Database connected Successfully:${conn.connection.host}`)
   } catch (error) {
    console.log(`Database connection Failed:${error}`);
    process.exit(1);
   }
}