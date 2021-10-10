var sqlite3 = require("sqlite3");
sqlite3.verbose();
var db = undefined;

exports.connect = async function (dbname, callback) {
  db = new sqlite3.Database(
    dbname,
    sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE,
    function (err) {
      if (err) return callback(err);
      else return callback();
    }
  );
};
exports.disconnect = function (callback) {
  callback();
};

exports.create = async function (email, name, password) {
  const user = await new Promise((resolve, reject) => {
    db.run(
      "INSERT INTO Users(email, name, password) " + "VALUES (?, ?, ?);",
      [email, name, password],
      (err) => {
        if (err) return reject(err);
        else resolve();
      }
    );
  });
  return user;
};

exports.update = function (email, name, password, callback) {
  db.run(
    "UPDATE Users " + "SET name = ?, password = ? " + "WHERE email = ?;",
    [email, name, password],
    function (err) {
      if (err) callback(err);
      else callback();
    }
  );
};

exports.read = async function (email) {
  const users = await new Promise((resolve, reject) => {
    db.get(
      "SELECT * FROM Users WHERE email = ?;",
      [email],
      function (err, row) {
        if (err) return reject(err);
        else resolve(row);
      }
    );
  });
  return users;
};

exports.destroy = function (key, callback) {
  db.run("DELETE FROM notes WHERE notekey = ?;", [key], function (err) {
    if (err) callback(err);
    else callback(err);
  });
};

exports.titles = function (callback) {
  var titles = [];
  db.each(
    "SELECT notekey, title FROM notes",
    function (err, row) {
      if (err) callback(err);
      else
        titles.push({
          key: row.notekey,
          title: row.title,
        });
    },
    function (err, num) {
      if (err) callback(err);
      else callback(null, titles);
    }
  );
};
