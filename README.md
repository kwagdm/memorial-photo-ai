# Memorial Photo AI

Experimental side project using Antigravity to build an AI-powered memorial photo generator.

---

# Progress

- PR1: Initial UI scaffold
- PR2a: Client-side file validation
- PR2b: Server-side file upload handling

---

# PR Log

## PR1 – Initial UI Scaffold

### Objective
Create the basic photo upload UI.

### Implemented
- Photo upload button
- Drag & drop area
- Image preview
- Remove image option

### Why
To establish the base UI before adding logic or server communication.

### Next Step
Add client-side validation.

---

## PR2a – Client-side File Validation

### Objective
Implement client-side validation before server upload.

### Implemented
- 5MB file size limit  
- JPG/PNG type restriction  
- Error message for invalid files  
- Store selected file in state for future API usage  

### Why
To prevent bad user experience and unnecessary server load.

### Next Step
PR2b will connect file upload to server storage.

---

## PR2b – Server Upload Handling

### Objective
Enable actual file transmission from client to server.

### Implemented
- **Backend**: Node.js Express server + Multer (`server.js`)
- **Frontend**: Fetch API logic to send `FormData` (`script.js`)
- **Storage**: Files saved to local `uploads/` directory
- **UX**: Loading state ("업로드 중...") and success/failure alerts

### Why
To prepare the image on the server for subsequent AI processing.

### Next Step
PR3 will integrate the AI API to process the uploaded image.
