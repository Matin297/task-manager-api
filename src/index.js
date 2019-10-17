const express = require('express');
require('./db/mongoose.js');
const userRouter = require('./routers/user');
const taskRouter = require('./routers/task');

const app = express();

app.use(express.json());
app.use(userRouter);
app.use(taskRouter);

//create a port for heroku deployment and a backup port for localhost
const port = process.env.PORT;

app.listen(port, () => {
    console.log('Server is up on port ' + port);
})