const express = require("express");
const cookieParser = require("cookie-parser");
const app = express();
const bodyParser = require("body-parser");
const bcrypt = require('bcrypt');
const cookieSession = require('cookie-session');
const morgan = require('morgan');
const PORT = 8080; // default port 8080
const salt = 10;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(morgan('tiny'));
app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2']
}));

const {
  GRS,
  getUserByEmail,
  existingEmail,
  checkPassword,
  filterDatabase,
} = require("./helpers/helper");

app.set("view engine", "ejs");
app.use(cookieParser());

const urlDatabase = {
  b6UTxQ: { longURL: "https://www.tsn.ca", userID: "aJ48lW" },
  i3BoGr: { longURL: "https://www.google.ca", userID: "aJ48lW" },
};

const users = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur",
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk",
  },
};

app.get("/", (req, res) => {
  res.redirect("/urls");
});

app.get("/urls", (req, res) => {
  const user = req.session['username']
  const filteredDatabase = filterDatabase(urlDatabase, user);
  const templateVars = {
    urls: filteredDatabase,
    username: users[user]
  };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const id = req.session["username"]
  let username = users[id] 
  const templateVars = { username };
  if (username) {
    res.render("urls_new", templateVars);
  } else {
    res.redirect('/login')
  }
});

app.get("/urls/:shortURL", (req, res) => {
  const user = req.session["username"];
  const filteredDatabase = filterDatabase(urlDatabase, user);
  let shortURL = req.params.shortURL;
  const templateVars = {
    shortURL,
    longURL: filteredDatabase[shortURL],
    username: users[user]
  };
  if (user) {
    res.render("urls_show", templateVars);
  } else {
    res.redirect("/urls");
  }
});

app.post("/urls/:shortURL", (req, res) => {
  let shortURL = req.params.shortURL;
  const user = users[req.session['username']];
  let filteredDatabase = filterDatabase(urlDatabase, req.session['username'])
  if (user) {
    urlDatabase[shortURL].longURL = req.body.newURL;
    res.redirect("/urls");
  } else {
    res.status(404);
    let code = 404;
    let message = `please login first`;
    let username = user;
    const templateVars = { code, message, username };
    res.render("urls_error", templateVars);
  }
});

app.post("/urls", (req, res) => {
  let shortURL = GRS(); // Generate random string
  urlDatabase[shortURL] = {
    longURL: req.body.longURL,
    userID: req.session["username"] , 
  };
  res.redirect(`/urls/${shortURL}`);
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL].longURL;
  if(longURL.substring(0,7) !== 'http://') {
    longURL = 'http://' + longURL;
  }
  res.redirect(longURL);
});

app.post("/urls/:shortURL/delete", (req, res) => {
  const user = req.session["username"];
  if (user) {
    delete urlDatabase[req.params.shortURL];
  }
  res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  req.session["username"] = null
  res.redirect("/urls");
});

app.get("/register", (req, res) => {
  const id = req.session["username"]
  const templateVars = { username: users[id] };
  res.render("urls_register", templateVars);
});

app.post("/register", (req, res) => {
  let email = req.body.email;
  let password = bcrypt.hashSync(req.body.password, salt);
  if (!existingEmail(users, email)) {
    if (email && req.body.password) {
      let id = GRS();
      let newUser = { id, email, password };
      users[id] = newUser;
      req.session["username"] = id
      res.redirect("/urls");
    } else {
      res.status(400);
      let code = 400;
      let message = "username or password cannot be empty";
      let username = users[req.session['username']];
      const templateVars = { code, message, username };
      res.render("urls_error", templateVars);
    }
  } else {
    res.status(404);
    let code = 404;
    let message = `${email} is already registered`;
    let username = users[req.session['username']];
    const templateVars = { code, message, username };
    res.render("urls_error", templateVars);
  }
});

app.get("/login", (req, res) => {
  let user = req.session["username"];
  const templateVars = { username: users[user] };
  if (!user) {
    res.render("urls_login", templateVars);
  } else {
    res.redirect("/urls");
  }
});

app.post("/login", (req, res) => {
  let email = req.body.email;
  let password = req.body.password;
  if (existingEmail(users, email)) {
    if (checkPassword(users, email, password)) {
      const id = getUserByEmail(users, email)
      req.session["username"] = id
      res.redirect("/urls");
    } else {
      res.status(400);
      let code = 400;
      let message = "password is incorrect";
      let username = users[req.session['username']];
      const templateVars = { code, message, username };
      res.render("urls_error", templateVars);
    }
  } else {
    res.status(404);
    let code = 404;
    let message = `${email} is not registered please register before login`;
    let username = users[req.session['username']];
    const templateVars = { code, message, username };
    res.render("urls_error", templateVars);
  }
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
