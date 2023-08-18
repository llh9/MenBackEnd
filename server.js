require('./config/db');

const app = require('express')();
var cors = require('cors')  //use this

const port = process.env.PORT | 3001;

const UserRouter = require('./api/User');
 
//For accepting post form data
const bodyParser = require('express').json;
app.use(cors()) 
app.use(bodyParser());

app.use('/user', UserRouter);

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});