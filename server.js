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
        
        // --- STEP 1: RAW BASELINE SYNTHESIS (Clean & Plain) ---
        const gender = req.body.gender || 'male';
        const isFemale = gender === 'female';
        const genderTerm = isFemale ? "woman" : "man";
        
        console.log(`[PROCESS] Target Gender: ${gender}`);

        // --- STEP 1: IDENTITY-PRESERVING BASE SYNTHESIS ---
        // Goal: Professional photographic baseline with zero artistic artifacts.
        console.log(`[AI STEP 1] Generating Raw Baseline (${genderTerm}, 70-75 yrs, CFG 3.0)...`);
        
        const basePrompt = (style === 'hanbok')
            ? `A plain studio portrait of a dignified Korean ${genderTerm}, age 70-75, wearing traditional formal Hanbok, soft natural lighting, neutral grey background, realistic plain skin texture, soft aged features, un-edited photograph`
            : `A professional, high-resolution studio portrait of a Korean ${genderTerm}, age 70, focusing on a calm and solemn expression. 35mm lens, f/8, raw photography texture, solid dark grey background, soft Rembrandt lighting. Wearing a formal black mourning attire.`;

        const negativePrompt = "red circle, rising sun, frame, ribbon, border, illustration, painting, 3d render, anime, cartoon, sketch, smooth skin, plastic texture, glowing skin, vibrant colors, young, middle-aged, black hair, blurry, digital art, makeup, artificial lighting, distorted face.";

        const baseResult = await fal.subscribe("fal-ai/instantid", {
            input: {
                face_image_url: dataURI,
                prompt: basePrompt,
                negative_prompt: negativePrompt,
                ip_adapter_scale: 0.6,
                controlnet_conditioning_scale: 0.4,
                num_inference_steps: 30,
                guidance_scale: 3.0 // Maintained at 3.0 for color stability
            }
        });

        const baseImageUrl = baseResult.data.image ? baseResult.data.image.url : baseResult.data.images[0].url;
        console.log(`[AI SUCCESS] Raw Base Synthesis Complete: ${baseImageUrl}`);

        // --- STEP 2: PERSON-FOCUSED AGING TRANSFORMATION (Age 80) ---
        // Goal: High-fidelity aging in a pure photographic space, focusing entirely on the person.
        console.log(`[AI STEP 2] Person-Focused Refinement (${genderTerm}, Denoise 0.50, CFG 3.0)...`);
        
        const refinePrompt = `A professional portrait of an 80-year-old elderly Korean ${genderTerm}, deep wrinkles, sagging skin, white hair, 35mm lens, raw photo texture, solid dark grey background.`;

        const refineResult = await fal.subscribe("fal-ai/fast-sdxl/image-to-image", {
            input: {
                image_url: baseImageUrl,
                prompt: refinePrompt,
                negative_prompt: negativePrompt,
                strength: 0.50, // Fixed for Stability (Phase 28)
                num_inference_steps: 30, 
                guidance_scale: 3.0 // Fixed for Stability (Phase 28)
            }
        });

        const finalResult = refineResult.data.image ? refineResult.data.image : refineResult.data.images[0];
        if (!finalResult) throw new Error("Raw aging refinement failed");

        const agedImageUrl = finalResult.url;
        console.log(`[AI SUCCESS] Raw Aging Complete. Proceeding to Hybrid Rendering...`);

        // --- STEP 3: FACE SWAP ONTO GENDER-SPECIFIC SUIT TEMPLATE ---
        // Goal: Ensure the suit and background are museum-quality by swapping the aged face onto a template.
        console.log(`[AI STEP 3] Face-Swapping onto ${genderTerm} Suit Template...`);
        const templateFilename = isFemale ? 'memorial_template_female.png' : 'memorial_template.png';
        const templatePath = path.join(__dirname, templateFilename);
        const templateBuffer = fs.readFileSync(templatePath);
        const templateBase64 = "data:image/png;base64," + templateBuffer.toString('base64');

        const swapResult = await fal.subscribe("fal-ai/face-swap", {
            input: {
                base_image_url: templateBase64,
                swap_image_url: agedImageUrl
            }
        });

        if (!swapResult.data || !swapResult.data.image) {
             console.error('[AI ERROR] Face Swap Failed Structure:', JSON.stringify(swapResult, null, 2));
             throw new Error("Face swap response structure invalid");
        }

        const swappedImageUrl = swapResult.data.image.url;
        console.log(`[AI SUCCESS] Face Swap Complete: ${swappedImageUrl}`);

        // --- STEP 4: CANVAS COMPOSITE (WOODEN FRAME + RIBBONS) ---
        // Goal: Automated assembly of the final memorial photo for printing.
        console.log(`[HYBRID STEP 4] Compositing Final Framed Portrait (Phase 28 Stable Version)...`);
        const { createCanvas, loadImage } = require('canvas');
        
        let frameImg, portraitImg;
        try {
            // Load Assets
            frameImg = await loadImage(path.join(__dirname, 'public', 'memorial_frame.jpg'));
            const fetch = (await import('node-fetch')).default;
            const portraitResp = await fetch(swappedImageUrl);
            const portraitBuffer = await portraitResp.buffer();
            portraitImg = await loadImage(portraitBuffer);
        } catch (loadErr) {
            console.error('[HYBRID ERROR] Failed to load assets for canvas:', loadErr);
            throw new Error("Canvas asset loading failed");
        }

        // Create High-Res Canvas (Cropped to 4:5 Portrait Ratio: 666x833)
        // This removes the excessive white background from the sides of the original asset.
        const canvas = createCanvas(666, 833);
        const ctx = canvas.getContext('2d');

        // 1. Draw Frame Asset with Offset (Crop sides)
        // Source center is ~512. We take 666 wide, so x starts at 512 - 333 = 179
        // Original asset: 1024x833.
        ctx.drawImage(frameImg, -179, 0, 1024, 833);

        // 2. Draw Portrait in the Centered Hole Area (Phase 31 Stable Baseline)
        // Reverted to the proven stable size and position for maximum facial clarity.
        const hole = { top: 255, left: 155, width: 345, height: 392 };
        
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(portraitImg, hole.left, hole.top, hole.width, hole.height);

        const finalBase64 = canvas.toDataURL('image/jpeg', 0.95);
        
        usageData.count += 1;
        fs.writeFileSync(usageFilePath, JSON.stringify(usageData));
        
        console.log(`[AI Success] Hybrid Portrait Composite Complete. Usage: ${usageData.count}/20`);
        
        // Respond to client
        res.json({
            success: true,
            resultBase64: finalBase64,
            debug_info: {
                swappedUrl: swappedImageUrl,
                agedUrl: agedImageUrl,
                baseUrl: baseImageUrl
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
