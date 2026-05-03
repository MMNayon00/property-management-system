require('dotenv').config();
const { fixExistingRecords, generateMonthlyRentRecords } = require('../src/lib/services/rent-tracker');

async function run() {
    try {
        console.log("Fixing existing records...");
        await fixExistingRecords();
        console.log("Existing records fixed.");

        console.log("Generating missing records...");
        await generateMonthlyRentRecords();
        console.log("Catch-up completed.");
    } catch (e) {
        console.error(e);
    }
}

run().finally(() => process.exit());
