import { useState, useEffect } from "react";
import "./HomePage.css";



const API = "http://localhost:3001/api";


export default function HomePage() {
  const [exercises, setExercises] = useState([]);
  const [workouts, setWorkouts] = useState([]);
  const [exerciseForm, setExerciseForm] = useState({ name: "", equipment: "", weightGoal: "" });
  const [workoutForm, setWorkoutForm] = useState({ date: "", name: "", exercise: "", weight: "", reps: "" });
  const [deleteId, setDeleteId] = useState(null);
  const [showTooltip, setShowTooltip] = useState(false);

// Load data on page load
  useEffect(() => {
    fetch(`${API}/data`)
      .then(res => res.json())
      .then(data => {
        setExercises(data.exercises);
        setWorkouts(data.workouts);
      });
  }, []);


const handleAddExercise = () => {
  if (!exerciseForm.name || !exerciseForm.equipment) return;
  fetch(`${API}/exercises`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: exerciseForm.name }),
  })
    .then(res => res.json())
    .then(updatedExercises => {
      setExercises(updatedExercises);
      setExerciseForm({ name: "", equipment: "", weightGoal: "" });
    });
};

const handleAddWorkout = () => {
  if (!workoutForm.date || !workoutForm.name || !workoutForm.exercise || !workoutForm.weight || !workoutForm.reps) return;
  
  const [year, month, day] = workoutForm.date.split("-");
  const formattedDate = `${month}.${day}.${year}`;

  fetch(`${API}/workouts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...workoutForm, date: formattedDate }),
  })
    .then(res => res.json())
    .then(newWorkout => {
      setWorkouts([...workouts, newWorkout]);
      setWorkoutForm({ date: "", name: "", exercise: "", weight: "", reps: "" });
    });
};


const handleRepChange = (id, delta) => {
  const workout = workouts.find(w => w.id === id);
  const newReps = String(Math.max(0, Number(workout.reps) + delta));
  fetch(`${API}/workouts/${id}/reps`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reps: newReps }),
  })
    .then(res => res.json())
    .then(updated => {
      setWorkouts(workouts.map(w => w.id === id ? updated : w));
    });
};

const handleDelete = () => {
  fetch(`${API}/workouts/${deleteId}`, { method: "DELETE" })
    .then(() => {
      setWorkouts(workouts.filter(w => w.id !== deleteId));
      setDeleteId(null);
    });
};

  return (
    <div className="page-layout">
      <div className="app-card">

        {/* Header */}
        <div className="header">
          <h1>BareBar</h1>
          <p>Track your weightlifting progress by recording workouts and exercises</p>
          <ul>
            <li>Add exercise</li>
            <li>Add workout</li>
            <li>Track progress</li>
          </ul>
        </div>

        {/* Add Exercise Form */}
        <div className="form-section">
          <h2>Add new exercise</h2>
          <div className="form-row">
            <label>Name <span className="required">*</span>
              <input value={exerciseForm.name} onChange={e => setExerciseForm({ ...exerciseForm, name: e.target.value })} />
            </label>
            <label>Equipment required <span className="required">*</span>
              <input value={exerciseForm.equipment} onChange={e => setExerciseForm({ ...exerciseForm, equipment: e.target.value })} />
            </label>
            <label>Weight goal
              <input value={exerciseForm.weightGoal} onChange={e => setExerciseForm({ ...exerciseForm, weightGoal: e.target.value })} />
            </label>
            <button className="submit-button" onClick={handleAddExercise}>Submit</button>
          </div>
        </div>

        {/* Add Workout Form */}
        <div className="form-section">
          <h2>Add new workout</h2>
          <div className="form-row">
            <label>Date <span className="required">*</span>
              <input type="date" value={workoutForm.date} onChange={e => setWorkoutForm({ ...workoutForm, date: e.target.value })} />
            </label>
            <label>Name <span className="required">*</span>
              <input value={workoutForm.name} onChange={e => setWorkoutForm({ ...workoutForm, name: e.target.value })} />
            </label>
            <label>Exercise <span className="required">*</span>
              <select value={workoutForm.exercise} onChange={e => setWorkoutForm({ ...workoutForm, exercise: e.target.value })}>
                <option value="">Select exercise</option>
                {exercises.map(ex => <option key={ex} value={ex}>{ex}</option>)}
              </select>
            </label>
            <label>Weight <span className="required">*</span>
              <input value={workoutForm.weight} onChange={e => setWorkoutForm({ ...workoutForm, weight: e.target.value })} />
            </label>
            <label>Reps <span className="required">*</span>
              <input value={workoutForm.reps} onChange={e => setWorkoutForm({ ...workoutForm, reps: e.target.value })} />
            </label>
            <button className="submit-button" onClick={handleAddWorkout}>Submit</button>
          </div>
        </div>

        {/* Workout Table */}
        <table className="workout-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Name</th>
              <th>Exercise</th>
              <th>Weight</th>
              <th>
                Reps{" "}
                <span
                    onClick={() => setShowTooltip(true)}
                    style={{ cursor: "pointer", fontSize: 13 }}>
                    ℹ️
                </span>
              </th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {workouts.map(w => (
              <tr key={w.id}>
                <td>{w.date}</td>
                <td>{w.name}</td>
                <td>{w.exercise}</td>
                <td>{w.weight}</td>
                <td>
                  <button className="rep-button" onClick={() => handleRepChange(w.id, -1)}>−</button>
                  {" "}{w.reps}{" "}
                  <button className="rep-button" onClick={() => handleRepChange(w.id, 1)}>+</button>
                </td>
                <td>
                  <button className="delete-button" onClick={() => setDeleteId(w.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showTooltip && (
        <div className="modal-overlay">
            <div className="modal">
            <p className="modal-body">Use the – and + buttons to decrease or increase the Reps count</p>
            <div className="modal-buttons">
                <button className="confirm-button" onClick={() => setShowTooltip(false)}>OK</button>
            </div>
            </div>
        </div>
        )}    
      {/* Delete Modal */}
      {deleteId && (
        <div className="modal-overlay">
          <div className="modal">
            <p className="modal-title">Delete workout?</p>
            <p className="modal-body">This action cannot be undone. Your workout and all its data will be permanently removed.</p>
            <div className="modal-buttons">
              <button className="cancel-button" onClick={() => setDeleteId(null)}>Cancel</button>
              <button className="ok-button" onClick={handleDelete}>OK</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
