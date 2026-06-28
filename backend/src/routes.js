import { Router } from "express";
import { pool } from "./db.js";
import { STEPS, STEP_IDS, emptySteps, computeStatus } from "./steps.js";

const router = Router();

function serializeRelease(row) {
  return {
    id: row.id,
    name: row.name,
    date: row.release_date,
    additionalInfo: row.additional_info,
    steps: row.steps,
    status: computeStatus(row.steps),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// GET /api/steps -> the fixed list of steps (id + label), so the frontend
// doesn't need to hardcode them.
router.get("/steps", (req, res) => {
  res.json(STEPS);
});

// GET /api/releases -> list all releases, newest date first
router.get("/releases", async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM releases ORDER BY release_date DESC, id DESC"
    );
    res.json(rows.map(serializeRelease));
  } catch (err) {
    next(err);
  }
});

// GET /api/releases/:id -> a single release
router.get("/releases/:id", async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM releases WHERE id = $1",
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: "Release not found" });
    res.json(serializeRelease(rows[0]));
  } catch (err) {
    next(err);
  }
});

// POST /api/releases -> create a release
// body: { name, date, additionalInfo? }
router.post("/releases", async (req, res, next) => {
  try {
    const { name, date, additionalInfo } = req.body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return res.status(400).json({ error: "Release name is required" });
    }
    if (!date || isNaN(new Date(date).getTime())) {
      return res.status(400).json({ error: "A valid date is required" });
    }

    const { rows } = await pool.query(
      `INSERT INTO releases (name, release_date, additional_info, steps)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [name.trim(), new Date(date), additionalInfo || "", JSON.stringify(emptySteps())]
    );

    res.status(201).json(serializeRelease(rows[0]));
  } catch (err) {
    next(err);
  }
});

// PATCH /api/releases/:id -> update name / date / additionalInfo / steps
// body: any subset of { name, date, additionalInfo, steps: { stepId: bool } }
router.patch("/releases/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, date, additionalInfo, steps } = req.body;

    const { rows: existingRows } = await pool.query(
      "SELECT * FROM releases WHERE id = $1",
      [id]
    );
    if (existingRows.length === 0) {
      return res.status(404).json({ error: "Release not found" });
    }
    const existing = existingRows[0];

    const nextName = name !== undefined ? String(name).trim() : existing.name;
    if (!nextName) {
      return res.status(400).json({ error: "Release name cannot be empty" });
    }

    const nextDate = date !== undefined ? new Date(date) : existing.release_date;
    if (isNaN(nextDate.getTime())) {
      return res.status(400).json({ error: "Invalid date" });
    }

    const nextInfo = additionalInfo !== undefined ? additionalInfo : existing.additional_info;

    let nextSteps = existing.steps;
    if (steps !== undefined && typeof steps === "object" && steps !== null) {
      nextSteps = { ...existing.steps };
      for (const stepId of STEP_IDS) {
        if (stepId in steps) {
          nextSteps[stepId] = Boolean(steps[stepId]);
        }
      }
    }

    const { rows } = await pool.query(
      `UPDATE releases
       SET name = $1, release_date = $2, additional_info = $3, steps = $4, updated_at = now()
       WHERE id = $5
       RETURNING *`,
      [nextName, nextDate, nextInfo, JSON.stringify(nextSteps), id]
    );

    res.json(serializeRelease(rows[0]));
  } catch (err) {
    next(err);
  }
});

// DELETE /api/releases/:id
router.delete("/releases/:id", async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      "DELETE FROM releases WHERE id = $1 RETURNING id",
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: "Release not found" });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

export default router;
