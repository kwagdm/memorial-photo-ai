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
    async function loadFaceApi() {
        try {
            console.log("Loading Face API models...");
            // [PR5c] CDN usage (No local hosting requested)
            await faceapi.nets.tinyFaceDetector.loadFromUri('https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/');
            isFaceApiLoaded = true;
            console.log("Face API models loaded!");
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
                        
                        // [PR5c] Soft Block Fallback
                        if (detections.length === 0) {
                            const userConfirmed = confirm(
                                "⚠️ AI가 얼굴을 찾지 못했습니다.\n\n" +
                                "사진 속 인물이 너무 작거나, 옆모습이거나, 흐릿할 수 있습니다.\n" +
                                "그래도 진행하시겠습니까?\n\n" +
                                "(※ 얼굴이 없는 사진은 엉뚱한 결과가 나올 수 있습니다)"
                            );

                            if (!userConfirmed) {
                                URL.revokeObjectURL(this.src);
                                fileInput.value = ''; 
                                selectedFile = null;
                                previewContainer.classList.add('hidden');
                                updateGenerateButtonState();
                                return; 
                            }
                            // User confirmed -> Allow pass-through
                        } else {
                            console.log(`Face detection result: ${detections.length} faces found.`);
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

            // Second: Call generate endpoint (Mock AI)
            const genResponse = await fetch('/generate', {
                method: 'POST'
            });
            const genResult = await genResponse.json();

            if (genResult.success) {
                // Hide upload view, show result view
                document.getElementById('uploadView').classList.add('hidden');
                document.getElementById('resultView').classList.remove('hidden');
                
                // Show Original Image
                const originalDisplay = document.getElementById('originalImageDisplay');
                originalDisplay.src = URL.createObjectURL(selectedFile);
                
                // Show Generated Image
                const resultImg = document.getElementById('finalResultImage');
                resultImg.src = genResult.resultBase64;
                
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
