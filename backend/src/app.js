import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import adminRoutes from './routes/admin.routes.js';
import authRoutes from './routes/auth.routes.js';
import collegeRoutes from './routes/college.routes.js';
import eventRoutes from './routes/event.routes.js';
import organizerRoutes from './routes/organizer.routes.js';
import userRoutes from './routes/user.routes.js';

const app = express();

app.use(
    cors({
        origin: true,
        credentials: true,
    })
);

app.use(express.json({ limit: '16kb' }));
app.use(express.urlencoded({ extended: true, limit: '16kb' }));
app.use(express.static('public'));
app.use(cookieParser());

app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/colleges', collegeRoutes);
app.use('/api/v1/events', eventRoutes);
app.use('/api/v1/organizers', organizerRoutes);
app.use('/api/v1/users', userRoutes);

export { app };
