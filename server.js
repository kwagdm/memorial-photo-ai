require('dotenv').config();
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 3000;

// Global variable to keep track of the last uploaded file for this session
// In a real app, this should be handled via session or passed in the request
let lastUploadedFile = null;

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
        const uniqueName = Date.now() + '-' + file.originalname;
        lastUploadedFile = uniqueName;
        cb(null, uniqueName);
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Serve static files
app.use(express.static('.'));
app.use('/public', express.static('public'));

// AI Generate endpoint (Real API Integration)
app.post('/generate', async (req, res) => {
    const today = new Date().toISOString().split('T')[0];
    const usageFilePath = path.join(__dirname, 'usage_log.json');
    
    // 1. Check if AI is enabled
    if (process.env.ENABLE_AI !== 'true') {
        console.log('[AI Safety] AI generation is currently DISABLED via .env');
        return res.status(503).json({ success: false, message: 'AI 기능이 현재 비활성화되어 있습니다.' });
    }

    console.log(`[AI Request] ${new Date().toLocaleString()} - AI generation requested.`);

    // 2. Load/Initialize usage log
    let usageData = { date: today, count: 0 };
    if (fs.existsSync(usageFilePath)) {
        try {
            const fileData = JSON.parse(fs.readFileSync(usageFilePath));
            if (fileData.date === today) {
                usageData = fileData;
            }
        } catch (e) {
            console.error('[AI Safety] Error reading usage log, resetting...', e);
        }
    }

    // 3. Check daily limit (Condition 1: 2 calls/day)
    if (usageData.count >= 2) {
        console.warn(`[AI Safety] DAILY LIMIT REACHED (${usageData.count}/2). Request denied.`);
        return res.status(429).json({ 
            success: false, 
            message: '일일 AI 호출 제한(2회)을 초과했습니다. 내일 다시 시도해주세요.' 
        });
    }

    // [IMPORTANT] GEMINI_API_KEY check moved here to ensure we can handle cleanup if this fails
    const geminiApiKey = process.env.GEMINI_API_KEY;

    if (!lastUploadedFile) {
        return res.status(400).json({ success: false, message: '먼저 사진을 업로드해주세요.' });
    }

    try {
        const imagePath = path.join(__dirname, 'uploads', lastUploadedFile);
        if (!fs.existsSync(imagePath)) {
            throw new Error('업로드된 파일을 찾을 수 없습니다.');
        }

        // [REPLICATE] Check API token
        const replicateToken = process.env.REPLICATE_API_TOKEN;
        if (!replicateToken) {
            throw new Error('.env 파일에 REPLICATE_API_TOKEN을 설정해주세요.');
        }

        // Korean Memorial Portrait optimized prompt
        const prompt = "A highly detailed, photorealistic black and white memorial portrait photograph of a dignified Korean elderly person, wearing traditional high-quality hanbok with intricate silk patterns, professional studio lighting with soft shadows, plain neutral grey background, sharp focus on facial features, respectful and calm expression, 8k resolution, professional photography, cinematic quality";

        const Replicate = (await import('replicate')).default;
        const replicate = new Replicate({ auth: replicateToken });
        
        console.log(`[AI API] Calling Replicate FLUX Pro (High Quality)`);
        console.log(`[AI API] Current Usage: ${usageData.count + 1}/2`);
        
        const output = await replicate.run(
            "black-forest-labs/flux-1.1-pro",
            {
                input: {
                    prompt: prompt,
                    aspect_ratio: "1:1",
                    output_format: "jpg",
                    output_quality: 95,
                    safety_tolerance: 2,
                    prompt_upsampling: true
                }
            }
        );

        if (!output || !output.toString()) {
            throw new Error('이미지 데이터를 생성하지 못했습니다.');
        }

        // Replicate returns a URL, we need to fetch and convert to base64
        const fetch = (await import('node-fetch')).default;
        const imageUrl = output.toString();
        const imageResponse = await fetch(imageUrl);
        const imageBuffer = await imageResponse.buffer();
        const base64ImageOutput = imageBuffer.toString('base64');

        // [Privacy] 디스크에 저장하지 않고 바로 메모리의 Base64 전달
        usageData.count += 1;
        fs.writeFileSync(usageFilePath, JSON.stringify(usageData));
        
        console.log(`[AI Success] Replicate FLUX Generation complete. Zero-Retention applied. Usage updated: ${usageData.count}/2`);

        res.json({ 
            success: true, 
            resultBase64: `data:image/jpeg;base64,${base64ImageOutput}`
        });

    } catch (error) {
        console.error('[CRITICAL AI ERROR]', error);
        res.status(500).json({ 
            success: false, 
            message: 'AI 연결 중 오류가 발생했습니다: ' + error.message 
        });
    } finally {
        // [Zero-Retention] 성공/실패 상관없이 무조건 원본 파일 삭제
        if (lastUploadedFile) {
            try {
                const imagePath = path.join(__dirname, 'uploads', lastUploadedFile);
                if (fs.existsSync(imagePath)) {
                    fs.unlinkSync(imagePath);
                    console.log(`[Privacy] Final Cleanup: Deleted file ${lastUploadedFile}`);
                }
                lastUploadedFile = null;
            } catch (unlinkErr) {
                console.error('[Privacy] Final Cleanup failed:', unlinkErr);
            }
        }
    }
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
