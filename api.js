const fs = require("node:fs")
const express = require("express")
const path = require("node:path")
const app = express()
const port = 4567
app.use(express.json())
const pc = require("picocolors")
const juegos = require("./BDD/juegos.json")
const compras = require("./BDD/compras.json")


const RUTA_JUEGOS = path.join(__dirname, "BDD", "juegos.json")
const RUTA_COMPRAS = path.join(__dirname, "BDD", "compras.json")

app.use((req, res, next) => {
    res.on('finish', () => {
        const color = res.statusCode >= 400 ? pc.red(res.statusCode) : pc.green(res.statusCode)
        console.log(`[${req.method}], ${req.url}, ${color}`)
    })
    next()
})

app.get("/api/juegos", (req,res) => {
    res.status(200).json(juegos)
})

app.get("/api/juegos/:id", (req, res) => {
    const ide = Number(req.params.id)
    const juego = juegos.find(j => j.id === ide)
    if (!juego) {
        res.status(404).json({error: "juego no encontrado"})
    } else {
        res.status(200).json(juego)
    }
})

app.post("/api/juegos", (req, res) => {
    const nuevo = {
    id: juegos.length + 1,
    titulo: req.body.titulo,
    desarrollador: req.body.desarrollador,
    anio: req.body.anio,
    genero: req.body.genero,
    precio: req.body.precio,
    retirado: false,
    copiasVendidas: 0,
    }
    juegos.push(nuevo)
    fs.writeFileSync(RUTA_JUEGOS, JSON.stringify(juegos, null, 2))
    res.status(201).json(nuevo)
})

app.put("/api/juegos/:id", (req, res) => {
    const ide = Number(req.params.id)
    const index = juegos.findIndex(i => i.id === ide)
    if (index === -1) {
        res.status(404).json({error: "juego no encontrado"})
    } else {
        juegos[index] = {
            id: ide,
            titulo: req.body.titulo || juegos[index].titulo,
            desarrollador: req.body.desarrollador || juegos[index].desarrollador,
            anio: req.body.anio || juegos[index].anio,
            genero: req.body.genero || juegos[index].genero,
            precio: req.body.precio || juegos[index].precio,
            retirado: juegos[index].retirado,
            copiasVendidas: juegos[index].copiasVendidas,            
        }
        fs.writeFileSync(RUTA_JUEGOS, JSON.stringify(juegos, null, 2))
        res.status(200).json(juegos[index])
    }
})

app.delete("/api/juegos/:id", (req, res) => {
    const ide = Number(req.params.id)
    const index = juegos.findIndex(j => j.id === ide)

    if (index === -1) {
        return res.status(404).json({ error: "Juego no encontrado" })
    }
    const juego = juegos[index]
    const compraactiva = compras.find(c => c.juegoId === juego.id && c.estado === "Activa")

    if (compraactiva) {
        return res.status(409).json({ error: "El juego tiene una compra activa" })
    }

    juegos.splice(index, 1)
    fs.writeFileSync(RUTA_JUEGOS, JSON.stringify(juegos, null, 2))
    res.status(200).send("Juego borrado correctamente")
})


app.delete("/api/juegos/titulo/:titulo", (req, res) => {
    const ttl = req.params.titulo
    const index = juegos.findIndex(j => j.titulo === ttl)

    if (index === -1) {
        return res.status(404).json({ error: "Juego no encontrado" })
    }
    const juego = juegos[index]
    const compraactiva = compras.find(c => c.juegoId === juego.id && c.estado === "Activa")

    if (compraactiva) {
        return res.status(409).json({ error: "El juego tiene una compra activa" })
    }

    const eliminado = juegos.splice(index, 1)
    fs.writeFileSync(RUTA_JUEGOS , JSON.stringify(juegos, null, 2))
    res.json(eliminado)
    
})

app.get("/api/compras", (req,res) => {
    res.status(200).json(compras)
})

app.get("/api/compras/:titulo", (req, res) => {
    const ttl = req.params.titulo
    const juego = juegos.find(j => j.titulo === ttl)

    if (!juego) {
        return res.status(404).json({ error: "Juego no encontrado" })
    }

    const resultado = compras.filter(c => c.juegoId === juego.id)
    res.json(resultado)
})

app.post("/api/compras", (req, res) => {

})

app.put("/api/compras/:codigo/reembolsar", (req, res) => {
    const cod = req.params.codigo
    const index = compras.findIndex(c => c.codigo === cod)
    if (index === -1) {
        return res.status(404).json({ error: "Compra no existe" })
    }
    if (compras[index].estado === "Reembolsada") {
        return res.status(409).json({ error: "Compra ya reembolsada" })
    }
    compras[index].estado = "Reembolsada"
    const juego = juegos.find(j => j.id === compras[index].juegoId)
    if (juego) {
        juego.copiasVendidas = juego.copiasVendidas - 1
    }
    fs.writeFileSync(RUTA_COMPRAS, JSON.stringify(compras, null, 2))
    fs.writeFileSync(RUTA_JUEGOS, JSON.stringify(juegos, null, 2))
    res.status(200).json(compras[index])
})


app.use((req, res) => {
    res.status(404).json({error: "PAGINA NO ENCONTRADA"})
})

app.listen(port, () =>{
    console.log(`escuchando en puerto ${port}`)
})
