
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const { NodeSSH } = require('node-ssh');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const upload = multer({ dest: 'uploads/' });
const ssh = new NodeSSH();

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 80;
const SHARED_PASSWORD = process.env.SHARED_PASSWORD || 'changeme';

// Middleware for simple auth
const checkAuth = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    // Expecting "Bearer <password>"
    if (!authHeader || authHeader.split(' ')[1] !== SHARED_PASSWORD) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
};

app.get('/health', (req, res) => {
    res.json({ status: 'ok', uptime: process.uptime() });
});

app.post('/login', (req, res) => {
    const { password } = req.body;
    if (password === SHARED_PASSWORD) {
        res.json({ success: true, token: password });
    } else {
        res.status(401).json({ error: 'Invalid password' });
    }
});

app.post('/upload', checkAuth, upload.single('image'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    const localFilePath = req.file.path;
    const originalName = req.file.originalname;
    // Sanitize filename to prevent command injection or weird path issues on remote
    const safeName = originalName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const remotePath = `/home/${process.env.PI_USER}/Videos/${safeName}`;

    try {
        console.log(`Connecting to Pi at ${process.env.PI_HOST}...`);
        
        await ssh.connect({
            host: process.env.PI_HOST,
            username: process.env.PI_USER,
            // Priority: 1. Key String, 2. Key Path, 3. Password
            privateKey: process.env.PI_PRIVATE_KEY || (process.env.PI_KEY_PATH ? fs.readFileSync(process.env.PI_KEY_PATH, 'utf8') : undefined),
            password: process.env.PI_PASSWORD // fallback
        });

        console.log('Connected. Uploading file...');
        await ssh.putFile(localFilePath, remotePath);
        console.log(`File uploaded to ${remotePath}`);

        // Cleanup local file
        fs.unlinkSync(localFilePath);

        res.json({ success: true, message: 'File sent to Pi successfully' });
    } catch (error) {
        console.error('Upload failed:', error);
        // Try to cleanup even if upload failed
        if (fs.existsSync(localFilePath)) fs.unlinkSync(localFilePath);
        
        res.status(500).json({ error: 'Failed to upload to Pi: ' + error.message });
    } finally {
        ssh.dispose();
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log('Current directory:', __dirname);
    const publicPath = path.join(__dirname, 'public');
    console.log('Public directory:', publicPath);
    if (fs.existsSync(publicPath)) {
        console.log('Public directory contents:', fs.readdirSync(publicPath));
    } else {
        console.log('Public directory does not exist!');
    }
});

// Handle SPA client-side routing
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

