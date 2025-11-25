const express = require('express');
const multer = require('multer');
const cors = require('cors');
const { NodeSSH } = require('node-ssh');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: __dirname + '/.env' });

const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(express.static(path.join(__dirname, 'public')));
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 80;
const SHARED_PASSWORD = process.env.SHARED_PASSWORD || 'changeme';

const checkAuth = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader || authHeader.split(' ')[1] !== SHARED_PASSWORD) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
};

app.get('/', (req, res) => {
    res.json({ message: 'Image Uploader API', endpoints: ['/health', '/login', '/upload'] });
});

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
    console.log('=== Upload request received ===');
    
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    const localFilePath = req.file.path;
    const originalName = req.file.originalname;
    const safeName = originalName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const remotePath = `/home/${process.env.PI_USER}/Videos/${safeName}`;

    // Create new SSH instance for each request
    const ssh = new NodeSSH();

    try {
        console.log(`File: ${safeName}`);
        console.log(`Target: ${process.env.PI_USER}@${process.env.PI_HOST}:${remotePath}`);
        
        // Decode base64-encoded private key (avoids newline issues in env vars)
        const privateKey = Buffer.from(process.env.PI_PRIVATE_KEY_BASE64, 'base64').toString('utf8');
        console.log(`Private key length: ${privateKey.length} chars`);
        console.log(`Private key starts with: ${privateKey.substring(0, 30)}...`);

        console.log('Connecting via SSH...');
        await ssh.connect({
            host: process.env.PI_HOST,
            username: process.env.PI_USER,
            privateKey: privateKey,
            password: process.env.PI_PASSWORD,
            readyTimeout: 30000,
            debug: (msg) => console.log('SSH DEBUG:', msg)
        });

        console.log('SSH connected! Transferring file...');
        await ssh.putFile(localFilePath, remotePath);
        fs.unlinkSync(localFilePath);

        console.log(`=== Upload successful: ${remotePath} ===`);
        res.json({ success: true, message: 'File sent to Pi successfully' });
    } catch (error) {
        console.error('=== Upload failed ===');
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        if (fs.existsSync(localFilePath)) fs.unlinkSync(localFilePath);
        res.status(500).json({ error: 'Failed to upload to Pi: ' + error.message });
    } finally {
        ssh.dispose();
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});
