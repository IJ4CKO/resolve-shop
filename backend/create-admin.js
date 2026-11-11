import "dotenv/config";
import pg from "pg";
import bcrypt from "bcryptjs";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

// The email and passwird come from settings you type when you run the script,
// so they are never written in the file or ssved in Git.
const email = process.env.NEW_ADMIN_EMAIL;
const password = process.env.NEW_ADMIN_PASSWORD;

async function createAdmin() {
    if (!email || !password || password.length < 12) {
        console.log("Set NEW_ADMIN_EMAIL and NEW_ADMIN_PASSWORD (at least 12 characters) first.");
        await pool.end();
        return;
    }

    // Scramble the password. The 12 is how much work the hashing does: higher is slower and safer.
    const hash = await bcrypt.hash(password, 12);

    await pool.query(
        "INSERT INTO users (email, password_hash, role) VALUES ($1, $2, 'admin')",
        [email, hash]
    );

    console.log("Admin created: " + email);
    await pool.end();
}

createAdmin();
