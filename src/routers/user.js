const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const User = require('../models/user');
const router = new express.Router();
const auth = require('../middleware/auth.js');
const {
    sendWelcomeEmail,
    sendGoodbyeEmail
} = require('../emails/send-grid.js');

//CRUD pre-operations
//c => create users resource =====> POST
router.post('/users', async (req, res) => {
    try {
        const user = await new User(req.body).save();
        const token = await user.createAuthToken();

        sendWelcomeEmail(user);

        res.status(201).send({
            token,
            user
        });
    } catch (e) {
        res.status(400).send(e);
    }
})

//login route
router.post('/users/login', async (req, res) => {
    try {
        const user = await User.findByCredentials(req.body.email, req.body.password);
        const token = await user.createAuthToken();
        res.send({
            token,
            user
        });
    } catch (e) {
        res.sendStatus(400);
    }
})

//logout route
router.post('/users/logout', auth, async (req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter(token => token.token != req.token);
        await req.user.save();
        res.send();
    } catch (e) {
        res.sendStatus(500);
    }
})

//logout from all sessions route 
router.post('/users/logoutAll', auth, async (req, res) => {
    try {
        req.user.tokens = [];
        await req.user.save();
        res.send();
    } catch (e) {
        res.sendStatus(500);
    }
})

//r => read user profile resource ======> GET
router.get('/users/me', auth, async (req, res) => {
    try {
        res.send(req.user);
    } catch (e) {
        res.sendStatus(500);
    }
})

//r => read one specific user =======> GET
router.get('/users/:id', async (req, res) => {
    const _id = req.params.id;

    try {
        const user = await User.findById(_id);

        if (!user)
            return res.sendStatus(404);

        res.send(user);
    } catch (e) {
        res.send(500);
    }
})

//u => update an individual user info =====> PATCH
router.patch('/users/:id', auth, async (req, res) => {
    const upcomingUpdates = Object.keys(req.body);
    const allowedUpdates = ['name', 'email', 'password', 'age'];
    const isAllowed = upcomingUpdates.every(update => allowedUpdates.includes(update));

    if (!isAllowed)
        return res.status(400).send({
            error: "Invalid user updates!"
        });

    try {
        //changed our code from using findByIdAndUpdate() to this in order to use middleware pre save
        upcomingUpdates.forEach(update => req.user[update] = req.body[update]);
        await req.user.save();

        res.send(req.user);

    } catch (e) {
        //bad request based on schema validatiors
        res.status(400).send(e);
    }
})

//d => delete an individual user ======> DELETE
router.delete('/users/me', auth, async (req, res) => {
    try {
        await req.user.remove();

        sendGoodbyeEmail(req.user);

        res.send(req.user);
    } catch (e) {
        res.sendStatus(500);
    }
})

// image upload endpoint for users
const upload = multer({
    limits: {
        fileSize: 1000000
    },
    fileFilter(req, file, cb) {
        if (!file.originalname.match(/\.(jpg|jpeg|png)/)) {
            return cb(new Error('only image files are allowed'));
        }
        cb(null, true);
    }
});

router.post('/users/me/avatar', auth, upload.single('avatar'), async (req, res) => {
    try {

        const buffer = await sharp(req.file.buffer).resize(250, 250).png().toBuffer();
        req.user.avatar = buffer;
        await req.user.save();
        res.send();

    } catch (e) {
        res.status(400).send({
            error: err.message
        });
    }
})

router.delete('/users/me/avatar', auth, async (req, res) => {
    try {
        req.user.avatar = undefined;
        await req.user.save();

        res.send();
    } catch (e) {
        res.sendStatus(500);
    }
})

router.get('/users/:id/avatar', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user | !user.avatar) {
            throw new Error();
        }

        res.set('Content-Type', 'image/jpg');
        res.send(user.avatar);

    } catch (e) {
        res.sendStatus(404);
    }
})

module.exports = router;