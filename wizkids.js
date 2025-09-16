const fs = require("node:fs");
const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");
const path = require("path");
const session = require("express-session");
const crypto = require("crypto");

const app = express();
const port = process.env.PORT || 3000;

const User = require("./model/user");

// View engine setup
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Static files
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));

// Remove unnecessary headers
app.use((req, res, next) => {
  res.removeHeader("Permissions-Policy");
  next();
});

// File upload (Multer)
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB limit
});

// Database connection (local fallback + Atlas support)
mongoose
  .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/projectDataDB")
  .then(() => console.log("✅ Database Connected"))
  .catch((e) => {
    console.error("❌ Database Connection Error:", e.message);
  });

// Sessions (use stable secret in production)
const sessionSecret = process.env.SESSION_SECRET || "dev-secret";
app.use(
  session({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: true,
  })
);

// Routes
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "wizkids.html"));
});

app.get("/signup", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "signup.html"));
});

app.post("/signup", upload.single("avatar"), async (req, res) => {
  const { Fullname, username, Age, Gender, Date_of_birth, Mobile_Number, password, Confirm_Password } = req.body;

  if (password !== Confirm_Password) {
    return res.send("Passwords are not matching");
  }

  const existingUser = await User.findOne({ username });
  if (existingUser) {
    return res.send("User already exists. Try a different username.");
  }

  if (!req.file) {
    return res.status(400).send("No file uploaded.");
  }

  const newUser = new User({
    Fullname,
    username,
    Age,
    Gender,
    Date_of_birth,
    Mobile_Number,
    password,
    Confirm_Password,
    avatar: {
      data: req.file.buffer,
      contentType: req.file.mimetype,
    },
  });

  await newUser.save();
  res.sendFile(path.join(__dirname, "views", "wizkids.html"));
});

app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "login.html"));
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username, password });

    if (user) {
      req.session.users = req.session.users || {};
      req.session.users[username] = user;
      req.session.user = user;

      console.log("Session data:", req.session);
      res.render("Dashboard", { user: req.session.users[username] });
    } else {
      res.redirect("/login?error=invalid");
    }
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).send("Internal Server Error");
  }
});

app
  .route("/Dashboard")
  .get((req, res) => {
    if (req.session.user) {
      res.render("Dashboard", { user: req.session.user });
    } else {
      res.redirect("/login");
    }
  })
  .post((req, res) => {
    if (req.session.user) {
      res.render("Dashboard", { user: req.session.user });
    } else {
      res.redirect("/login");
    }
  });

app.get("/Basicquiz", (req, res) => {
  res.render("Basicquiz", { user: req.session.user });
});

app.get("/Mediumquiz", (req, res) => {
  res.render("Mediumquiz", { user: req.session.user });
});

app.get("/Advancequiz", (req, res) => {
  res.render("Advancequiz", { user: req.session.user });
});

// Logout
app.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Error destroying session:", err);
      return res.status(500).send("Internal Server Error");
    }
    res.sendStatus(200);
  });
});

// Start server
app.listen(port, () => {
  console.log(`🚀 App running on port: ${port}`);
});
