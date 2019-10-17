const express = require('express');
const auth = require('../middleware/auth.js');
const Task = require('../models/task');
const router = new express.Router();

//c => create tasks resource =====> POST
router.post('/tasks', auth, async (req, res) => {
    try {
        // const task = await new Task(req.body).save();
        const task = await new Task({
            ...req.body,
            owner: req.user._id
        }).save();
        res.status(201).send(task);
    } catch (e) {
        res.status(400).send(e);
    }
})

//r => read all tasks resource ======> GET 
// /tasks?completed="false"
// /tasks?limit=2&skip=0
// /tasks?sortBy=createdAt:desc
router.get('/tasks', auth, async (req, res) => {
    const match = {};
    const sort = {};

    if (req.query.completed)
        match.completed = req.query.completed == 'true';

    if (req.query.sortBy) {
        const sortBy = req.query.sortBy.split(':');
        sort[sortBy[0]] = sortBy[1] == 'asc' ? 1 : -1;
    }

    try {
        await req.user.populate({
            path: 'tasks',
            match,
            options: {
                limit: parseInt(req.query.limit),
                skip: parseInt(req.query.skip),
                sort
            }
        }).execPopulate();
        res.send(req.user.tasks);
    } catch (e) {
        res.sendStatus(500);
    }
})

//r => read a single task ======> GET
router.get('/tasks/:id', auth, async (req, res) => {
    const _id = req.params.id;

    try {
        const task = await Task.findOne({
            _id,
            owner: req.user._id
        })

        if (!task)
            return res.sendStatus(404);

        res.send(task);
    } catch (e) {
        res.sendStatus(500)
    }
})

//u => update a single task =====> PATCH
router.patch('/tasks/:id', auth, async (req, res) => {
    const upcomingUpdates = Object.keys(req.body);
    const allowedUpdates = ['description', 'completed'];
    const isAllowed = upcomingUpdates.every(update => allowedUpdates.includes(update));

    if (!isAllowed)
        return res.status(400).send({
            error: 'Invalid task updates!'
        });

    try {
        // const task = await Task.findById(req.params.id);
        const task = await Task.findOne({
            _id: req.params.id,
            owner: req.user._id
        })

        if (!task)
            return res.status(404).send();

        upcomingUpdates.forEach(update => task[update] = req.body[update]);
        await task.save();

        res.send(task);

    } catch (e) {
        //validation errors
        res.status(400).send(e);
    }
})

router.delete('/tasks/:id', auth, async (req, res) => {
    try {
        const task = await Task.findOneAndDelete({
            _id: req.params.id,
            owner: req.user._id
        });

        if (!task)
            return res.status(404).send();

        res.send(task);

    } catch (e) {
        res.sendStatus(500);
    }
})

module.exports = router;