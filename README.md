# Memorial Photo AI

Experimental side project using Antigravity.

## Progress
- PR1: Initial UI implementation (photo upload screen only)

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
