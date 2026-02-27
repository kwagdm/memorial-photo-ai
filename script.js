document.addEventListener('DOMContentLoaded', () => {
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    const previewContainer = document.getElementById('previewContainer');
    const previewImage = document.getElementById('previewImage');
    const removeBtn = document.getElementById('removeBtn');
    const generateBtn = document.getElementById('generateBtn');

    let selectedFile = null;

    const consentCheckbox = document.getElementById('consentCheckbox');
    
    // [PR5b] Initialize Face API
    let isFaceApiLoaded = false;
    const policyModal = document.getElementById('policyModal');
    const closePolicyModal = document.getElementById('closePolicyModal');
    const policyReasonText = document.getElementById('policyReasonText');

    closePolicyModal.addEventListener('click', () => {
        policyModal.classList.add('hidden');
    });
    async function loadFaceApi() {
        try {
            console.log("Loading Face API models...");
            // [PR5c] CDN usage (No local hosting requested)
            await faceapi.nets.tinyFaceDetector.loadFromUri('https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/');
            await faceapi.nets.faceLandmark68Net.loadFromUri('https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/');
            await faceapi.nets.ageGenderNet.loadFromUri('https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/');
            isFaceApiLoaded = true;
            console.log("Face API models loaded (Detection + Gender)!");
        } catch (error) {
            console.error("Failed to load Face API:", error);
            // Fail-open: Just log error, don't block app
        } finally {
            // [PR5c] Loading State: Re-enable UI
            const btnText = document.querySelector('#generateBtn .btn-text');
            if (btnText && btnText.innerText === 'AI 모델 로딩 중...') {
                 btnText.innerText = '영정사진 생성하기';
            }
            // Note: generateBtn is disabled by default until file is selected & consent checked, 
            // so we don't need to explicitly enable it here, just restore text.
        }
    }

    // [PR5c] Initial Loading State
    const btnText = document.querySelector('#generateBtn .btn-text');
    if (btnText) btnText.innerText = 'AI 모델 로딩 중...';

    // Load models on page load
    loadFaceApi();

    // Handle click to upload
    uploadArea.addEventListener('click', (e) => {
        if (e.target !== removeBtn) {
            fileInput.click();
        }
    });

    // ... (Drag & Drop logic remains same) ...

    // Handle file selection
    fileInput.addEventListener('change', function() {
        handleFiles(this.files);
    });

    function updateGenerateButtonState() {
        if (selectedFile && consentCheckbox.checked) {
            generateBtn.disabled = false;
        } else {
            generateBtn.disabled = true;
        }
    }

    consentCheckbox.addEventListener('change', updateGenerateButtonState);

    function handleFiles(files) {
        if (files.length > 0) {
            const file = files[0];
            
            // Validate file type
            if (!file.type.startsWith('image/')) {
                alert('이미지 파일만 업로드해주세요.');
                return;
            }

            // Validate file size (Min 100KB, Max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                alert('파일 크기는 5MB 이하여야 합니다.');
                return;
            }
            // Validate file size (Max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                alert('파일 크기는 5MB 이하여야 합니다.');
                return;
            }

            // Validate Resolution (Min 512x512)
            const img = new Image();
            img.src = URL.createObjectURL(file);
            img.onload = async function() {
                // 1. Resolution Check
                if (this.width < 512 || this.height < 512) {
                    alert('이미지 해상도가 너무 낮습니다. (최소 512x512 이상 권장)');
                }

                // 2. [PR5b] Face Detection Logic
                // [PR5c] Fail-open: Only run if model loaded successfully
                if (isFaceApiLoaded) {
                    try {
                        // TinyFaceDetector options
                        const detections = await faceapi.detectAllFaces(this, new faceapi.TinyFaceDetectorOptions());
                        
                        // [Phase 9] Face Ratio Policy Check
                        const faceBox = detections[0].box;
                        const faceArea = faceBox.width * faceBox.height;
                        const imageArea = this.width * this.height;
                        const faceRatio = (faceArea / imageArea) * 100;
                        const score = detections[0].score;
                        
                        console.log(`Face Analysis - Count: ${detections.length}, Ratio: ${faceRatio.toFixed(2)}%, Score: ${score.toFixed(2)}`);

                        // 1. Multiple Face Policy
                        if (detections.length > 1) {
                            policyReasonText.innerText = "사진에 여러 명의 인물이 감지되었습니다. 1인 정면 사진만 변환 가능합니다.";
                            policyModal.classList.remove('hidden');
                            resetState();
                            return;
                        }

                        // Threshold: 20% (Unified Policy)
                        if (faceRatio < 20) {
                            policyReasonText.innerText = `얼굴 비중이 ${faceRatio.toFixed(1)}%로, 당사 품질 정책(20% 이상)에 미달합니다.`;
                            policyModal.classList.remove('hidden');
                            resetState();
                            return;
                        }

                        // 3. Clarity Policy
                        if (score < 0.7) {
                            policyReasonText.innerText = "얼굴 인식이 불분명합니다. 더 선명한 사진을 사용해 주세요.";
                            policyModal.classList.remove('hidden');
                            resetState();
                            return;
                        }

                    } catch (err) {
                        console.error("Face detection error:", err);
                        // [PR5c] Fail-open: Algorithm error -> Allow upload
                        console.warn("Skipping face detection due to error (Fail-open).");
                    }
                } else {
                     // [PR5c] Fail-open: Model not loaded -> Allow upload
                     console.warn("Face API not loaded. Skipping detection (Fail-open).");
                }

                URL.revokeObjectURL(this.src);
                // 3. Success -> Proceed
                selectedFile = file; // Store file in variable
                showPreview(file);
                updateGenerateButtonState();
            };

            function resetState() {
                URL.revokeObjectURL(img.src);
                fileInput.value = ''; 
                selectedFile = null;
                previewContainer.classList.add('hidden');
                updateGenerateButtonState();
            }

            // Moved inside img.onload to wait for validation
            // selectedFile = file; 
            // showPreview(file);
            // updateGenerateButtonState();
        }
    }

    function showPreview(file) {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onloadend = function() {
            previewImage.src = reader.result;
            previewContainer.classList.remove('hidden');
        }
    }

    // Handle remove
    removeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        selectedFile = null; // Clear stored file
        fileInput.value = '';
        previewImage.src = '';
        previewContainer.classList.add('hidden');
        updateGenerateButtonState();
    });

    // Handle generate button
    generateBtn.addEventListener('click', async () => {
        if (!selectedFile) {
            alert('사진을 선택해주세요.');
            return;
        }

        if (!consentCheckbox.checked) {
            alert('이용약관 및 개인정보 처리방침에 동의해주세요.');
            return;
        }
        
        if (generateBtn.disabled) return; // Prevent double click

        console.log('Uploading file:', selectedFile.name);
        
        // UI Loading State
        const originalText = generateBtn.querySelector('.btn-text').innerText;
        const btnText = generateBtn.querySelector('.btn-text');
        btnText.innerText = '영정사진 생성 중입니다... (약 10~20초 소요)';
        
        // Add spinner if not exists
        let spinner = generateBtn.querySelector('.spinner');
        if (!spinner) {
            spinner = document.createElement('span');
            spinner.className = 'spinner';
            generateBtn.insertBefore(spinner, btnText);
        }
        
        generateBtn.disabled = true;

        try {
            // First: Upload the file
            const formData = new FormData();
            formData.append('photo', selectedFile);
            
            const uploadResponse = await fetch('/upload', {
                method: 'POST',
                body: formData
            });

            // Handle server-side errors (like size limit)
            if (!uploadResponse.ok) {
                const errorData = await uploadResponse.json();
                throw new Error(errorData.message || '업로드 중 오류가 발생했습니다.');
            }

            const uploadResult = await uploadResponse.json();

            // Second: Analyze Gender (Phase 34)
            const btnText = document.querySelector('#generateBtn .btn-text');
            const originalText = btnText.innerText;
            btnText.innerText = '성별 분석 중...';

            let detectedGender = 'male'; // Default
            try {
                const img = await faceapi.bufferToImage(selectedFile);
                const detection = await faceapi.detectSingleFace(img, new faceapi.TinyFaceDetectorOptions())
                    .withFaceLandmarks()
                    .withAgeAndGender();
                
                if (detection) {
                    detectedGender = detection.gender;
                    console.log(`[Gender Detection] ${detectedGender} (${Math.round(detection.genderProbability * 100)}%)`);
                }
            } catch (err) {
                console.error("Gender detection failed, using default:", err);
            }

            btnText.innerText = 'AI 영정사진 생성 중...';

            // Third: Call generate endpoint
            const genResponse = await fetch('/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    style: 'suit',
                    gender: detectedGender // Pass detected gender
                })
            });

            const genResult = await genResponse.json();

            if (genResult.success) {
                // [DEBUG] Log Raw Model URLs for independent inspection
                if (genResult.debug_info) {
                    console.log('--- [DEBUG] Raw AI Output URLs ---');
                    console.log('Step 1 (Base/75yr) URL:', genResult.debug_info.baseUrl);
                    console.log('Step 2 (Final/80yr) URL:', genResult.debug_info.rawUrl);
                    console.log('---------------------------------');
                }

                // Hide upload view, show result view
                document.getElementById('uploadView').classList.add('hidden');
                document.getElementById('resultView').classList.remove('hidden');
                
                // Show Original Image
                const originalDisplay = document.getElementById('originalImageDisplay');
                originalDisplay.src = URL.createObjectURL(selectedFile);
                
                // Show Generated Image with Cache-Busting (if not Data URI)
                const resultImg = document.getElementById('finalResultImage');
                const timestamp = new Date().getTime();
                
                if (genResult.resultBase64.startsWith('data:')) {
                    // Data URIs are self-contained and don't cache like standard URLs
                    resultImg.src = genResult.resultBase64;
                } else {
                    resultImg.src = `${genResult.resultBase64}?t=${timestamp}`;
                }
                
                // Setup Download Button
                const downloadBtn = document.getElementById('downloadBtn');
                downloadBtn.onclick = () => {
                    const link = document.createElement('a');
                    link.download = 'memorial-photo-ai-result.jpg';
                    link.href = genResult.resultBase64;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                };
                
                // Scroll to result
                document.getElementById('resultView').scrollIntoView({ behavior: 'smooth' });

                // Scroll to result
                document.getElementById('resultView').scrollIntoView({ behavior: 'smooth' });
            } else {
                alert('생성 실패: ' + genResult.message);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('오류가 발생했습니다: ' + error.message);
        } finally {
            // Reset UI
            if (spinner) {
                spinner.remove();
            }
            generateBtn.querySelector('.btn-text').innerText = originalText;
            generateBtn.disabled = false;
        }
    });

    // Handle Reset
    document.getElementById('resetBtn').addEventListener('click', () => {
        // Reset state
        selectedFile = null;
        fileInput.value = '';
        previewImage.src = '';
        previewContainer.classList.add('hidden');
        generateBtn.disabled = true;

        // Switch back to upload view
        document.getElementById('resultView').classList.add('hidden');
        document.getElementById('uploadView').classList.remove('hidden');
    });

    // Download listener is now attached dynamically in successful generation block
});
