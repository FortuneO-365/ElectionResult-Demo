import express from 'express';
import cors from 'cors';
import pool from './db.mjs'
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT;

app.use(cors());
app.use(express.json());

app.get('/', (request, response) => {
    response.send('Welcome to the app')
})

app.get('/polling-units', async (request, response) => {

    // Use parameterized query to prevent SQL injection
    const sql = "SELECT * FROM `polling_unit`";

    try {
        const rows = await pool.query(sql);
        response.json(rows);
    } catch (error) {
        console.error('Error fetching polling units:', error);
        response.status(500).send('Server error');
    }
});


app.get('/polling-units/:id', async (request, response) => {
    const { id } = request.params;
    // Validate the ID
    if (isNaN(id)) {
        return response.status(400).send('Invalid ID format');
    }
    // Use parameterized query to prevent SQL injection
    const sql = "SELECT * FROM `polling_unit` WHERE uniqueid = ?";
    try {
        const rows = await pool.query(sql, [id]);
        if (rows.length === 0) {
            return response.status(404).send('Polling unit not found');
        }
        response.json(rows);
    } catch (error) {
        console.error('Error fetching polling units:', error);
        response.status(500).send('Server error');
    }
});

app.get('/polling-units/:id/results', async (request, response) => {
    const { id } = request.params;
    // Validate the ID
    if (isNaN(id)) {
        return response.status(400).send('Invalid ID format');
    }
    // Use parameterized query to prevent SQL injection
    const sql = "SELECT * FROM `announced_pu_results` WHERE polling_unit_uniqueid = ?";
    try {
        const rows = await pool.query(sql, [id]);
        if (rows.length === 0) {
            return response.status(404).send('Results not found for this polling unit');
        }
        response.json(rows);
    } catch (error) {
        console.error('Error fetching results:', error);
        response.status(500).send('Server error');
    }
})

app.get('/local-governments', async (request, response) => {
    const sql = "SELECT * FROM `lga`";

    try {
        const rows = await pool.query(sql);
        response.json(rows);
    } catch (error) {
        console.error('Error fetching local governments:', error);
        response.status(500).send('Server error');
    }
});

app.get('/local-governments/:id', async (request, response) => {
    const { id } = request.params;
    // Validate the ID
    if (isNaN(id)) {
        return response.status(400).send('Invalid ID format');
    }
    // Use parameterized query to prevent SQL injection
    const sql = "SELECT * FROM `lga` WHERE lga_id = ?";
    try {
        const rows = await pool.query(sql, [id]);
        if (rows.length === 0) {
            return response.status(404).send('Local government not found');
        }
        response.json(rows);
    } catch (error) {
        console.error('Error fetching local governments:', error);
        response.status(500).send('Server error');
    }
})

app.get('/local-governments/:id/results', async (request, response) => {
    const { id } = request.params;
    // Validate the ID
    if (isNaN(id)) {
        return response.status(400).send('Invalid ID format');
    }
    // Use parameterized query to prevent SQL injection
    const sql = "SELECT `polling_unit_id` FROM `polling_unit` WHERE `lga_id` = ?";
    const secSql = "SELECT * FROM `announced_pu_results` WHERE `polling_unit_uniqueid` = ?";
    try {
        const pollingUnits = await pool.query(sql, [id]);
        if (pollingUnits.length === 0) {
            return response.status(404).send('No polling unit found for this Local government');
        }

        // Fetch results for all polling units using Promise.all
        const results = await Promise.all(
            pollingUnits[0].map(async (unit) => {
                const result = await pool.query(secSql, [unit.polling_unit_id]);
                return {
                    pollingUnitId: unit.polling_unit_id,
                    results: result
                };
            })
        );

        response.json(results);

    } catch (error) {
        console.error('Error fetching local governments:', error);
        response.status(500).send('Server error');
    }
});

app.get('/parties', async(request, response) => {
    const sql = 'SELECT * FROM `party`';

    try {
        const rows = await pool.query(sql);
        response.json(rows);
        
    } catch (error) {
        console.error('Error fetching parties:', error);
        response.status(500).send('Server error');
    }
})

app.get('/available-pu', async (request, response) => {
    const sql = 'SELECT pu.* FROM polling_unit pu LEFT JOIN announced_pu_results pur ON pu.uniqueid = pur.polling_unit_uniqueid WHERE pur.polling_unit_uniqueid IS NULL;';

    try {
        const rows = await pool.query(sql);
        response.json(rows); 
    } catch (error) {
        console.error('Error fetching parties:', error);
        response.status(500).send('Server error');
    }
})

app.post('/polling-units', async (request, response) => {
    const {pollingUnitId, party, score, user, date} = request.body;
    const ipAddress = request.headers['x-forwarded-for']?.split(',')[0] ||
    request.connection.remoteAddress;

    // Validate the input
    if (!pollingUnitId || !party || !score || !user || !date || !ipAddress) {
        return response.status(400).send('All fields are required');
    }
    // Use parameterized query to prevent SQL injection
    const sql = "INSERT INTO `announced_pu_results` (polling_unit_uniqueid, party_abbreviation, party_score, entered_by_user, date_entered, user_ip_address) VALUES (?, ?, ?, ?, ?, ?)";
    try {
        const [result] = await pool.query(sql, [pollingUnitId, party, score, user, date, ipAddress]);
        response.status(201).json({ message: 'Polling unit created', id: result.insertId });
    } catch (error) {
        console.error('Error creating polling unit:', error);
        response.status(500).send('Server error');
    }
})
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});