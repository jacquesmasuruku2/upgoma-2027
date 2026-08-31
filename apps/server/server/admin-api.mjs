import "dotenv/config";
import cors from "cors";
import express from "express";
import pg from "pg";

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

app.post("/api/admin/students/:id/status", async (req, res) => {
  try {
    const databaseUrl = process.env.DATABASE_URL?.trim();
    if (!databaseUrl) {
      return res.status(503).json({ error: "DATABASE_URL non configurée." });
    }

    const { id } = req.params;
    const { status, matricule } = req.body || {};

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: "Statut invalide." });
    }

    const client = new pg.Client({ connectionString: databaseUrl });
    await client.connect();
    try {
      const fields = [];
      const values = [];

      if (status) {
        fields.push('status = $1');
        values.push(status);
      }
      if (matricule) {
        fields.push('matricule = $2');
        values.push(matricule);
      }
      values.push(id);

      const sql = `UPDATE public.students SET ${fields.join(', ')} WHERE id = $${values.length}`;
      await client.query(sql, values);
    } finally {
      await client.end();
    }

    res.json({ ok: true });
  } catch (error) {
    console.error('[admin-api]', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Erreur serveur' });
  }
});

app.delete('/api/admin/students/:id', async (req, res) => {
  try {
    const databaseUrl = process.env.DATABASE_URL?.trim();
    if (!databaseUrl) {
      return res.status(503).json({ error: 'DATABASE_URL non configurée.' });
    }

    const client = new pg.Client({ connectionString: databaseUrl });
    await client.connect();
    try {
      await client.query('DELETE FROM public.students WHERE id = $1', [req.params.id]);
    } finally {
      await client.end();
    }

    res.json({ ok: true });
  } catch (error) {
    console.error('[admin-api]', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Erreur serveur' });
  }
});

const port = Number(process.env.ADMIN_API_PORT || 8787);
app.listen(port, '127.0.0.1', () => {
  console.log(`[admin-api] http://127.0.0.1:${port}`);
});
