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
  const [notification, setNotification] = useState(null);
  const [stats, setStats] = useState(null);
  const [records, setRecords] = useState([]);
  const [filterExercise, setFilterExercise] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [filteredWorkouts, setFilteredWorkouts] = useState(null);
  const [goals, setGoals] = useState([]);
  const [goalForm, setGoalForm] = useState({ title: "", endDate: "" });


  const showNotification = (message, type) => {
    fetch("http://localhost:3002/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, type }),
    });
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

// Load data on page load
  useEffect(() => {
    fetch(`${API}/data`)
      .then(res => res.json())
      .then(data => {
        setExercises(data.exercises);
        setWorkouts(data.workouts);
      });

    fetch("http://localhost:3003/api/stats")
    .then(res => res.json())
    .then(data => setStats(data));

    fetch("http://localhost:3003/api/stats/records")
    .then(res => res.json())
    .then(data => setRecords(data));

    fetch("http://localhost:4001/api/goals")
    .then(res => res.json())
    .then(data => setGoals(data));
}, []);


const refreshStats = () => {
  fetch("http://localhost:3003/api/stats")
    .then(res => res.json())
    .then(data => setStats(data));
  fetch("http://localhost:3003/api/stats/records")
    .then(res => res.json())
    .then(data => setRecords(data));
};

const handleAddExercise = () => {
  if (!exerciseForm.name || !exerciseForm.equipment) {
    showNotification("Please fill in all required fields.", "warning");
    return;
  }
  fetch(`${API}/exercises`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: exerciseForm.name }),
  })
    .then(res => res.json())
    .then(updatedExercises => {
      setExercises(updatedExercises);

      // If weight goal was provided, send it to the goals service
      if (exerciseForm.weightGoal) {
        fetch("http://localhost:4001/api/goals", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: "barebar_user",
            appId: "barebar",
            title: `${exerciseForm.name} - ${exerciseForm.weightGoal}`,
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], // 30 days from now
          }),
        })
          .then(res => res.json())
          .then(newGoal => {
            setGoals([...goals, newGoal]);
          });
      }

      setExerciseForm({ name: "", equipment: "", weightGoal: "" });
      showNotification("Exercise added successfully!", "success");
    });
};

const handleAddWorkout = () => {
  if (!workoutForm.date || !workoutForm.name || !workoutForm.exercise || !workoutForm.weight || !workoutForm.reps) {
    showNotification("Please fill in all required fields.", "warning");
    return;
  }
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
      showNotification("Workout added successfully!", "success");
      refreshStats();
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
      showNotification("Workout deleted.", "info");
      refreshStats();
    });
};

const handleFilter = () => {
  if (!filterExercise && !filterDate) return;

  let url = "http://localhost:3004/api/filter?";
  if (filterExercise) url += `exercise=${filterExercise}&`;
  if (filterDate) {
    const [year, month, day] = filterDate.split("-");
    const formattedDate = `${month}.${day}.${year}`;
    url += `date=${formattedDate}`;
  }

  fetch(url)
    .then(res => res.json())
    .then(data => setFilteredWorkouts(data));
};

const handleClearFilter = () => {
  setFilterExercise("");
  setFilterDate("");
  setFilteredWorkouts(null);
};

const handleAddGoal = () => {
  if (!goalForm.title || !goalForm.endDate) {
    showNotification("Please fill in all goal fields.", "warning");
    return;
  }
  fetch("http://localhost:4001/api/goals", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId: "barebar_user",
      appId: "barebar",
      title: goalForm.title,
      endDate: goalForm.endDate,
    }),
  })
    .then(res => res.json())
    .then(newGoal => {
      setGoals([...goals, newGoal]);
      setGoalForm({ title: "", endDate: "" });
      showNotification("Goal added successfully!", "success");
    });
};

const handleDeleteGoal = (id) => {
  fetch(`http://localhost:4001/api/goals/${id}`, { method: "DELETE" })
    .then(() => {
      setGoals(goals.filter(g => g.id !== id));
      showNotification("Goal deleted.", "info");
    });
};

  return (
    <div className="page-layout">
      {notification && (
        <div className={`notification-banner ${notification.type}`}>
          {notification.message}
        </div>
      )}
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
        <div className="filter-section">
          <input
            type="text"
            placeholder="Filter by exercise..."
            value={filterExercise}
            onChange={e => setFilterExercise(e.target.value)}
          />
          <input
            type="date"
            value={filterDate}
            onChange={e => setFilterDate(e.target.value)}
          />
          <button className="filter-button" onClick={handleFilter}>Search</button>
          <button className="clear-button" onClick={handleClearFilter}>Clear</button>
        </div>
        <div className="table-wrapper">
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
              {(filteredWorkouts || workouts).map(w => (
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
      {stats && (
        <div className="stats-section">
          <h2>Track Progress</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <p>Total Workouts</p>
              <h3>{stats.totalWorkouts}</h3>
            </div>
            <div className="stat-card">
              <p>Most Used Exercise</p>
              <h3>{stats.mostUsedExercise}</h3>
            </div>
            <div className="stat-card">
              <p>Highest Weight Lifted</p>
              <h3>{stats.highestWeight}</h3>
            </div>
          </div>

          <table className="records-table">
            <thead>
              <tr>
                <th>Exercise</th>
                <th>Personal Record</th>
              </tr>
            </thead>
            <tbody>
              {records.map(r => (
                <tr key={r.exercise}>
                  <td>{r.exercise}</td>
                  <td>{r.highestWeight}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="goals-section">
            <h2>Goals</h2>
            <div className="goals-form">
              <label>Goal
                <input
                  placeholder="e.g. Deadlift 200 lbs"
                  value={goalForm.title}
                  onChange={e => setGoalForm({ ...goalForm, title: e.target.value })}
                />
              </label>
              <label>Target Date
                <input
                  type="date"
                  value={goalForm.endDate}
                  onChange={e => setGoalForm({ ...goalForm, endDate: e.target.value })}
                />
              </label>
              <button className="filter-button" onClick={handleAddGoal}>Add Goal</button>
            </div>

            {goals.length === 0 ? (
              <p style={{ textAlign: "center", color: "#555" }}>No goals set yet.</p>
            ) : (
              <table className="goals-table">
                <thead>
                  <tr>
                    <th>Goal</th>
                    <th>Target Date</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {goals.map(g => (
                    <tr key={g.id}>
                      <td>{g.title}</td>
                      <td>{g.endDate}</td>
                      <td>{g.status}</td>
                      <td>
                        <button className="delete-goal-button" onClick={() => handleDeleteGoal(g.id)}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

        </div>
      )}
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
  </div>
  );
}


