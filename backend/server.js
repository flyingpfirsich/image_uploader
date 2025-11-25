
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const { NodeSSH } = require('node-ssh');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: __dirname + '/.env' });

const app = express();
const upload = multer({ dest: 'uploads/' });
const ssh = new NodeSSH();

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 80;
console.log('PORT configured as:', PORT);
console.log('process.env.PORT is:', process.env.PORT);
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
        
        // Handle private key - sanitize and normalize format
        let privateKey;
        if (process.env.PI_PRIVATE_KEY) {
            privateKey = process.env.PI_PRIVATE_KEY
                // Replace literal \n with actual newlines (if escaped)
                .replace(/\\n/g, '\n')
                // Normalize Windows line endings
                .replace(/\r\n/g, '\n')
                .replace(/\r/g, '\n')
                // Remove any surrounding quotes that might have been added
                .replace(/^['"]|['"]$/g, '')
                .trim();
            
            // Debug: Log key info (not the actual key content for security)
            console.log('Private key starts with:', privateKey.substring(0, 40));
            console.log('Private key ends with:', privateKey.substring(privateKey.length - 40));
            console.log('Private key length:', privateKey.length);
            console.log('Private key has proper header:', privateKey.includes('-----BEGIN'));
            console.log('Private key has proper footer:', privateKey.includes('-----END'));
        } else if (process.env.PI_KEY_PATH) {
            privateKey = fs.readFileSync(process.env.PI_KEY_PATH, 'utf8');
        }
        
        await ssh.connect({
            host: process.env.PI_HOST,
            username: process.env.PI_USER,
            privateKey: privateKey,
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

app.listen(PORT, '0.0.0.0', () => {
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

// Handle SPA client-side routing - disabled for now due to path-to-regexp compatibility
// app.get('/*', (req, res) => {
//     res.sendFile(path.join(__dirname, 'public', 'index.html'));
// });

