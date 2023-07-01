const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");

const app = express();
app.use(express.json());
const dataBasePath = path.join(__dirname, "userData.db");
let dataBase = null;

const initializeServerAndDataBase = async () => {
  try {
    db = await open({
      filename: dataBasePath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Started...");
    });
  } catch (error) {
    console.log(`Server get an error ${error}`);
    process.exit(1);
  }
};
initializeServerAndDataBase();

// User Create API...

app.post("/register", async (request, response) => {
  const userDetails = request.body;
  const { username, name, password, gender, location } = userDetails;
  const newHashedPassword = await bcrypt.hash(password, 10);
  const checkUserQuery = `
    SELECT * 
    FROM user
    WHERE username = '${username}';
  `;
  const dbResponse = await db.get(checkUserQuery);
  if (dbResponse === undefined) {
    if (password.length > 4) {
      const addUserQuery = `
            INSERT INTO user (username,name,password,gender,location)
            VALUES (
                '${username}',
                '${name}',
                '${newHashedPassword}',
                '${gender}',
                '${location}');
          `;
      const dbResponse = await db.run(addUserQuery);
      response.send("User created successfully");
    } else {
      response.status(400);
      response.send("Password is too short");
    }
  } else {
    response.status(400);
    response.send("User already exists");
  }
});

//check correct user API...
app.post("/login", async (request, response) => {
  const userPasswordDetails = request.body;
  const { username, password } = userPasswordDetails;

  const checkUserQuery = `
        SELECT *
        FROM user 
        WHERE username = '${username}';
    `;
  const checkUserResponse = await db.get(checkUserQuery);

  if (checkUserResponse === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPasswordMatched = await bcrypt.compare(
      password,
      checkUserResponse.password
    );
    if (isPasswordMatched) {
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

//Change Password Query...

app.put("/change-password", async (request, response) => {
  const usernamePasswordDetails = request.body;
  const { username, oldPassword, newPassword } = usernamePasswordDetails;

  const getUserDetails = `
        SELECT *
        FROM user 
        WHERE username = '${username}';
    `;
  const userDetails = await db.get(getUserDetails);

  const isPasswordCorrect = await bcrypt.compare(
    oldPassword,
    userDetails.password
  );
  if (isPasswordCorrect) {
    if (newPassword.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      const updatePassword = `
            UPDATE user
            SET 
                password = '${hashedPassword}'
            WHERE username = '${username}'; 
        `;
      const dbResponse = await db.run(updatePassword);
      response.send("Password updated");
    }
  } else {
    response.status(400);
    response.send("Invalid current password");
  }
});

module.exports = app;
