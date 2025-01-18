const fs = require('fs')
const xlsx = require('xlsx')
const { PGSQL } = require('../db/mySql')
const { v4: uuidv4 } = require('uuid');

const getAlluser = (async (req, res) => {
    try {
        // SQL query to get all data from billing_data table
        let query = 'SELECT * FROM billing_data;';

        // Execute the query
        let result = await PGSQL.query(query);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'No data found in billing_data table.' });
        }

        // Send the retrieved data in the response
        res.json({
            message: 'Data retrieved successfully.',
            data: result.rows,  // Return the rows from the database
        });
    } catch (error) {
        res.status(500).json({ message: `Error retrieving data: ${error.message}` });
    }
})

const addUser = async (req, res) => {
    const { bill_date, division, mat_desc, billing_qty, uom, net_value_gcurr, margin, brand, se_name } = req.body;  // Get the data from the request body
    try {
        // Generate a unique ID for the new user (you can also use UUID generation here)
        const uniqueId = uuidv4();
        // SQL query to insert the new user
        const query = `
            INSERT INTO billing_data (uuid, bill_date, division, mat_desc, billing_qty, uom, net_value_gcurr, margin, brand, se_name)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING *;`;

        // Execute the query with the provided values
        const result = await PGSQL.query(query, [uniqueId, bill_date, division, mat_desc, billing_qty, uom, net_value_gcurr, margin, brand, se_name]);

        // Send success response with the newly added user data
        res.json({
            message: 'New billing data added successfully.',
            addedData: result.rows[0],  // Return the inserted row
        });
    } catch (error) {
        res.status(500).json({ message: `Error adding user: ${error.message}` });
    }
};


const getUserByID = (async (req, res) => {
    const { id } = req.query;  // Get the 'id' from the URL parameter
    try {
        // SQL query to get a single user's data by the correct column (e.g., 'uuid')
        const query = `SELECT * FROM billing_data WHERE uuid = $1;`;

        // Execute the query with the provided id
        const result = await PGSQL.query(query, [id]);

        // Check if the user is found
        if (result.rows.length === 0) {
            return res.status(404).json({ message: `No billing data found with id ${id}.` });
        }

        // Send the retrieved data in the response
        res.json({
            message: 'Data retrieved successfully.',
            data: result.rows[0],  // Return the first row as it's a single user
        });
    } catch (error) {
        res.status(500).json({ message: `Error retrieving data: ${error.message}` });
    }
})

const updateUserByID = async (req, res) => {
    const { id } = req.params;  // Get the 'id' from the URL parameter
    const { bill_date, division, mat_desc, billing_qty, uom, net_value_gcurr, margin, brand, se_name } = req.body;  // Get the data to update from the request body

    try {
        // SQL query to update a user by uuid
        const query = `
            UPDATE billing_data 
            SET bill_date = $1, division = $2, mat_desc = $3, billing_qty = $4, uom = $5, net_value_gcurr = $6, margin = $7, brand = $8, se_name = $9
            WHERE uuid = $10
            RETURNING *;
        `;

        // Execute the query with the provided values
        const result = await PGSQL.query(query, [bill_date, division, mat_desc, billing_qty, uom, net_value_gcurr, margin, brand, se_name, id]);

        // Check if the record was found and updated
        if (result.rows.length === 0) {
            return res.status(404).json({ message: `No billing data found with id ${id}.` });
        }

        // Send success response with the updated data
        res.json({
            message: `Billing data with id ${id} updated successfully.`,
            updatedData: result.rows[0],  // Return the updated row
        });
    } catch (error) {
        res.status(500).json({ message: `Error updating data: ${error.message}` });
    }
};


const deleteUserByID = async (req, res) => {
    const { id } = req.query;  // Get the 'id' from the URL parameter

    try {
        // SQL query to delete a user by uuid
        const query = `DELETE FROM billing_data WHERE uuid = $1 RETURNING *`; // Use parameterized query

        // Execute the query with the provided id
        const result = await PGSQL.query(query, [id]);

        // Check if the user was found and deleted
        if (result.rows.length === 0) {
            return res.status(404).json({ message: `No billing data found with id ${id}.` });
        }

        // Send success response
        res.json({
            message: `Billing data with id ${id} deleted successfully.`,
            deletedData: result.rows[0],  // Return the deleted row
        });
    } catch (error) {
        res.status(500).json({ message: `Error deleting data: ${error.message}` });
    }
}



const uploadFile = async (req, res) => {
    try {
        // Check if file is uploaded
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded.' });
        }

        // Get the file path
        const filePath = req.file.path;

        // Read the uploaded XLSX file
        const workbook = xlsx.readFile(filePath);

        // Get the first sheet (you can change this based on your needs)
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        // Convert the sheet to JSON (array of objects)
        const data = xlsx.utils.sheet_to_json(sheet);


        // Process each row of the sheet and insert into PostgreSQL
        for (let row of data) {
            const {
                'Bill Date': bill_date,
                'Division': division,
                'Mat Desc': mat_desc,
                'Billing Qty': billing_qty,
                'UOM': uom,
                'Net Value Gcurr': net_value_gcurr,
                'Margin': margin,
                'Brand': brand,
                'SE Name': se_name
            } = row;

            // Convert Excel serial date to JavaScript Date (if the value is numeric)
            const formattedBillDate = isNaN(bill_date) ? null : excelDateToJSDate(bill_date).toISOString().split('T')[0]; // Convert to YYYY-MM-DD
            // Generate a unique ID for this record
            const uniqueId = uuidv4();
            // Insert data into the PostgreSQL database
            const query = `INSERT INTO billing_data (uuid, bill_date, division, mat_desc, billing_qty, uom, net_value_gcurr, margin, brand, se_name)VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *;`;
            const values = [uniqueId, formattedBillDate, division, mat_desc, billing_qty, uom, net_value_gcurr, margin, brand, se_name];

            const dbResult = await PGSQL.query(query, values);
            console.log('Inserted row:', dbResult.rows[0]);
        }

        // Delete the uploaded file after processing
        fs.unlinkSync(filePath);

        // Send success response
        res.json({
            message: 'File uploaded and data stored successfully.',
            storedData: data,  // Return the data inserted
        });
    } catch (error) {
        console.log(error);

        res.status(500).json({ message: `Error processing file: ${error.message}` });
    }
};


// Function to convert Excel serial date to JavaScript Date
const excelDateToJSDate = (serial) => {
    const epoch = new Date(1899, 11, 30);  // Excel's epoch (December 30, 1899)
    const millisecondsPerDay = 86400000;  // Number of milliseconds in a day
    return new Date(epoch.getTime() + serial * millisecondsPerDay);
};
module.exports = { getAlluser, getUserByID, addUser, updateUserByID, deleteUserByID, uploadFile }