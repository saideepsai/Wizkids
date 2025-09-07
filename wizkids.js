// npm init -y
// npm i express
// npm i mongoose

const fs = require("node:fs")
const express = require("express")
const mongoose = require("mongoose")
const multer = require("multer");
const path = require("path");
const session = require("express-session");
const crypto = require('crypto');




const app = express()
const port = 3000

const User = require("./model/user")


app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));

app.use((req, res, next) => {
  res.removeHeader('Permissions-Policy');
  next();
});




const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB limit
});




app.use(express.urlencoded({extended: true}))
app.use(express.static('public'));





mongoose.connect("mongodb://localhost:27017/projectDataDB")
  .then(async () => {
    console.log("Database Connected");

    
  })
  .catch((e) => {
    console.log(e);
    console.log("Database Can't Be Connected");
  });




app.get("/", (req, res)=>{
  res.sendFile(__dirname + '/views/wizkids.html');
})

app.get("/signup", (req, res)=>{
  res.sendFile(__dirname + '/views/signup.html');
})


app.post("/signup", upload.single("avatar"), async(req, res)=>{
  const userData = new User(req.body)
  const gender = req.body.Gender;
  const password = req.body.password;
  const cpassword = req.body.Confirm_Password;
  const username = req.body.username;

  if(password == cpassword){
    const existingUser = await User.findOne({username});
    if (existingUser) {
      res.send("user already exists try with diff user name");
    }
    else{
      if (!req.file) {
        return res.status(400).send("No file uploaded.");
      }
      const projectData = new User({
        Fullname: req.body.Fullname,
        username: req.body.username,
        username: req.body.username,
        Age: req.body.Age,
        Gender: req.body.Gender,
        Date_of_birth: req.body.Date_of_birth,
        Mobile_Number: req.body.Mobile_Number,
        password: req.body.password,
        Confirm_Password: req.body.Confirm_Password,
        avatar: {
          data: req.file.buffer,
          contentType: req.file.mimetype
        }
      });
    
      await projectData.save()
      res.sendFile(__dirname + '/views/wizkids.html');
    }
  }
  else{
    res.send("password are not matching");
  }
});


app.get('/login', (req, res) => {
  res.sendFile(__dirname + '/views/login.html');
});

const sessionSecret = crypto.randomBytes(64).toString('hex');

app.use(session({
  secret: sessionSecret,
  resave: false,
  saveUninitialized: true
}));



app.post('/login', async (req, res) => {
  const username = req.body.username;
  const password = req.body.password;

  try {
    const user = await User.findOne({ username, password });

    if (user) {
      // Successful login
      req.session.users = req.session.users || {};
      req.session.users[username] = user;

      req.session.user = user;
      console.log('Session data:', req.session);
      res.render('Dashboard', { user: req.session.users[username] });
    } else {
      // Invalid credentials
      res.redirect('/login?error=invalid');
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});












app.route('/Dashboard')
  .get((req, res) => {
    console.log(req.session.user);
    // Render the dashboard template or redirect if the user is not logged in
    if (req.session.user) {
      res.render('Dashboard', { user: req.session.user });
    } else {
      res.redirect('/login');
    }
  })
  .post((req, res) => {
    if (req.session.user) {
      // Pass the user data to the template
      res.render('Dashboard', { user: req.session.user });
    } else {
      // Redirect to the login page if the user is not logged in
      res.redirect('/login');
    }
  });






app.get('/Basicquiz', (req, res) => {
  res.render('Basicquiz', { user: req.session.user });
});




app.get('/Mediumquiz', (req, res) => {
  res.render('Mediumquiz', { user: req.session.user });
});



app.get('/Advancequiz', (req, res) => {
  res.render('Advancequiz', { user: req.session.user });
});



// Add this route to handle logout
app.post('/logout', (req, res) => {
  // Destroy the session to log the user out
  req.session.destroy(err => {
    if (err) {
      console.error('Error destroying session:', err);
      res.status(500).send('Internal Server Error');
    } else {
      // Redirect to the Wizkids page after successful logout
      res.sendStatus(200);
    }
  });
});






app.listen(port, ()=>{
    console.log("App Running on port: ", port)
})






