import "dotenv/config";
import pg from "pg";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

const sizes = ["S", "M", "L", "XL", "XXL"];
const stock = 20;

// Each entry is one product. The image path is built from folder, prefix, colour and ext.
const catalogue = [
  { name: "T-Shirt", category: "T-Shirts", price: 20, folder: "T-shirt", prefix: "tshirt", ext: "png",
    colours: ["Black", "Burgundy", "Cream", "Light Grey", "Royal Blue", "White"] },
  { name: "Hoodie", category: "Hoodies", price: 40, folder: "Hoodie", prefix: "hoodie", ext: "webp",
    colours: ["Black", "Burgundy", "Cream", "Light Grey", "Royal Blue", "White"] },
  { name: "Jeans", category: "Jeans", price: 45, folder: "Jeans", prefix: "Jeans", ext: "png",
    colours: ["Blue", "Light Grey", "Dark Grey"] },
  { name: "Joggers", category: "Joggers", price: 35, folder: "Joggers", prefix: "joggers", ext: "png",
    colours: ["Black", "Light Grey", "Navy Blue"] },
  { name: "Quarter Zip", category: "Quarter Zips", price: 30, folder: "Quarter Zip", prefix: "quarter-zip", ext: "png",
    colours: ["Black", "Burgundy", "Cream", "Light Grey", "Royal Blue", "White"] },
  { name: "Polo Shirt", category: "Polo Shirts", price: 40, folder: "Polo Shirts", prefix: "poloshirt", ext: "png",
    colours: ["Black", "Burgundy", "Cream", "Light Grey", "Royal Blue", "White"] }
];


//The seed makes 150 variants from 6 products because it loops over each product, then each of its colours, 
// then each of the 5 sizes, and inserts one variant for each combination. Each one starts with 20 in stock,
// so the Black Hoodie in M and the White Hoodie in M are counted separately.
async function seed() {
    // Stop if product already exists, so running it twice doesn't duplicate everything.
    const existing = await pool.query("SELECT COUNT(*) FROM products");
    if (Number(existing.rows[0].count) > 0) {
        console.log("Products already exist, nothing to do.");
        await pool.end();
        return;
    }

    for (const item of catalogue) {
        // 1. Insert the product, and get its new id back.
        const productResult = await pool.query(
            "INSERT INTO products (name, category, base_price) VALUES ( $1, $2, $3) RETURNING id",
            [item.name, item.category, item.price]
        );
        const productId = productResult.rows[0].id;

        for (const colour of item.colours) {
            const slug = colour.toLowerCase().replace(/ /g, "")
            const image = "/" + item.folder + "/" + item.prefix + "-" + slug + "." + item.ext;

            for (const size of sizes) {
                // 2. Insert one variant for this colour and size.
                await pool.query(
                    "INSERT INTO variants (product_id, colour, size, image, stock) VALUES ( $1, $2, $3, $4, $5)",
                    [productId, colour, size, image, stock]
                );
            }
        }
    }

    console.log("Seeded.");
    await pool.end();
}

seed();