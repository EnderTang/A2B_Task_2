require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { sequelize } = require('./src/config/database');
const authRoutes = require('./src/routes/authRoutes'); // Ensure this file exists
const userRoutes = require('./src/routes/userRoutes'); // Ensure this file exists
const accountRoutes = require('./src/routes/accountRoutes'); // Ensure this file exists
const errorHandler = require('./src/middleware/errorHandler'); // Ensure this file exists
const authMiddleware = require('./src/middleware/auth'); // Ensure this file exists
const apiLogger = require('./src/middleware/apiLogger');
const bcrypt = require('bcrypt');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.use(apiLogger);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', authMiddleware, userRoutes);
app.use('/api/accounts', authMiddleware, accountRoutes);

// Error handling
app.use(errorHandler);

// Catch-all route for API 404s
app.use('/api/*', (req, res) => {
  res.status(404).json({ message: 'API endpoint not found' });
});

const PORT = process.env.PORT || 3000;

// Database connection and server start
sequelize.sync().then(() => {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
});

// Serve login page for root route
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/login.html');
});

app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        // Get user from database
        const user = await sequelize.query(
            'SELECT * FROM users WHERE username = ?',
            {
                replacements: [username],
                type: sequelize.QueryTypes.SELECT
            }
        );

        if (!user || user.length === 0) {
            return res.status(401).json({ message: 'Invalid username or password' });
        }

        // Simple password check
        if (user[0].password !== password) {
            return res.status(401).json({ message: 'Invalid username or password' });
        }

        // Set user session
        req.session.user = {
            id: user[0].id,
            username: user[0].username
        };

        res.json({ message: 'Login successful' });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});