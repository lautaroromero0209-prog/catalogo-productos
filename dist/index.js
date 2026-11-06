"use strict";
// DIRECCIÓN DE LA API
const API_URL = "/api";
document.addEventListener("DOMContentLoaded", () => {
    // DATOS
    let productos = [];
    let categorias = [];
    // ELEMENTOS DEL HTML
    const form = document.querySelector("#formProducto");
    const mensaje = document.querySelector("#mensaje");
    const nombre = document.querySelector("#nombre");
    const categoria = document.querySelector("#categoria");
    const precio = document.querySelector("#precio");
    const stock = document.querySelector("#stock");
    const buscador = document.querySelector("#filtroNombre");
    const filtroCategoria = document.querySelector("#filtroCategoria");
    const filtroStock = document.querySelector("#filtroStock");
    const precioMaximo = document.querySelector("#precioMaximo");
    const productosContainer = document.querySelector("#productos");
    const totalProductos = document.querySelector("#totalProductos");
    const stockTotal = document.querySelector("#stockTotal");
    const valorTotal = document.querySelector("#valorTotal");
    const agotados = document.querySelector("#agotados");
    // ESCAPAR TEXTO PARA MOSTRARLO DE FORMA SEGURA EN HTML
    function escaparHTML(texto) {
        return texto.replace(/[&<>"']/g, (caracter) => {
            const caracteres = {
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#039;"
            };
            return caracteres[caracter];
        });
    }
    // CARGAR CATEGORÍAS DESDE LA API
    async function cargarCategorias() {
        if (categoria === null || filtroCategoria === null) {
            return;
        }
        try {
            const respuesta = await fetch(`${API_URL}/categorias`);
            if (!respuesta.ok) {
                throw new Error("No se pudieron cargar las categorías.");
            }
            categorias = await respuesta.json();
            // CATEGORÍAS DEL FORMULARIO
            categoria.innerHTML = '<option value="">Seleccionar categoría</option>';
            categorias.forEach((categoriaActual) => {
                const opcion = document.createElement("option");
                opcion.value = String(categoriaActual.id);
                opcion.textContent = categoriaActual.nombre;
                categoria.appendChild(opcion);
            });
            // CATEGORÍAS DEL FILTRO
            actualizarCategoriasFiltro();
        }
        catch (error) {
            console.error(error);
            categoria.innerHTML = '<option value="">Error al cargar categorías</option>';
            if (mensaje !== null) {
                mensaje.textContent = "No se pudieron cargar las categorías.";
            }
        }
    }
    // ACTUALIZAR EL FILTRO DE CATEGORÍAS
    function actualizarCategoriasFiltro() {
        if (filtroCategoria === null) {
            return;
        }
        const categoriaActual = filtroCategoria.value;
        filtroCategoria.innerHTML =
            '<option value="">Todas las categorías</option>';
        categorias.forEach((categoriaProducto) => {
            const opcion = document.createElement("option");
            opcion.value = categoriaProducto.nombre;
            opcion.textContent = categoriaProducto.nombre;
            filtroCategoria.appendChild(opcion);
        });
        if (categorias.some((item) => item.nombre === categoriaActual)) {
            filtroCategoria.value = categoriaActual;
        }
    }
    // CARGAR PRODUCTOS DESDE LA API
    async function cargarProductos() {
        try {
            const respuesta = await fetch(`${API_URL}/productos`);
            if (!respuesta.ok) {
                throw new Error("No se pudieron cargar los productos.");
            }
            const datos = await respuesta.json();
            productos = datos.map((producto) => ({
                ...producto,
                precio: Number(producto.precio),
                stock: Number(producto.stock)
            }));
            renderizar();
        }
        catch (error) {
            console.error(error);
            if (productosContainer !== null) {
                productosContainer.textContent =
                    "No se pudieron cargar los productos. Revisá la conexión con el servidor.";
            }
        }
    }
    // MOSTRAR PRODUCTOS
    function renderizar() {
        if (productosContainer === null) {
            return;
        }
        const productosFiltrados = obtenerProductosFiltrados();
        if (productosFiltrados.length === 0) {
            productosContainer.innerHTML =
                `<div class="sin-resultados">
                    No hay productos que coincidan con los filtros.
                </div>`;
        }
        else {
            productosContainer.innerHTML = productosFiltrados
                .map((producto) => {
                let claseStock = "";
                if (producto.stock === 0) {
                    claseStock = "agotado";
                }
                else if (producto.stock <= 5) {
                    claseStock = "bajo";
                }
                const textoStock = producto.stock === 0
                    ? "Agotado"
                    : `${producto.stock} en stock`;
                return `
                        <article class="producto">

                            <div class="producto-arriba">

                                <span class="categoria">
                                    ${escaparHTML(producto.categoria)}
                                </span>

                                <span class="stock ${claseStock}">
                                    ${textoStock}
                                </span>

                            </div>

                            <h3>
                                ${escaparHTML(producto.nombre)}
                            </h3>

                            <strong>
                                $ ${producto.precio.toLocaleString("es-AR")}
                            </strong>

                        </article>
                    `;
            })
                .join("");
        }
        actualizarResumen();
    }
    // FILTRAR PRODUCTOS
    function obtenerProductosFiltrados() {
        let texto = "";
        let categoriaSeleccionada = "";
        let stockSeleccionado = "";
        let precioMaximoValor = 0;
        if (buscador !== null) {
            texto = buscador.value.toLowerCase().trim();
        }
        if (filtroCategoria !== null) {
            categoriaSeleccionada = filtroCategoria.value;
        }
        if (filtroStock !== null) {
            stockSeleccionado = filtroStock.value;
        }
        if (precioMaximo !== null) {
            precioMaximoValor = Number(precioMaximo.value);
        }
        return productos.filter((producto) => {
            const coincideNombre = producto.nombre.toLowerCase().includes(texto);
            const coincideCategoria = categoriaSeleccionada === "" ||
                producto.categoria === categoriaSeleccionada;
            const coincidePrecio = precioMaximo === null ||
                precioMaximo.value === "" ||
                producto.precio <= precioMaximoValor;
            let coincideStock = true;
            if (stockSeleccionado === "disponible") {
                coincideStock = producto.stock > 0;
            }
            if (stockSeleccionado === "agotado") {
                coincideStock = producto.stock === 0;
            }
            if (stockSeleccionado === "bajo") {
                coincideStock =
                    producto.stock > 0 && producto.stock <= 5;
            }
            return (coincideNombre &&
                coincideCategoria &&
                coincidePrecio &&
                coincideStock);
        });
    }
    // ACTUALIZAR RESUMEN
    function actualizarResumen() {
        const cantidadProductos = productos.length;
        const cantidadStock = productos.reduce((total, producto) => total + producto.stock, 0);
        const valorInventario = productos.reduce((total, producto) => total + producto.precio * producto.stock, 0);
        const cantidadAgotados = productos.filter((producto) => producto.stock === 0).length;
        if (totalProductos !== null) {
            totalProductos.textContent = String(cantidadProductos);
        }
        if (stockTotal !== null) {
            stockTotal.textContent = String(cantidadStock);
        }
        if (valorTotal !== null) {
            valorTotal.textContent =
                "$ " + valorInventario.toLocaleString("es-AR");
        }
        if (agotados !== null) {
            agotados.textContent = String(cantidadAgotados);
        }
    }
    // AGREGAR PRODUCTO A LA BASE DE DATOS
    if (form !== null &&
        mensaje !== null &&
        nombre !== null &&
        categoria !== null &&
        precio !== null &&
        stock !== null) {
        form.addEventListener("submit", async (event) => {
            event.preventDefault();
            const nombreProducto = nombre.value.trim();
            const idCategoria = Number(categoria.value);
            const precioProducto = Number(precio.value);
            const stockProducto = Number(stock.value);
            // VALIDACIONES
            if (nombreProducto === "") {
                mensaje.textContent = "El nombre es obligatorio.";
                return;
            }
            if (categoria.value === "" || !Number.isInteger(idCategoria)) {
                mensaje.textContent = "Seleccioná una categoría.";
                return;
            }
            if (precio.value === "" ||
                !Number.isFinite(precioProducto) ||
                precioProducto < 0) {
                mensaje.textContent = "Ingresá un precio válido.";
                return;
            }
            if (stock.value === "" ||
                !Number.isInteger(stockProducto) ||
                stockProducto < 0) {
                mensaje.textContent = "Ingresá un stock válido.";
                return;
            }
            // DATOS QUE SE ENVÍAN A LA API
            const nuevoProducto = {
                nombre: nombreProducto,
                idCategoria: idCategoria,
                precio: precioProducto,
                stock: stockProducto
            };
            try {
                const respuesta = await fetch(`${API_URL}/productos`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(nuevoProducto)
                });
                const resultado = await respuesta.json();
                if (!respuesta.ok) {
                    throw new Error(resultado.error || "No se pudo agregar el producto.");
                }
                // LIMPIAR FORMULARIO
                form.reset();
                // MENSAJE
                mensaje.textContent = "Producto agregado correctamente.";
                // ACTUALIZAR PRODUCTOS DESDE LA BASE DE DATOS
                await cargarProductos();
                // LIMPIAR MENSAJE DESPUÉS DE 2 SEGUNDOS
                setTimeout(() => {
                    mensaje.textContent = "";
                }, 2000);
            }
            catch (error) {
                console.error(error);
                if (error instanceof Error) {
                    mensaje.textContent = error.message;
                }
                else {
                    mensaje.textContent = "Ocurrió un error al agregar el producto.";
                }
            }
        });
    }
    // EVENT LISTENERS DE FILTROS
    if (buscador !== null) {
        buscador.addEventListener("input", () => renderizar());
    }
    if (filtroCategoria !== null) {
        filtroCategoria.addEventListener("change", () => renderizar());
    }
    if (filtroStock !== null) {
        filtroStock.addEventListener("change", () => renderizar());
    }
    if (precioMaximo !== null) {
        precioMaximo.addEventListener("input", () => renderizar());
    }
    // INICIAR APLICACIÓN
    async function iniciarAplicacion() {
        await cargarCategorias();
        await cargarProductos();
    }
    iniciarAplicacion();
});
