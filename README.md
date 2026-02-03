# Memorial Photo AI

Experimental side project using Antigravity to build an AI-powered memorial photo generator.

---

# Progress

- PR1: Initial UI scaffold
- PR2a: Client-side file validation
- PR2b: Server upload (planned)

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
