@echo off
echo Creating backend folder structure...

REM Create main backend directory
if not exist backend mkdir backend
cd backend

REM Create subdirectories
mkdir config models middleware controllers routes utils 2>nul

REM Create empty files in root
type nul > server.js 2>nul
type nul > package.json 2>nul
type nul > .env 2>nul

REM Create config files
type nul > config\database.js 2>nul

REM Create model files
type nul > models\User.js 2>nul
type nul > models\Student.js 2>nul
type nul > models\Teacher.js 2>nul
type nul > models\Parent.js 2>nul
type nul > models\Grade.js 2>nul
type nul > models\Assignment.js 2>nul
type nul > models\Attendance.js 2>nul
type nul > models\Announcement.js 2>nul

REM Create middleware files
type nul > middleware\auth.js 2>nul
type nul > middleware\roleCheck.js 2>nul

REM Create controller files
type nul > controllers\authController.js 2>nul
type nul > controllers\studentController.js 2>nul
type nul > controllers\teacherController.js 2>nul
type nul > controllers\parentController.js 2>nul
type nul > controllers\adminController.js 2>nul
type nul > controllers\gradeController.js 2>nul
type nul > controllers\assignmentController.js 2>nul
type nul > controllers\attendanceController.js 2>nul
type nul > controllers\announcementController.js 2>nul

REM Create route files
type nul > routes\authRoutes.js 2>nul
type nul > routes\studentRoutes.js 2>nul
type nul > routes\teacherRoutes.js 2>nul
type nul > routes\parentRoutes.js 2>nul
type nul > routes\adminRoutes.js 2>nul
type nul > routes\gradeRoutes.js 2>nul
type nul > routes\assignmentRoutes.js 2>nul
type nul > routes\attendanceRoutes.js 2>nul
type nul > routes\announcementRoutes.js 2>nul

REM Create utils file
type nul > utils\helpers.js 2>nul

echo.
echo Folder structure created successfully!
echo Location: %CD%
echo.
dir /b

cd ..