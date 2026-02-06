document.addEventListener('DOMContentLoaded', () => {
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    const previewContainer = document.getElementById('previewContainer');
    const previewImage = document.getElementById('previewImage');
    const removeBtn = document.getElementById('removeBtn');
    const generateBtn = document.getElementById('generateBtn');

    let selectedFile = null;

    // Handle click to upload
    uploadArea.addEventListener('click', (e) => {
        if (e.target !== removeBtn) {
            fileInput.click();
        }
    });

    // Handle drag & drop
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        uploadArea.addEventListener(eventName, highlight, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, unhighlight, false);
    });

    function highlight(e) {
        uploadArea.style.borderColor = 'var(--primary)';
        uploadArea.style.background = 'rgba(0,0,0,0.4)';
    }

    function unhighlight(e) {
        uploadArea.style.borderColor = '';
        uploadArea.style.background = '';
    }

    uploadArea.addEventListener('drop', handleDrop, false);

    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        handleFiles(files);
    }

    // Handle file selection
    fileInput.addEventListener('change', function() {
        handleFiles(this.files);
    });

    function handleFiles(files) {
        if (files.length > 0) {
            const file = files[0];
            
            // Validate file type
            if (!file.type.startsWith('image/')) {
                alert('이미지 파일만 업로드해주세요.');
                return;
            }

            // Validate file size (5MB)
            if (file.size > 5 * 1024 * 1024) {
                alert('파일 크기는 5MB 이하여야 합니다.');
                return;
            }

            selectedFile = file; // Store file in variable
            showPreview(file);
            generateBtn.disabled = false;
        }
    }

    function showPreview(file) {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onloadend = function() {
            previewImage.src = reader.result;
            previewContainer.classList.remove('hidden');
            // Hide the upload text content visually or just layer over it
        }
    }

    // Handle remove
    removeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        selectedFile = null; // Clear stored file
        fileInput.value = '';
        previewImage.src = '';
        previewContainer.classList.add('hidden');
        generateBtn.disabled = true;
    });

    // Handle generate button
    generateBtn.addEventListener('click', async () => {
        if (!selectedFile) {
            alert('사진을 선택해주세요.');
            return;
        }
        
        if (generateBtn.disabled) return; // Prevent double click

        console.log('Uploading file:', selectedFile.name);
        
        // UI Loading State
        const originalText = generateBtn.querySelector('.btn-text').innerText;
        generateBtn.querySelector('.btn-text').innerText = 'AI가 영정사진을 생성 중입니다...';
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
                document.getElementById('finalResultImage').src = genResult.resultUrl;
                
                alert('영정사진 생성이 완료되었습니다!');
            } else {
                alert('생성 실패: ' + genResult.message);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('오류가 발생했습니다: ' + error.message);
        } finally {
            // Reset UI
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

    // Download placeholder logic
    document.getElementById('downloadBtn').addEventListener('click', () => {
        alert('이 기능은 추후 개발 예정입니다.');
    });
});
