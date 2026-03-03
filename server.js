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

// AI Generate endpoint (Advanced Synthesis Pipeline)
app.post('/generate', express.json(), async (req, res) => {
    const style = req.body.style || 'suit'; // 'suit' or 'hanbok'

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

    // 3. Check daily limit (Condition 1: 20 calls/day for development tuning)
    if (usageData.count >= 20) {
        console.warn(`[AI Safety] DAILY LIMIT REACHED (${usageData.count}/20). Request denied.`);
        return res.status(429).json({ 
            success: false, 
            message: '일일 AI 호출 제한(20회)을 초과했습니다. 더 많은 테스트가 필요하시면 말씀해주세요.' 
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
        //             num_steps: 35,
        //             style_strength_ratio: 20,
        //             num_outputs: 1,
        //             guidance_scale: 3.0
        //         }
        //     }
        // );
        
        const { fal } = await import("@fal-ai/client");
        
        // --- GENDER DETECTION & MAPPING ---
        const gender = req.body.gender || 'male';
        const isFemale = gender === 'female';
        const genderTerm = isFemale ? "woman" : "man";
        
        console.log(`[PROCESS] Target Gender: ${gender}`);
        
        // --- STEP 1: FLUX KONTEXT PRO AGING & STYLING (Premium Hair Preservation) ---
        // Goal: Transform original into 80-year-old WHILE PRESERVING unique hairstyle and adding the suit.
        console.log(`[AI STEP 1] Generating Personalized Flux Aging (${genderTerm}, 80 yrs, Preserving Hair)...`);
        
        const fluxPrompt = `A high-resolution, photorealistic memorial portrait of an 80-year-old Korean ${genderTerm}. 
        Natural aged skin and grey hair, preserving the person's unique hairstyle from the photo. 
        Wearing a formal black mourning suit, white shirt, and black tie. 
        Solid dark grey background, 35mm lens, raw photo texture, calm expression, museum quality. 
        NO TEXT, NO WRITING, NO LETTERS, NO CAPTIONS, NO SUBTITLES.`;

        const fluxResult = await fal.subscribe("fal-ai/flux-pro/kontext", {
            input: {
                get_image_url: dataURI, 
                image_url: dataURI, 
                prompt: fluxPrompt,
                guidance_scale: 3.5
            }
        });

        if (!fluxResult.data || !fluxResult.data.images || !fluxResult.data.images[0]) {
            console.error('[AI ERROR] Flux Generation Failed:', JSON.stringify(fluxResult, null, 2));
            throw new Error("Flux Kontext Pro generation failed or structure invalid");
        }

        const agedImageUrl = fluxResult.data.images[0].url;
        console.log(`[AI SUCCESS] Premium Flux Aging Complete: ${agedImageUrl}`);

        // --- STEP 2: BYPASSING RIGID TEMPLATES FOR HAIR VARIETY (Phase 38) ---
        // We now trust Flux Kontext Pro to generate both the aged face and the suit correctly.
        // This preserves the user's unique hairstyle instead of forcing a template's hair.
        const swappedImageUrl = agedImageUrl; 
        console.log(`[PROCESS] Bypassing fixed-hair template to preserve hairstyle variety.`);

        // --- Frame Compositing: Stable original approach ---
        console.log(`[FRAME] Compositing framed portrait (stable hole-based approach)...`);
        const { createCanvas, loadImage } = require('canvas');
        const fetchModule = (await import('node-fetch')).default;

        // Fetch portrait buffer
        let portraitBuffer;
        try {
            const portraitResp = await fetchModule(agedImageUrl);
            portraitBuffer = await portraitResp.buffer();
        } catch (fetchErr) {
            console.error('[FRAME ERROR] Failed to fetch aged portrait:', fetchErr);
            throw new Error("Portrait download failed: " + fetchErr.message);
        }

        let frameImg, portraitImg;
        try {
            frameImg = await loadImage(path.join(__dirname, 'public', 'memorial_frame.jpg'));
            portraitImg = await loadImage(portraitBuffer);
        } catch (loadErr) {
            console.error('[FRAME ERROR] Failed to load assets:', loadErr);
            throw new Error("Canvas asset loading failed");
        }

        const canvas = createCanvas(666, 833);
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // 1. Draw frame (includes ribbon on top)
        ctx.drawImage(frameImg, -179, 0, 1024, 833);

        // 2. Draw portrait in the frame hole area
        const hole = { top: 255, left: 155, width: 345, height: 392 };
        ctx.drawImage(portraitImg, hole.left, hole.top, hole.width, hole.height);

        const framedBase64 = canvas.toDataURL('image/jpeg', 0.95);

        // Raw display base64 (no frame) — reuse the same portrait buffer
        const displayBase64 = `data:image/jpeg;base64,${portraitBuffer.toString('base64')}`;

        usageData.count += 1;
        fs.writeFileSync(usageFilePath, JSON.stringify(usageData));
        
        console.log(`[AI Success] Generation Complete. Usage: ${usageData.count}/20`);
        
        // Respond to client
        // resultBase64 = raw portrait for screen display (full, no frame)
        // framedBase64 = framed portrait for download
        res.json({
            success: true,
            resultBase64: displayBase64,
            framedBase64: framedBase64,
            debug_info: {
                agedUrl: agedImageUrl
            }
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
