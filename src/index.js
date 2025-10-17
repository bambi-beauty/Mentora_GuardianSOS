import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import fs from 'fs';
import cron from 'node-cron';
import { connectDB } from '../config/db.js';

import userRoute from '../routes/userRoute.js';
import locationRoute from '../routes/locationRoute.js';
import myConsRoute from '../routes/myConsRoute.js';
import userImageRoutes from '../routes/userImageRoute.js';
import chatRoute from '../routes/chatRoute.js';
import postRoute from '../routes/postRoute.js';
import feedbackRoute from '../routes/feedbackRoute.js';
import incidentRoute from '../routes/incidentRoute.js';
import groupRoute from '../routes/groupRoute.js';
import { aiAdminReviewIncident } from '../services/aiAdminService.js';
import Incident from '../model/incidentModel.js';

dotenv.config();

const PORT = process.env.PORT || 3000;
const app = express();

// ✅ Create HTTP server and initialize Socket.IO
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*', // change to your frontend URL in production
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});

const uploadsDir = path.resolve('uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
  console.log('📁 Created uploads directory at', uploadsDir);
}

app.use(express.json());
app.use(cors());
app.use(helmet());
app.use('/uploads', express.static(uploadsDir));

// ✅ Middleware to attach io to every request
app.use((req, res, next) => {
  req.io = io;
  next();
});

// ✅ Routes
app.use('/api/auth', userRoute);
app.use('/api/auth', locationRoute);
app.use('/api/contacts', myConsRoute);
app.use('/api', userImageRoutes);
app.use('/api', chatRoute);
app.use('/api/posts', postRoute);
app.use('/api/feedback', feedbackRoute);
app.use('/api/incidents', incidentRoute);
app.use('/api/groups',groupRoute)

// ✅ Global Error Handler
app.use((err, req, res, next) => {
  console.error('Global error handler:', err.stack);
  res.status(500).json({ message: err.message || 'Something went wrong!' });
});

// ✅ Socket.IO event handling
io.on('connection', (socket) => {
  console.log(`🔌 User connected: ${socket.id}`);

  socket.on('disconnect', () => {
    console.log(`❌ User disconnected: ${socket.id}`);
  });
});

// ✅ Server start
const startServer = async () => {
  try {
    await connectDB();

    server.listen(PORT, () => {
      console.log(`✅ Server running on http://localhost:${PORT}`);
    });

    cron.schedule('0 */12 * * *', async () => {
      console.log('🤖 Running AI Admin review cycle...');
      try {
        const incidents = await Incident.find({ aiVerified: false });
        console.log(`Found ${incidents.length} incidents for AI review`);
        for (const incident of incidents) {
          await aiAdminReviewIncident(incident._id);
        }
        console.log('✅ AI Admin review cycle complete.');
      } catch (err) {
        console.error('❌ AI Admin review failed:', err.message);
      }
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
