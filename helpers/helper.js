const bcrypt = require('bcrypt');

// GRS = generate random string

const GRS = function () {
  let result = Math.random().toString(36).substring(3).slice(-5);
  console.log(result);
  return result;
};

const getUserByEmail = function (users, email) {
  for (let id in users) {
    if (users[id].email === email) {
      return id;
    }
  }
  return null;
};

const existingEmail = function (obj, email) {
  for (let id in obj) {
    if (obj[id].email === email) {
      return true;
    }
  }
  return false;
};

const checkPassword = function (obj, email, password) {
  const id = getUserByEmail(obj, email);
  for (let user in obj) {
    if ((user = id && bcrypt.compareSync(password, obj[user].password))) {
      return true;
    }
  }
  return false;
};

const filterDatabase = function (database, userID) {
  let result = {};
  if (userID !== undefined) {
    for (let shortURL in database) {
      if (database[shortURL].userID === userID) {
        result[shortURL] = database[shortURL].longURL;
      }
    }
  }
  return result;
};

module.exports = {
  GRS,
  getUserByEmail,
  existingEmail,
  checkPassword,
  filterDatabase,
};
