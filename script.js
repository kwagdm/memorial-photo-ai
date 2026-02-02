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
    generateBtn.addEventListener('click', () => {
        if (!selectedFile) return;
        console.log('Generate Memorial Photo Clicked', selectedFile);
        // Future logic goes here
    });
});
