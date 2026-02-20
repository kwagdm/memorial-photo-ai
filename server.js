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


    if (!lastUploadedFile) {
        return res.status(400).json({ success: false, message: '먼저 사진을 업로드해주세요.' });
    }

    try {
        const imagePath = path.join(__dirname, 'uploads', lastUploadedFile);
        if (!fs.existsSync(imagePath)) {
            throw new Error('업로드된 파일을 찾을 수 없습니다.');
        }

        // [AI Config] Load API tokens
        const replicateToken = process.env.REPLICATE_API_TOKEN;
        const falKey = process.env.FAL_KEY;

        if (!falKey) {
            throw new Error('.env 파일에 FAL_KEY를 설정해주세요.');
        }

        console.log(`[AI API] Processing file: ${imagePath}`);
        
        // Convert uploaded image to data URI
        const fileBuffer = fs.readFileSync(imagePath);
        const mimeType = lastUploadedFile.endsWith('.png') ? 'image/png' : 'image/jpeg';
        const base64Image = fileBuffer.toString('base64');
        const dataURI = `data:${mimeType};base64,${base64Image}`;

        /* --- Replicate (Rollback Support) --- */
        const Replicate = (await import('replicate')).default;
        const replicate = new Replicate({ auth: replicateToken });
        
        // --- PHOTOMAKER (Legacy/Reference) ---
        // const output = await replicate.run(
        //     "tencentarc/photomaker:ddfc2b08d209f9fa8c1eca692712918bd449f695dabb4a958da31802a9570fe4",
        //     {
        //         input: {
        //             input_image: dataURI, 
        //             prompt: "...",
        //             negative_prompt: "...",
        //             num_steps: 50,
        //             style_strength_ratio: 20,
        //             num_outputs: 1,
        //             guidance_scale: 5
        //         }
        //     }
        // );
        
        // --- FAL.AI INSTANT-ID (Identity Preservation Solved) ---
        // Using fal-ai/instantid for fast, identity-preserving generation
        // Documentation: https://fal.ai/models/fal-ai/instantid
        console.log(`[AI API] Calling Fal.ai (fal-ai/instantid)...`);

        // Fal.ai client initialization
        const fal = await import("@fal-ai/serverless-client");
        
        // Fal.ai expects 'image_url' (supports data URI)
        const result = await fal.subscribe("fal-ai/instantid", {
            input: {
                face_image_url: dataURI, // Corrected parameter name
                prompt: "A professional black and white memorial portrait photograph of an 80-year-old Korean man, elderly person with natural aging, subtle wrinkles, gray hair, dignified solemn expression, wearing formal dark suit, studio lighting with soft shadows, plain neutral grey background, photorealistic, high quality, 8k, highly detailed",
                negative_prompt: "young, teenager, child, smoothing, cartoon, extra limbs, distorted eyes, blurry, low quality",
                ip_adapter_scale: 0.8, // Identity strength
                controlnet_conditioning_scale: 0.8
            },
            logs: true,
            onQueueUpdate: (update) => {
                if (update.status === "IN_PROGRESS") {
                    update.logs.map((log) => log.message).forEach(console.log);
                }
            },
        });

        console.log("[AI API] Fal.ai Output received:", result);

        // Fal.ai returns: { image: { url: "..." } } for this endpoint
        let imageUrl = null;
        if (result && result.image && result.image.url) {
            imageUrl = result.image.url;
        } else if (result && result.images && result.images[0] && result.images[0].url) {
             imageUrl = result.images[0].url; // Fallback
        } else {
            throw new Error("AI 응답에 이미지 URL이 없습니다. Response: " + JSON.stringify(result));
        }

        // Fetch result for proxying (Privacy: Zero Retention)
        const fetch = (await import('node-fetch')).default;
        const imageResponse = await fetch(imageUrl);
        const imageBuffer = await imageResponse.buffer();
        const base64ImageOutput = imageBuffer.toString('base64');
        
        usageData.count += 1;
        fs.writeFileSync(usageFilePath, JSON.stringify(usageData));
        
        console.log(`[AI Success] Fal.ai InstantID Generation complete. Zero-Retention applied. Usage updated: ${usageData.count}/2`);
        
        // Respond to client with Base64 as before
        res.json({
            success: true,
            resultBase64: `data:image/jpeg;base64,${base64ImageOutput}`
        });

    } catch (error) {
        console.error('[CRITICAL AI ERROR]', JSON.stringify(error, null, 2));
        if (error.body && error.body.detail) {
             console.error('[AI ERROR DETAIL]', JSON.stringify(error.body.detail, null, 2));
        }
        res.status(500).json({ 
            success: false, 
            message: 'AI 연결 중 오류가 발생했습니다: ' + (error.message || 'Unknown Error') 
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
