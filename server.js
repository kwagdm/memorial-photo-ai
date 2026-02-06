const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 3000;

// Enable CORS
app.use(cors());

// Configure storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = 'uploads';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir);
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Serve static files
app.use(express.static('.'));
app.use('/public', express.static('public'));

// Mock AI Generate endpoint
app.post('/generate', (req, res) => {
    console.log('Mock AI generation requested...');
    // Simulate processing time (4 seconds)
    setTimeout(() => {
        console.log('Mock generation complete.');
        res.json({ 
            success: true, 
            resultUrl: '/public/sample-result.jpg' 
        });
    }, 4000);
});

// Upload endpoint
app.post('/upload', upload.single('photo'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    console.log('File uploaded:', req.file.filename);
    res.json({ success: true, filename: req.file.filename });
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
