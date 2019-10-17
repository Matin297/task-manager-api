const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Task = require('./task');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        unique: true,
        required: true,
        trim: true,
        lowercase: true,
        validate(value) {
            if (!validator.isEmail(value)) throw new Error('Invalid E-mail!')
        }
    },
    password: {
        type: String,
        trim: true,
        required: true,
        minlength: 6,
        validate(value) {
            if (value.toLowerCase().includes('password')) throw new Error('your password cannot contain the word "password"')
        }
    },
    age: {
        type: Number,
        default: 0,
        validate(value) {
            if (value < 0) throw new Error('Age cannot be negative');
        }
    },
    avatar: {
        type: Buffer
    },
    tokens: [{
        token: {
            type: String,
            required: true
        }
    }]
}, {
    timestamps: true
})

//create a vitual field which willl not be saved to the database (only for user and task relation)
userSchema.virtual('tasks', {
    ref: 'Task', //model to use
    localField: '_id', //find the ones with _id
    foreignField: 'owner' // which is equal to owner
})

//reuable function, Instance methods
userSchema.methods.createAuthToken = async function () {
    const user = this;

    const token = jwt.sign({
        _id: user._id.toString()
    }, process.env.SECRET_KEY);

    user.tokens = user.tokens.concat({
        token
    });

    await user.save();

    return token;
}

//toJSON method will be called each time the response is converted to JSON
userSchema.methods.toJSON = function () {
    const user = this;
    const userObj = user.toObject();

    delete userObj.password;
    delete userObj.tokens;
    delete userObj.avatar;

    return userObj
}

//static, reusable function  //Model methods
userSchema.statics.findByCredentials = async (email, password) => {
    const user = await User.findOne({
        email
    });

    if (!user)
        throw new Error('Unable to login!');

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch)
        throw new Error('Unable to login!');

    return user;
}

//mongoose middleware to hash the password before saving user's info
userSchema.pre('save', async function () {
    const user = this;
    if (user.isModified('password'))
        user.password = await bcrypt.hash(user.password, 8);
})

userSchema.pre('remove', async function () {
    const user = this;
    await Task.deleteMany({
        owner: user._id
    });
})

const User = mongoose.model('User', userSchema);

module.exports = User;