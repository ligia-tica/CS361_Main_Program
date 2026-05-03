const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const DATA_FILE = path.join(__dirname, 'data.json');

app.use(cors());
app.use(express.json());

const readData = () => JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
const writeData = (data) => fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));

// Get all data
app.get('/api/data', (req, res) => {
  res.json(readData());
});

// Add exercise
app.post('/api/exercises', (req, res) => {
  const data = readData();
  data.exercises.push(req.body.name);
  writeData(data);
  res.json(data.exercises);
});

// Add workout
app.post('/api/workouts', (req, res) => {
  console.log('POST /api/workouts hit');
  console.log('Body:', req.body);
  const data = readData();
  const newWorkout = { id: Date.now(), ...req.body };
  data.workouts.push(newWorkout);
  writeData(data);
  console.log('Data written:', newWorkout);
  res.json(newWorkout);
});


// Update reps
app.put('/api/workouts/:id/reps', (req, res) => {
  const data = readData();
  const workout = data.workouts.find(w => w.id === Number(req.params.id));
  if (!workout) return res.status(404).json({ error: 'Workout not found' });
  workout.reps = req.body.reps;
  writeData(data);
  res.json(workout);
});

// Delete workout
app.delete('/api/workouts/:id', (req, res) => {
  const data = readData();
  data.workouts = data.workouts.filter(w => w.id !== Number(req.params.id));
  writeData(data);
  res.json({ success: true });
});

app.listen(3001, () => console.log('Server running on port 3001'));