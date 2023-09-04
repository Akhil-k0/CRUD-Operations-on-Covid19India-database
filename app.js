const express = require("express");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");

const app = express();
app.use(express.json());

const dbPath = "covid19India.db"; // Change this to your database path

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.error(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

// API 1: Get all states
app.get("/states/", async (request, response) => {
  const getStatesQuery = `
    SELECT state_id AS stateId, state_name AS stateName, population
    FROM state;`;
  const statesArray = await db.all(getStatesQuery);
  response.send(statesArray);
});

// API 2: Get a state by ID
app.get("/states/:stateId/", async (request, response) => {
  const stateId = request.params.stateId;

  const getStateQuery = `
    SELECT state_id AS stateId, state_name AS stateName, population
    FROM state
    WHERE state_id = ${stateId};`;

  try {
    const state = await db.get(getStateQuery);

    if (state) {
      response.send(state);
    } else {
      response.status(404).send("State not found");
    }
  } catch (e) {
    console.error(`Error fetching state: ${e.message}`);
    response.status(500).send("Internal Server Error");
  }
});

// API 3: Create a new district
app.post("/districts/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;

  const insertDistrictQuery = `
    INSERT INTO district (district_name, state_id, cases, cured, active, deaths)
    VALUES ('${districtName}', ${stateId}, ${cases}, ${cured}, ${active}, ${deaths});`;

  try {
    await db.run(insertDistrictQuery);
    response.send("District Successfully Added");
  } catch (e) {
    console.error(`Error adding district: ${e.message}`);
    response.status(500).send("Internal Server Error");
  }
});

// API 4: Get a district by ID
app.get("/districts/:districtId/", async (request, response) => {
  const districtId = request.params.districtId;

  const getDistrictQuery = `
    SELECT district_id AS districtId, district_name AS districtName, state_id AS stateId, 
           cases, cured, active, deaths
    FROM district
    WHERE district_id = ${districtId};`;

  try {
    const district = await db.get(getDistrictQuery);

    if (district) {
      response.send(district);
    } else {
      response.status(404).send("District not found");
    }
  } catch (e) {
    console.error(`Error fetching district: ${e.message}`);
    response.status(500).send("Internal Server Error");
  }
});

// API 5: Delete a district by ID
app.delete("/districts/:districtId/", async (request, response) => {
  const districtId = request.params.districtId;

  const deleteDistrictQuery = `
    DELETE FROM district
    WHERE district_id = ${districtId};`;

  try {
    await db.run(deleteDistrictQuery);
    response.send("District Removed");
  } catch (e) {
    console.error(`Error deleting district: ${e.message}`);
    response.status(500).send("Internal Server Error");
  }
});

// API 6: Update a district by ID
app.put("/districts/:districtId/", async (request, response) => {
  const districtId = request.params.districtId;
  const { districtName, stateId, cases, cured, active, deaths } = request.body;

  const updateDistrictQuery = `
    UPDATE district
    SET district_name = '${districtName}', state_id = ${stateId},
        cases = ${cases}, cured = ${cured}, active = ${active}, deaths = ${deaths}
    WHERE district_id = ${districtId};`;

  try {
    await db.run(updateDistrictQuery);
    response.send("District Details Updated");
  } catch (e) {
    console.error(`Error updating district: ${e.message}`);
    response.status(500).send("Internal Server Error");
  }
});

// API 7: Get statistics for a state by ID
app.get("/states/:stateId/stats/", async (request, response) => {
  const stateId = request.params.stateId;

  const getStatsQuery = `
    SELECT SUM(cases) AS totalCases, SUM(cured) AS totalCured,
           SUM(active) AS totalActive, SUM(deaths) AS totalDeaths
    FROM district
    WHERE state_id = ${stateId};`;

  try {
    const stats = await db.get(getStatsQuery);
    response.send(stats);
  } catch (e) {
    console.error(`Error fetching state stats: ${e.message}`);
    response.status(500).send("Internal Server Error");
  }
});

// API 8: Get state name for a district by ID
app.get("/districts/:districtId/details/", async (request, response) => {
  const districtId = request.params.districtId;

  const getStateNameQuery = `
    SELECT state.state_name AS stateName
    FROM district
    INNER JOIN state ON district.state_id = state.state_id
    WHERE district.district_id = ${districtId};`;

  try {
    const stateName = await db.get(getStateNameQuery);

    if (stateName) {
      response.send(stateName);
    } else {
      response.status(404).send("State not found");
    }
  } catch (e) {
    console.error(`Error fetching state name: ${e.message}`);
    response.status(500).send("Internal Server Error");
  }
});

module.exports = app;
