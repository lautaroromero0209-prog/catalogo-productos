
import express, { Request, Response } from "express";
import mysql from "mysql2/promise";
import dotenv from "dotenv";
import path from "node:path";

// Cargar las variables del archivo .env ubicado en la carpeta principal.
dotenv.config({
    path: path.resolve(__dirname, "../../.env")
});

const app = express();
const PORT = 3000;

// Permitir recibir datos en formato JSON.
app.use(express.json());

// Configuración de la conexión a MySQL/MariaDB.
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 5
});

// Servir los archivos del proyecto.
const carpetaPrincipal = path.resolve(__dirname, "../..");

app.get("/", (_req: Request, res: Response) => {
    res.sendFile(path.join(carpetaPrincipal, "index.html"));
});

app.get("/estilos.css", (_req: Request, res: Response) => {
    res.sendFile(path.join(carpetaPrincipal, "estilos.css"));
});

app.use("/dist", express.static(path.join(carpetaPrincipal, "dist")));

// Obtener todas las categorías.
app.get("/api/categorias", async (_req: Request, res: Response) => {
    try {
        const [categorias] = await pool.query(
            "SELECT id, nombre FROM categorias ORDER BY nombre"
        );

        res.status(200).json(categorias);
    } catch (error) {
        console.error("Error al obtener categorías:", error);
        res.status(500).json({
            mensaje: "Error al obtener las categorías."
        });
    }
});

// Obtener todos los productos.
app.get("/api/productos", async (_req: Request, res: Response) => {
    try {
        const [productos] = await pool.query(`
            SELECT
                p.id,
                p.nombre,
                p.id_categoria AS idCategoria,
                c.nombre AS categoria,
                p.precio,
                p.stock
            FROM productos p
            INNER JOIN categorias c
                ON p.id_categoria = c.id
            ORDER BY p.id DESC
        `);

        res.status(200).json(productos);
    } catch (error) {
        console.error("Error al obtener productos:", error);
        res.status(500).json({
            mensaje: "Error al obtener los productos."
        });
    }
});

// Agregar un producto nuevo.
app.post("/api/productos", async (req: Request, res: Response) => {
    try {
        const { nombre, idCategoria, precio, stock } = req.body;

        // Validar el nombre.
        if (
            typeof nombre !== "string" ||
            nombre.trim().length === 0 ||
            nombre.trim().length > 100
        ) {
            res.status(400).json({
                mensaje: "El nombre debe tener entre 1 y 100 caracteres."
            });
            return;
        }

        // Validar la categoría.
        if (
            !Number.isInteger(Number(idCategoria)) ||
            Number(idCategoria) <= 0
        ) {
            res.status(400).json({
                mensaje: "La categoría seleccionada no es válida."
            });
            return;
        }

        // Validar el precio.
        if (
            precio === undefined ||
            precio === null ||
            precio === "" ||
            !Number.isFinite(Number(precio)) ||
            Number(precio) < 0
        ) {
            res.status(400).json({
                mensaje: "El precio debe ser un número mayor o igual a cero."
            });
            return;
        }

        // Validar el stock.
        if (
            stock === undefined ||
            stock === null ||
            stock === "" ||
            !Number.isInteger(Number(stock)) ||
            Number(stock) < 0
        ) {
            res.status(400).json({
                mensaje: "El stock debe ser un número entero mayor o igual a cero."
            });
            return;
        }

        // Insertar el producto utilizando parámetros.
        const [resultado] = await pool.execute(
            `INSERT INTO productos
                (nombre, id_categoria, precio, stock)
             VALUES (?, ?, ?, ?)`,
            [
                nombre.trim(),
                Number(idCategoria),
                Number(precio),
                Number(stock)
            ]
        );

        res.status(201).json({
            mensaje: "Producto agregado correctamente.",
            id: (resultado as mysql.ResultSetHeader).insertId
        });

    } catch (error) {
        console.error("Error al agregar producto:", error);

        res.status(500).json({
            mensaje: "Error al guardar el producto."
        });
    }
});

// Iniciar el servidor después de comprobar la conexión a la base de datos.
async function iniciarServidor(): Promise<void> {
    try {
        await pool.query("SELECT 1");

        app.listen(PORT, "127.0.0.1", () => {
            console.log(`Servidor funcionando en http://127.0.0.1:${PORT}`);
        });
    } catch (error) {
        console.error("No se pudo conectar con la base de datos:", error);
        process.exit(1);
    }
}

void iniciarServidor();
