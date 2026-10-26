
require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const Student = require("./models/Student");

const app = express();

app.use(express.json());

// Check whether a student ID is valid
function isValidStudentId(id) {
  return mongoose.isObjectIdOrHexString(id);
}

// Return errors without exposing server stack traces
function handleError(res, error) {
  if (
    error.name === "ValidationError" ||
    error.name === "CastError"
  ) {
    return res.status(400).json({
      message: error.message
    });
  }

  console.error(error);
  return res.status(500).json({
    message: "Internal server error"
  });
}

// Allow only the fields defined for student input
function getStudentFields(body) {
  const fields = {};

  for (const key of ["fullName", "course", "yearLevel", "section"]) {
    if (Object.prototype.hasOwnProperty.call(body, key)) {
      fields[key] = body[key];
    }
  }

  return fields;
}

// 1. Health check
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "Student API is running"
  });
});

// 2. Get all students
app.get("/api/students", async (req, res) => {
  try {
    const students = await Student.find();
    res.status(200).json(students);
  } catch (error) {
    handleError(res, error);
  }
});

// 3. Get one student by ID
app.get("/api/students/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidStudentId(id)) {
      return res.status(400).json({
        message: "Invalid student ID"
      });
    }

    const student = await Student.findById(id);

    if (!student) {
      return res.status(404).json({
        message: "Student not found"
      });
    }

    res.status(200).json(student);
  } catch (error) {
    handleError(res, error);
  }
});

// 4. Create a student
app.post("/api/students", async (req, res) => {
  try {
    if (
      !req.body ||
      typeof req.body !== "object" ||
      Array.isArray(req.body)
    ) {
      return res.status(400).json({
        message: "Request body must be a JSON object"
      });
    }

    const student = await Student.create(
      getStudentFields(req.body)
    );

    res.status(201).json(student);
  } catch (error) {
    handleError(res, error);
  }
});

// 5. Update a student
app.put("/api/students/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidStudentId(id)) {
      return res.status(400).json({
        message: "Invalid student ID"
      });
    }

    if (
      !req.body ||
      typeof req.body !== "object" ||
      Array.isArray(req.body)
    ) {
      return res.status(400).json({
        message: "Request body must be a JSON object"
      });
    }

    const updates = getStudentFields(req.body);

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        message: "Provide at least one valid field to update"
      });
    }

    const student = await Student.findByIdAndUpdate(
      id,
      { $set: updates },
      {
        returnDocument: "after",
        runValidators: true
      }
    );

    if (!student) {
      return res.status(404).json({
        message: "Student not found"
      });
    }

    res.status(200).json(student);
  } catch (error) {
    handleError(res, error);
  }
});

// 6. Delete a student
app.delete("/api/students/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidStudentId(id)) {
      return res.status(400).json({
        message: "Invalid student ID"
      });
    }

    const student = await Student.findByIdAndDelete(id);

    if (!student) {
      return res.status(404).json({
        message: "Student not found"
      });
    }

    res.status(200).json({
      message: "Student deleted successfully",
      deletedStudent: student
    });
  } catch (error) {
    handleError(res, error);
  }
});

// Handle malformed JSON and unexpected Express errors
app.use((error, req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }

  if (
    error instanceof SyntaxError &&
    error.status === 400 &&
    Object.prototype.hasOwnProperty.call(error, "body")
  ) {
    return res.status(400).json({
      message: "Invalid JSON request body"
    });
  }

  console.error(error.message);

  res.status(500).json({
    message: "Internal server error"
  });
});

// Connect to MongoDB before starting the server
const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    console.log("Connected to MongoDB successfully!");

    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
}

startServer();
