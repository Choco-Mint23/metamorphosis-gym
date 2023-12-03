const express = require("express");
const cors = require("cors");
const mysql = require("mysql2");
const jwt = require("jsonwebtoken");

const crypto = require("crypto");
const app = express();
const port = 3001;
const secretKey = "123456789";

app.use(cors());
app.use(express.json());

// MySQL Database Connection
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "gym-db",
});

db.connect((err) => {
  if (err) {
    console.error("Database connection error:", err);
  } else {
    console.log("Connected to the database");
  }
});

/// Register endpoint
app.post("/register", (req, res) => {
  const { username, email, password } = req.body;

  // Validate input
  if (!username || !email || !password) {
    return res
      .status(400)
      .json({ message: "Please provide all required fields." });
  }

  // Hash the password before storing it
  const hashedPassword = crypto
    .createHash("sha256")
    .update(password)
    .digest("hex");

  // Check if the user already exists
  db.query(
    "SELECT * FROM users WHERE username = ? OR email = ?",
    [username, email],
    (err, results) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({ message: "Internal server error." });
      }

      if (results.length > 0) {
        return res.status(400).json({ message: "User already exists." });
      }

      // Store the user in the database with the hashed password
      db.query(
        "INSERT INTO users (username, email, password) VALUES (?, ?, ?)",
        [username, email, hashedPassword], // Use hashed password
        (err) => {
          if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ message: "Internal server error." });
          }

          return res.status(200).json({ message: "Registration successful." });
        }
      );
    }
  );
});

// Login endpoint
app.post("/login", (req, res) => {
  const { username, password } = req.body;

  // Validate input
  if (!username || !password) {
    return res
      .status(400)
      .json({ message: "Please provide both username and password." });
  }

  // Check if the user exists
  db.query(
    "SELECT * FROM users WHERE username = ?",
    [username],
    (err, results) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({ message: "Internal server error." });
      }

      if (results.length === 0) {
        return res
          .status(401)
          .json({ message: "Invalid username or password." });
      }
      console.log("Received login request:", username, password);

      // Hash the provided password and compare with the stored hash
      const hashedPassword = crypto
        .createHash("sha256")
        .update(password)
        .digest("hex");

      if (hashedPassword !== results[0].password) {
        return res
          .status(401)
          .json({ message: "Invalid username or password." });
      }

      // Generate a token and send it in the response
      const token = jwt.sign({ username }, secretKey, {
        expiresIn: "1h",
      });
      res.status(200).json({ message: "Login successful.", token });
    }
  );
});

// Endpoint to fetch employee data
app.get("/api/employees", (req, res) => {
  // Retrieve employee data from the database
  db.query("SELECT * FROM employees", (err, results) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ message: "Internal server error." });
    }

    // Send the retrieved employee data in the response
    res.status(200).json(results);
  });
});

// Endpoint to delete an employee
app.delete("/api/employees/:id", (req, res) => {
  const employeeId = req.params.id;

  // Perform the deletion from the database
  db.query("DELETE FROM employees WHERE id = ?", [employeeId], (err, results) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ message: "Internal server error." });
    }

    if (results.affectedRows === 0) {
      // No employee with the specified ID found
      return res.status(404).json({ message: "Employee not found." });
    }

    // Employee deleted successfully
    res.status(200).json({ message: "Employee deleted successfully" });
  });
});

// Endpoint to update an employee
app.put("/api/employees/:id", (req, res) => {
  const employeeId = req.params.id;
  const { fullName, position, phoneNumber, workSchedule } = req.body;

  // Validate input
  if (!fullName || !position || !phoneNumber || !workSchedule) {
    return res
      .status(400)
      .json({ message: "Please provide all required fields." });
  }

  // Update the employee in the database
  db.query(
    "UPDATE employees SET fullName = ?, position = ?, phoneNumber = ?, workSchedule = ? WHERE id = ?",
    [fullName, position, phoneNumber, workSchedule, employeeId],
    (err, results) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({ message: "Internal server error." });
      }

      if (results.affectedRows === 0) {
        // No employee with the specified ID found
        return res.status(404).json({ message: "Employee not found." });
      }

      // Employee updated successfully
      res.status(200).json({ message: "Employee updated successfully" });
    }
  );
});

// Endpoint to create a new employee
app.post("/api/employees", (req, res) => {
  const { fullName, position, phoneNumber, workSchedule } = req.body;

  // Validate input
  if (!fullName || !position || !phoneNumber || !workSchedule) {
    return res
      .status(400)
      .json({ message: "Please provide all required fields." });
  }

  // Perform the insertion into the database
  db.query(
    "INSERT INTO employees (fullName, position, phoneNumber, workSchedule) VALUES (?, ?, ?, ?)",
    [fullName, position, phoneNumber, workSchedule],
    (err, results) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({ message: "Internal server error." });
      }

      // Get the ID of the newly added employee
      const newEmployeeId = results.insertId;

      // Retrieve the complete data of the added employee
      db.query(
        "SELECT * FROM employees WHERE id = ?",
        [newEmployeeId],
        (err, employeeData) => {
          if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ message: "Internal server error." });
          }

          // Send the complete data of the added employee in the response
          res.status(201).json(employeeData[0]);
        }
      );
    }
  );
});

// Endpoint to get the total current employees
app.get("/api/totalCurrentEmployees", (req, res) => {
  // Retrieve the total current employees from the database
  db.query("SELECT COUNT(*) AS totalCurrentEmployees FROM employees", (err, results) => {
    if (err) {
      console.error("Database error while fetching total current employees:", err);
      return res.status(500).json({ error: "Internal server error." });
    }

    const totalCurrentEmployees = results[0].totalCurrentEmployees;

    // Send the total current employees count in the response
    res.status(200).json({ totalCurrentEmployees });
  });
});

// Endpoint to get the total current members
app.get("/api/totalCurrentMembers", (req, res) => {
  // Retrieve the total current members from the database
  db.query("SELECT COUNT(*) AS totalCurrentMembers FROM members", (err, results) => {
    if (err) {
      console.error("Database error while fetching total current members:", err);
      return res.status(500).json({ error: "Internal server error." });
    }

    const totalCurrentMembers = results[0].totalCurrentMembers;

    // Send the total current members count in the response
    res.status(200).json({ totalCurrentMembers });
  });
});

// Endpoint to fetch member data
app.get("/api/members", (req, res) => {
  // Retrieve member data from the database
  db.query("SELECT * FROM members", (err, results) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ message: "Internal server error." });
    }

    // Send the retrieved member data in the response
    res.status(200).json(results);
  });
});


// Endpoint to delete a member
app.delete("/api/members/:id", (req, res) => {
  const memberId = req.params.id;

  // Perform the deletion from the database
  db.query("DELETE FROM members WHERE id = ?", [memberId], (err, results) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ message: "Internal server error." });
    }

    if (results.affectedRows === 0) {
      // No member with the specified ID found
      return res.status(404).json({ message: "Member not found." });
    }

    // Member deleted successfully
    res.status(200).json({ message: "Member deleted successfully" });
  });
});

// Endpoint to update a member
app.put("/api/members/:id", (req, res) => {
  const memberId = req.params.id;
  const { username, email, role, membership } = req.body;

  // Validate input
  if (!username || !email || !role || !membership) {
    return res
      .status(400)
      .json({ message: "Please provide all required fields." });
  }

  // Update the member in the database
  db.query(
    "UPDATE members SET username = ?, email = ?, role = ?, membership = ? WHERE id = ?",
    [username, email, role, membership, memberId],
    (err, results) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({ message: "Internal server error." });
      }

      if (results.affectedRows === 0) {
        // No member with the specified ID found
        return res.status(404).json({ message: "Member not found." });
      }

      // Member updated successfully
      res.status(200).json({ message: "Member updated successfully" });
    }
  );
});

// Endpoint to create a new member
app.post("/api/members", (req, res) => {
  const { username, email, role, membership } = req.body;

  // Validate input
  if (!username || !email || !role || !membership) {
    return res
      .status(400)
      .json({ message: "Please provide all required fields." });
  }

  // Perform the insertion into the database
  db.query(
    "INSERT INTO members (username, email, role, membership) VALUES (?, ?, ?, ?)",
    [username, email, role, membership],
    (err, results) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({ message: "Internal server error." });
      }

      // Get the ID of the newly added member
      const newMemberId = results.insertId;

      // Retrieve the complete data of the added member
      db.query(
        "SELECT * FROM members WHERE id = ?",
        [newMemberId],
        (err, memberData) => {
          if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ message: "Internal server error." });
          }

          // Send the complete data of the added member in the response
          res.status(201).json(memberData[0]);
        }
      );
    }
  );
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
