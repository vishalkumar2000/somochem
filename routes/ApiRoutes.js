const express = require('express');
const { addUser, getUserByID, getAlluser, updateUserByID, deleteUserByID, uploadFile } = require('../controller/users');
const router = express.Router();
const multer = require('multer');

// Multer configuration for file uploads
const upload = multer({ dest: 'uploads/' });
// Get all users
router.get('/allusers',getAlluser)
router.get('/user/:id?', getUserByID);
router.post('/adduser',addUser)
router.put('/updateuser/:id?',updateUserByID)
router.delete('/deleteuser/:id?',deleteUserByID)
router.post('/uploadxmls', upload.single('xmlFile'), uploadFile);

module.exports = router;
